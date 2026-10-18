"""Coordinator Agent module for RippleMesh.

Synthesizes incident evidence, triggers Gemma thinking-mode triage inference,
enforces strict code-level guardrails, records triage decisions into SQLite,
calculates priority score using the scoring service, flags unverified high-urgency incidents,
and emits TRIAGED and VERIFY_REQUEST inter-agent notifications.
"""
import uuid
import json
from typing import Any, Dict, List, Optional
from backend.config import MODEL_NAME
from backend.db.database import get_db
from backend.agents.gemma_client import ask_gemma
from backend.agents.reporter import text_mentions_person
from backend.services.scoring import priority as compute_priority
from backend.services.messaging import send_message

COORDINATOR_SYSTEM_PROMPT = (
    "You are the Coordinator agent in a disaster-response mesh. Fill ONLY this JSON: "
    "{life_threat: now|soon|none, time_to_harm: seconds|minutes|hours, "
    "vulnerability: [child|elderly|injured|disabled], rescuable_in_time: 0-1, "
    "responder_type: fire|ndrf|ambulance|pwd|police|volunteer, reasoning: two plain sentences}. "
    "Judge by what is shown and said, not by how many people reported it. "
    "One report of a person drowning outranks hundreds of reports of a person standing near water. "
    "Never assume a person is present unless a report says so."
)

ALLOWED_LIFE_THREAT = {"now", "soon", "none"}
ALLOWED_TIME_TO_HARM = {"seconds", "minutes", "hours"}
ALLOWED_RESPONDER_TYPES = {"fire", "ndrf", "ambulance", "pwd", "police", "volunteer"}
ALLOWED_VULNERABILITY = {"child", "elderly", "injured", "disabled"}

def triage(incident_id: str) -> Dict[str, Any]:
    """Perform triage assessment for an incident.

    Rules:
    - Gather the incident's reports, their transcripts, and verification notes.
    - Call ask_gemma with json_mode=True, thinking=True, num_predict=600 and COORDINATOR_SYSTEM_PROMPT.
    - Validate every field to allowed values, clamp rescuable_in_time (0-1), safe defaults.
    - CODE GUARD: If none of the transcripts mention a person (text_mentions_person),
      force life_threat to at most 'soon' and vulnerability to [], and append note to reasoning.
    - Save to triage table, compute priority_score with scoring.priority(), update incident status to 'triaged'.
    - If life_threat is 'now' and confidence is below 0.6: set incidents.unverified = 1 and send
      VERIFY_REQUEST message from "coordinator" to "all".
    - Send TRIAGED message from "coordinator" to "dispatcher".

    Returns:
        Dictionary of saved triage row.
    """
    with get_db() as conn:
        # Fetch incident
        cursor_inc = conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
        inc_row = cursor_inc.fetchone()
        if not inc_row:
            raise ValueError(f"Incident not found: {incident_id}")
        incident = dict(inc_row)

        # Gather linked reports, transcripts, verification notes
        cursor_reps = conn.execute(
            """
            SELECT r.report_id, r.transcript, r.summary, r.hazard_type, r.reporter_conf,
                   r.claim_matches_photo, v.notes, v.trust_score
            FROM reports r
            JOIN incident_reports ir ON r.report_id = ir.report_id
            LEFT JOIN verifications v ON r.report_id = v.report_id
            WHERE ir.incident_id = ?
            ORDER BY r.created_at ASC
            """,
            (incident_id,),
        )
        reports = [dict(r) for r in cursor_reps.fetchall()]

    transcripts = [r.get("transcript") or "" for r in reports if r.get("transcript")]
    notes_list = [r.get("notes") or "" for r in reports if r.get("notes")]

    user_text_parts = [
        f"Incident ID: {incident_id}",
        f"Hazard: {incident.get('hazard_type')}",
        f"Independent Reports: {incident.get('independent_reports', 1)}",
        f"Confidence Score: {incident.get('confidence', 0.5)}",
        "\nWitness Reports / Transcripts:"
    ]
    for i, t in enumerate(transcripts, start=1):
        user_text_parts.append(f"  {i}. \"{t}\"")
    if notes_list:
        user_text_parts.append("\nVerification Notes:")
        for n in notes_list:
            user_text_parts.append(f"  - {n}")

    user_prompt = "\n".join(user_text_parts)

    # Call ask_gemma with json_mode=True, thinking=True, num_predict=600
    raw_ai = ask_gemma(
        system_prompt=COORDINATOR_SYSTEM_PROMPT,
        user_text=user_prompt,
        json_mode=True,
        thinking=True,
        num_predict=600
    )

    if not isinstance(raw_ai, dict):
        raw_ai = {}

    # Validate fields with safe defaults
    life_threat = str(raw_ai.get("life_threat", "soon")).lower().strip()
    if life_threat not in ALLOWED_LIFE_THREAT:
        life_threat = "soon"

    time_to_harm = str(raw_ai.get("time_to_harm", "minutes")).lower().strip()
    if time_to_harm not in ALLOWED_TIME_TO_HARM:
        time_to_harm = "minutes"

    try:
        rescuable_in_time = float(raw_ai.get("rescuable_in_time", 0.5))
        rescuable_in_time = max(0.0, min(1.0, rescuable_in_time))
    except (ValueError, TypeError):
        rescuable_in_time = 0.5

    responder_type = str(raw_ai.get("responder_type", "ndrf")).lower().strip()
    if responder_type not in ALLOWED_RESPONDER_TYPES:
        responder_type = "ndrf"

    vulnerability_raw = raw_ai.get("vulnerability", [])
    if isinstance(vulnerability_raw, list):
        vulnerability = [str(v).lower().strip() for v in vulnerability_raw if str(v).lower().strip() in ALLOWED_VULNERABILITY]
    else:
        vulnerability = []

    reasoning = str(raw_ai.get("reasoning", "Emergency situation assessed from field reports and imagery."))

    # CODE GUARD: if none of the incident's transcripts mention a person,
    # force life_threat to at most 'soon' and vulnerability to [], and append note to reasoning.
    any_person_mentioned = any(text_mentions_person(t) for t in transcripts)
    if not any_person_mentioned:
        if life_threat == "now":
            life_threat = "soon"
        vulnerability = []
        reasoning += " (person flag capped: no report mentions a person)"

    # Compute priority score
    inc_confidence = float(incident.get("confidence", 0.5))
    priority_val = compute_priority(
        life_threat=life_threat,
        time_to_harm=time_to_harm,
        rescuable_in_time=rescuable_in_time,
        vulnerability=vulnerability,
        confidence_val=inc_confidence
    )

    triage_id = f"tri-{uuid.uuid4().hex[:8]}"
    vulnerability_json = json.dumps(vulnerability)

    with get_db() as conn:
        # Save triage row
        conn.execute(
            """
            INSERT INTO triage (
                triage_id, incident_id, life_threat, time_to_harm, vulnerability,
                rescuable_in_time, responder_type, reasoning, model_used
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                triage_id,
                incident_id,
                life_threat,
                time_to_harm,
                vulnerability_json,
                rescuable_in_time,
                responder_type,
                reasoning,
                MODEL_NAME
            ),
        )

        # Handle unverified flag for critical 'now' cases with low confidence
        is_unverified = 1 if (life_threat == "now" and inc_confidence < 0.6) else 0

        # Update incident status and priority
        conn.execute(
            """
            UPDATE incidents
            SET priority_score = ?,
                status = 'triaged',
                unverified = ?,
                last_updated_at = CURRENT_TIMESTAMP
            WHERE incident_id = ?
            """,
            (priority_val, is_unverified, incident_id),
        )

        cursor_saved = conn.execute("SELECT * FROM triage WHERE triage_id = ?", (triage_id,))
        saved_triage = dict(cursor_saved.fetchone())

    # If life_threat is 'now' and confidence < 0.6: send VERIFY_REQUEST message
    if is_unverified:
        send_message(
            from_agent="coordinator",
            to_agent="all",
            msg_type="VERIFY_REQUEST",
            body={
                "incident_id": incident_id,
                "hazard_type": incident.get("hazard_type"),
                "lat": incident.get("lat"),
                "lng": incident.get("lng"),
                "life_threat": life_threat,
                "confidence": inc_confidence,
                "action": "Urgent verification requested from nearby mesh devices."
            },
            ref_id=incident_id
        )

    # Send TRIAGED from "coordinator" to "dispatcher"
    send_message(
        from_agent="coordinator",
        to_agent="dispatcher",
        msg_type="TRIAGED",
        body={
            "incident_id": incident_id,
            "triage_id": triage_id,
            "life_threat": life_threat,
            "time_to_harm": time_to_harm,
            "priority_score": priority_val,
            "responder_type": responder_type,
            "unverified": is_unverified,
            "rescuable_in_time": rescuable_in_time,
            "reasoning": reasoning
        },
        ref_id=incident_id
    )

    return saved_triage


class CoordinatorAgent:
    """Class wrapper for compatibility."""

    def __init__(self, client=None):
        self.client = client

    def evaluate_incident(self, incident_id: str) -> Dict[str, Any]:
        return triage(incident_id)
