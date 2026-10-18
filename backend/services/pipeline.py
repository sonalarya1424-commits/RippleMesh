"""Pipeline orchestration service.

Executes end-to-end agent workflow:
reporter.create_report -> verifier.verify -> corroboration.cluster_report -> coordinator.triage -> dispatcher.build_task_card
"""
from typing import Any, Dict, Optional
from backend.agents.reporter import create_report
from backend.agents.verifier import verify
from backend.agents.corroboration import cluster_report
from backend.agents.coordinator import triage
from backend.agents.dispatcher import build_task_card

def run_pipeline(
    device_id: Optional[str],
    transcript: str,
    image_path: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    capture_mode: str = "in_app"
) -> Dict[str, Any]:
    """Runs the full agent pipeline sequentially with descriptive error boundary handling.

    Returns:
        {report_id, incident_id, trust_score, confidence, priority_score, life_threat, unverified}
    """
    # Step 1: Reporter
    try:
        report_row = create_report(
            device_id=device_id,
            transcript_text=transcript,
            image_path=image_path,
            lat=lat,
            lng=lng,
            capture_mode=capture_mode
        )
        report_id = report_row["report_id"]
        hazard_type = report_row.get("hazard_type", "other")
    except Exception as e:
        raise RuntimeError(f"Pipeline failed at step 'reporter.create_report': {e}") from e

    # If hazard_type is "none", save the report and send REPORT_DISMISSED message
    # Do NOT create or update an incident and do NOT run the Coordinator
    if hazard_type == "none":
        from backend.services.messaging import send_message
        send_message(
            from_agent="reporter",
            to_agent="coordinator",
            msg_type="REPORT_DISMISSED",
            body={
                "report_id": report_id,
                "reason": "no hazard visible",
                "hazard_type": "none",
                "device_id": device_id
            },
            ref_id=report_id,
            from_device=device_id
        )
        return {
            "report_id": report_id,
            "incident_id": None,
            "dismissed": True,
            "reason": "no hazard visible"
        }

    # Step 2: Verifier
    try:
        verification = verify(report_id)
        trust_score = verification.get("trust_score", 0.7)
    except Exception as e:
        raise RuntimeError(f"Pipeline failed at step 'verifier.verify': {e}") from e

    # Step 3: Corroboration
    try:
        incident = cluster_report(report_id)
        incident_id = incident["incident_id"]
    except Exception as e:
        raise RuntimeError(f"Pipeline failed at step 'corroboration.cluster_report': {e}") from e

    # Step 4: Coordinator Triage
    try:
        triage_row = triage(incident_id)
        life_threat = triage_row.get("life_threat", "soon")
    except Exception as e:
        raise RuntimeError(f"Pipeline failed at step 'coordinator.triage': {e}") from e

    # Step 5: Dispatcher Task Card
    try:
        task_card = build_task_card(incident_id)
        priority_val = task_card.get("priority", None)
    except Exception as e:
        raise RuntimeError(f"Pipeline failed at step 'dispatcher.build_task_card': {e}") from e

    # Extract final consolidated values from task_card / incident
    confidence_val = task_card.get("confidence", incident.get("confidence", 0.5))
    unverified_val = task_card.get("unverified", bool(incident.get("unverified", False)))
    
    # Priority can come from task card or DB
    from backend.db.database import get_db
    with get_db() as conn:
        cursor = conn.execute("SELECT priority_score, confidence, unverified FROM incidents WHERE incident_id = ?", (incident_id,))
        row = cursor.fetchone()
        if row:
            priority_val = row["priority_score"]
            confidence_val = row["confidence"]
            unverified_val = bool(row["unverified"])

    return {
        "report_id": report_id,
        "incident_id": incident_id,
        "trust_score": trust_score,
        "confidence": confidence_val,
        "priority_score": priority_val,
        "life_threat": life_threat,
        "unverified": unverified_val
    }
