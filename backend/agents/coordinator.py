"""Coordinator Agent module for RippleMesh.

Synthesizes incident evidence, triggers Gemma thinking-mode triage inference,
enforces strict code-level guardrails, records triage decisions into SQLite,
calculates priority score using the scoring service, flags unverified high-urgency incidents,
and emits TRIAGED and VERIFY_REQUEST inter-agent notifications.
"""
import uuid
import json
import re
from typing import Any, Dict, List, Optional
from backend.config import MODEL_NAME
from backend.db.database import get_db
from backend.agents.gemma_client import ask_gemma
from backend.agents.reporter import text_mentions_person
from backend.services.scoring import priority as compute_priority
from backend.services.messaging import send_message

COORDINATOR_SYSTEM_PROMPT = (
    "You are the Coordinator agent in a disaster-response mesh. Fill ONLY this JSON: "
    "{reasoning: one short sentence, life_threat: now|soon|none, time_to_harm: seconds|minutes|hours, "
    "vulnerability: [child|elderly|injured|disabled], rescuable_in_time: 0-1, "
    "responder_type: fire|ndrf|ambulance|pwd|police|volunteer}. "
    "Judge by what is shown and said, not by how many people reported it. "
    "One report of a person drowning outranks hundreds of reports of a person standing near water. "
    "Never assume a person is present unless a report says so."
)

ALLOWED_LIFE_THREAT = {"now", "soon", "none"}
ALLOWED_TIME_TO_HARM = {"seconds", "minutes", "hours"}
ALLOWED_RESPONDER_TYPES = {"fire", "ndrf", "ambulance", "pwd", "police", "volunteer"}
ALLOWED_VULNERABILITY = {"child", "elderly", "injured", "disabled"}

def salvage_triage(raw_text: str) -> tuple[Dict[str, Any], bool, List[str]]:
    """Attempts to salvage JSON fields when direct json.loads fails.
    
    1. Removes trailing commas.
    2. Uses regex to extract individual fields:
       - life_threat
       - time_to_harm
       - rescuable_in_time
       - responder_type
       - vulnerability
       - reasoning
    Returns:
        (salvaged_dict, is_partial, defaulted_fields)
    """
    import re
    # 1. Clean markdown / think tags
    cleaned = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL)
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if fence:
        cleaned = fence.group(1)

    # Try removing trailing commas before closing braces/brackets
    cleaned_commas = re.sub(r",\s*([\}\]])", r"\1", cleaned)
    try:
        from backend.agents.gemma_client import _extract_json
        parsed = _extract_json(cleaned_commas)
        if isinstance(parsed, dict) and parsed:
            return parsed, False, []
    except Exception:
        pass

    # 2. Extract fields individually using regex (supporting unquoted keys and values)
    salvaged: Dict[str, Any] = {}
    defaulted_fields: List[str] = []

    # reasoning: match until next key or comma/brace
    m_reason = re.search(r'["\']?reasoning["\']?\s*:\s*["\']([^"\']*)["\']', cleaned, re.IGNORECASE)
    if not m_reason:
        m_reason = re.search(r'["\']?reasoning["\']?\s*:\s*([^,\n\}]+)', cleaned, re.IGNORECASE)
    if m_reason:
        salvaged["reasoning"] = m_reason.group(1).strip()
    else:
        defaulted_fields.append("reasoning")

    # life_threat
    m_life = re.search(r'["\']?life_threat["\']?\s*:\s*["\']?(\w+)["\']?', cleaned, re.IGNORECASE)
    if m_life:
        salvaged["life_threat"] = m_life.group(1).strip().lower()
    else:
        defaulted_fields.append("life_threat")

    # time_to_harm
    m_harm = re.search(r'["\']?time_to_harm["\']?\s*:\s*["\']?(\w+)["\']?', cleaned, re.IGNORECASE)
    if m_harm:
        salvaged["time_to_harm"] = m_harm.group(1).strip().lower()
    else:
        defaulted_fields.append("time_to_harm")

    # rescuable_in_time
    m_resc = re.search(r'["\']?rescuable_in_time["\']?\s*:\s*([0-9]*\.?[0-9]+)', cleaned, re.IGNORECASE)
    if m_resc:
        try:
            salvaged["rescuable_in_time"] = float(m_resc.group(1))
        except ValueError:
            defaulted_fields.append("rescuable_in_time")
    else:
        defaulted_fields.append("rescuable_in_time")

    # responder_type
    m_resp = re.search(r'["\']?responder_type["\']?\s*:\s*["\']?(\w+)["\']?', cleaned, re.IGNORECASE)
    if m_resp:
        salvaged["responder_type"] = m_resp.group(1).strip().lower()
    else:
        defaulted_fields.append("responder_type")

    # vulnerability
    m_vuln = re.search(r'["\']?vulnerability["\']?\s*:\s*\[([^\]]*)\]', cleaned, re.IGNORECASE)
    if m_vuln:
        items_str = m_vuln.group(1)
        found_tags = re.findall(r'["\']?([a-zA-Z]+)["\']?', items_str)
        salvaged["vulnerability"] = [t.lower().strip() for t in found_tags if t.strip()]
    else:
        # Check single value like vulnerability: child
        m_vuln_single = re.search(r'["\']?vulnerability["\']?\s*:\s*["\']?([a-zA-Z]+)["\']?', cleaned, re.IGNORECASE)
        if m_vuln_single and m_vuln_single.group(1).lower() not in ("none", "null"):
            salvaged["vulnerability"] = [m_vuln_single.group(1).lower().strip()]
        else:
            defaulted_fields.append("vulnerability")
            salvaged["vulnerability"] = []

    # If life_threat AND time_to_harm were both extracted from the model, accept partial
    has_core = ("life_threat" in salvaged and "time_to_harm" in salvaged)
    return salvaged, has_core, defaulted_fields

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

    # Call Gemma with plain JSON prompt, thinking=False, and num_predict=800
    raw_ai = None
    raw_response_str = ""
    parse_success = False
    is_partial = False
    defaulted_fields: List[str] = []

    try:
        raw_ai_call = ask_gemma(
            system_prompt=COORDINATOR_SYSTEM_PROMPT,
            user_text=user_prompt,
            json_mode=False,
            thinking=False,
            num_predict=800
        )
        raw_response_str = str(raw_ai_call)
        from backend.agents.gemma_client import _extract_json
        raw_ai = _extract_json(raw_response_str)
        parse_success = True
    except Exception as first_parse_err:
        print(f"[Coordinator] Direct JSON parse failed ({first_parse_err}). Attempting salvage...")
        salvaged_dict, has_core, def_fields = salvage_triage(raw_response_str)
        if has_core or (salvaged_dict and len(salvaged_dict) >= 3):
            raw_ai = salvaged_dict
            parse_success = True
            is_partial = has_core and bool(def_fields)
            defaulted_fields = def_fields
        else:
            # Retry once with a shorter prompt that asks for the JSON only
            retry_prompt = f"Return ONLY valid raw JSON for this disaster incident assessment (no explanation):\n{user_prompt}"
            try:
                retry_raw = ask_gemma(
                    system_prompt="Return ONLY valid JSON matching: {reasoning: one short sentence, life_threat: now|soon|none, time_to_harm: seconds|minutes|hours, vulnerability: [child|elderly|injured|disabled], rescuable_in_time: 0-1, responder_type: fire|ndrf|ambulance|pwd|police|volunteer}.",
                    user_text=retry_prompt,
                    json_mode=False,
                    thinking=False,
                    num_predict=800
                )
                raw_response_str = str(retry_raw)
                try:
                    raw_ai = _extract_json(raw_response_str)
                    parse_success = True
                except Exception:
                    salvaged_dict, has_core, def_fields = salvage_triage(raw_response_str)
                    if has_core or salvaged_dict:
                        raw_ai = salvaged_dict
                        parse_success = True
                        is_partial = has_core and bool(def_fields)
                        defaulted_fields = def_fields
            except Exception as retry_err:
                print(f"[Coordinator] Retry failed: {retry_err}")
                parse_success = False
                raw_ai = None

    # 1. Log the raw Gemma output and whether JSON parsing succeeded on every triage call
    print(f"\n[Coordinator Triage Call] incident_id={incident_id}")
    print(f"  JSON Parse Success: {parse_success} (partial={is_partial})")
    print(f"  Raw Gemma Output:\n{raw_response_str}\n")

    fallback_used = 0
    if not parse_success or not isinstance(raw_ai, dict):
        fallback_used = 1
        model_used = "fallback-defaults"
        life_threat = "soon"
        time_to_harm = "minutes"
        rescuable_in_time = 0.5
        responder_type = "ndrf"
        vulnerability = []
        reasoning = "Model triage unavailable; default values used."
    else:
        # Check if partial salvage was used
        if is_partial and "life_threat" in raw_ai and "time_to_harm" in raw_ai:
            model_used = "gemma4:e2b (partial)"
        else:
            model_used = MODEL_NAME

        raw_life = str(raw_ai.get("life_threat", "")).lower().strip()
        life_threat_map = {
            "now": "now", "immediate": "now", "critical": "now", "urgent": "now", "high": "now",
            "soon": "soon", "moderate": "soon", "medium": "soon", "low": "soon",
            "none": "none", "no": "none", "false": "none", "safe": "none"
        }
        life_threat = life_threat_map.get(raw_life, "soon" if "soon" in ALLOWED_LIFE_THREAT else "none")

        raw_harm = str(raw_ai.get("time_to_harm", "")).lower().strip()
        time_map = {
            "seconds": "seconds", "second": "seconds", "immediate": "seconds",
            "minutes": "minutes", "minute": "minutes", "soon": "minutes",
            "hours": "hours", "hour": "hours", "days": "hours", "day": "hours", "none": "hours"
        }
        time_to_harm = time_map.get(raw_harm, "minutes")

        try:
            rescuable_in_time = float(raw_ai.get("rescuable_in_time", 0.5))
            rescuable_in_time = max(0.0, min(1.0, rescuable_in_time))
        except (ValueError, TypeError):
            rescuable_in_time = 0.5

        raw_resp = str(raw_ai.get("responder_type", "")).lower().strip()
        resp_map = {
            "fire": "fire", "firefighters": "fire", "fire_station": "fire",
            "ndrf": "ndrf", "boat": "ndrf", "boat_team": "ndrf", "coastguard": "ndrf", "water_rescue": "ndrf",
            "ambulance": "ambulance", "medical": "ambulance", "paramedic": "ambulance", "ems": "ambulance", "hospital": "ambulance",
            "pwd": "pwd", "pwd_unit": "pwd", "drainage": "pwd", "road": "pwd",
            "police": "police", "cop": "police", "security": "police",
            "volunteer": "volunteer", "citizens": "volunteer", "civilians": "volunteer"
        }
        responder_type = resp_map.get(raw_resp, "ndrf")

        vulnerability_raw = raw_ai.get("vulnerability", [])
        if isinstance(vulnerability_raw, str):
            vulnerability_raw = [vulnerability_raw]
        elif not isinstance(vulnerability_raw, list):
            vulnerability_raw = []

        vulnerability_candidates = []
        for v in vulnerability_raw:
            v_clean = str(v).lower().strip()
            if v_clean in ("child", "kid", "baby"):
                vulnerability_candidates.append("child")
            elif v_clean in ("elderly", "old", "senior"):
                vulnerability_candidates.append("elderly")
            elif v_clean in ("injured", "hurt", "wounded"):
                vulnerability_candidates.append("injured")
            elif v_clean in ("disabled", "handicapped"):
                vulnerability_candidates.append("disabled")
            elif v_clean in ALLOWED_VULNERABILITY:
                vulnerability_candidates.append(v_clean)

        # CODE GUARD: in the Coordinator, keep a vulnerability tag only if the transcripts
        # contain a matching word (child/kid/baby for child, elderly/old for elderly, injured/hurt for injured, disabled for disabled)
        all_transcripts_lower = " ".join(t.lower() for t in transcripts)
        vulnerability = []
        for tag in list(dict.fromkeys(vulnerability_candidates)):
            if tag == "child" and any(re.search(r"\b" + re.escape(w) + r"\b", all_transcripts_lower) for w in ["child", "kid", "baby"]):
                vulnerability.append("child")
            elif tag == "elderly" and any(re.search(r"\b" + re.escape(w) + r"\b", all_transcripts_lower) for w in ["elderly", "old"]):
                vulnerability.append("elderly")
            elif tag == "injured" and any(re.search(r"\b" + re.escape(w) + r"\b", all_transcripts_lower) for w in ["injured", "hurt"]):
                vulnerability.append("injured")
            elif tag == "disabled" and re.search(r"\bdisabled\b", all_transcripts_lower):
                vulnerability.append("disabled")

        reasoning = str(raw_ai.get("reasoning", "Emergency situation assessed from field reports and imagery."))
        if is_partial and defaulted_fields:
            reasoning += f" (defaulted fields: {', '.join(defaulted_fields)})"

    # PART C: code guard on responder:
    # If hazard_type is flood and the responder_type is "ambulance" or "fire", change it to "ndrf"
    # and append " (responder adjusted: flood rescue)" to reasoning. Flood rescue is for boat teams.
    hazard_type = str(incident.get("hazard_type", "")).lower()
    if hazard_type == "flood" and responder_type in ("ambulance", "fire"):
        responder_type = "ndrf"
        reasoning += " (responder adjusted: flood rescue)"

    # CODE GUARD: if none of the incident's transcripts mention a person,
    # force life_threat to at most 'soon' and vulnerability to [], and append note to reasoning.
    any_person_mentioned = any(text_mentions_person(t) for t in transcripts)
    if not any_person_mentioned:
        if life_threat == "now":
            life_threat = "soon"
        vulnerability = []
        if fallback_used == 0:
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
                model_used
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

    # Send TRIAGED from "coordinator" to "dispatcher" with fallback_used
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
            "reasoning": reasoning,
            "fallback_used": fallback_used
        },
        ref_id=incident_id
    )

    # Every TRIAGED incident causes exactly one DISPATCH_PROPOSED message from dispatcher
    from backend.agents.dispatcher import dispatch
    dispatch(incident_id)

    return saved_triage


class CoordinatorAgent:
    """Class wrapper for compatibility."""

    def __init__(self, client=None):
        self.client = client

    def evaluate_incident(self, incident_id: str) -> Dict[str, Any]:
        return triage(incident_id)
