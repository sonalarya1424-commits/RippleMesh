"""Routes for incident management, clustering, and review."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
from backend.db.database import get_db

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class IncidentCreate(BaseModel):
    hazard_type: str = Field(..., example="flood")
    lat: Optional[float] = Field(None, example=15.8523)
    lng: Optional[float] = Field(None, example=74.5085)

@router.get("/", response_model=List[Dict[str, Any]])
def list_incidents(include_closed: bool = False):
    """All incidents sorted by priority_score descending with comprehensive summary fields.
    Excludes status 'resolved', 'rejected', and 'false_alarm' by default; add ?include_closed=true to include them.
    """
    closed_filter = ""
    if not include_closed:
        closed_filter = "AND i.status NOT IN ('resolved', 'rejected', 'false_alarm')"

    with get_db() as conn:
        cursor = conn.execute(
            f"""
            SELECT i.incident_id, i.hazard_type, i.lat, i.lng, i.confidence,
                   i.independent_reports, i.status, i.priority_score, i.unverified,
                   t.life_threat, t.reasoning, t.model_used,
                   (
                       SELECT AVG(COALESCE(v.trust_score, r.reporter_conf, 0.7))
                       FROM incident_reports ir
                       JOIN reports r ON ir.report_id = r.report_id
                       LEFT JOIN verifications v ON r.report_id = v.report_id
                       WHERE ir.incident_id = i.incident_id
                   ) as trust,
                   (
                       SELECT dispatch_id
                       FROM dispatches
                       WHERE incident_id = i.incident_id
                       ORDER BY dispatched_at DESC
                       LIMIT 1
                   ) as pending_dispatch_id
            FROM incidents i
            LEFT JOIN (
                SELECT incident_id, life_threat, reasoning, model_used
                FROM triage
                WHERE triage_id IN (SELECT MAX(triage_id) FROM triage GROUP BY incident_id)
            ) t ON i.incident_id = t.incident_id
            WHERE i.hazard_type != 'none'
            {closed_filter}
            ORDER BY i.priority_score DESC, i.last_updated_at DESC
            """
        )
        rows = [dict(r) for r in cursor.fetchall()]
        for r in rows:
            r["trust"] = round(float(r["trust"] or 0.7), 2)
            r["unverified"] = bool(r["unverified"])
        return rows

@router.get("/{incident_id}")
def get_incident_provenance(incident_id: str):
    """Provenance chain: every report, each verification note, triage reasoning, and dispatches."""
    with get_db() as conn:
        cursor_inc = conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
        inc = cursor_inc.fetchone()
        if not inc:
            raise HTTPException(status_code=404, detail="Incident not found")
        incident_data = dict(inc)
        incident_data["unverified"] = bool(incident_data.get("unverified"))

        # 1. Linked reports with verifications
        cursor_reports = conn.execute(
            """
            SELECT r.report_id, r.device_id, r.lat, r.lng, r.hazard_type, r.summary,
                   r.transcript, r.reporter_conf, r.capture_mode, r.phash, r.image_path,
                   r.claim_matches_photo, r.people_at_risk, r.vulnerable, r.time_to_harm_guess,
                   r.created_at,
                   v.verification_id, v.trust_score, v.in_app_capture, v.duplicate_of,
                   v.claim_photo_match, v.notes as verification_notes
            FROM reports r
            JOIN incident_reports ir ON r.report_id = ir.report_id
            LEFT JOIN verifications v ON r.report_id = v.report_id
            WHERE ir.incident_id = ?
            ORDER BY r.created_at ASC
            """,
            (incident_id,),
        )
        reports = [dict(r) for r in cursor_reports.fetchall()]

        # 2. Triage records
        cursor_triage = conn.execute(
            """
            SELECT triage_id, life_threat, time_to_harm, vulnerability,
                   rescuable_in_time, responder_type, reasoning, model_used, created_at
            FROM triage
            WHERE incident_id = ?
            ORDER BY created_at DESC
            """,
            (incident_id,),
        )
        triage_records = [dict(t) for t in cursor_triage.fetchall()]

        # 3. Dispatches
        cursor_dsp = conn.execute(
            """
            SELECT d.dispatch_id, d.responder_id, d.approval_status, d.approved_by,
                   d.task_card, d.dispatched_at, d.outcome, d.outcome_at,
                   resp.name as responder_name, resp.type as responder_type, resp.contact as responder_contact
            FROM dispatches d
            LEFT JOIN responders resp ON d.responder_id = resp.responder_id
            WHERE d.incident_id = ?
            ORDER BY d.dispatched_at DESC
            """,
            (incident_id,),
        )
        dispatches = [dict(d) for d in cursor_dsp.fetchall()]

        incident_data["reports"] = reports
        incident_data["triage"] = triage_records
        incident_data["dispatches"] = dispatches

        return incident_data
