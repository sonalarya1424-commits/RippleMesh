"""Dispatcher Agent module for RippleMesh.

Builds tactical responder task cards, matches incidents to the nearest available responder
teams (fire, ndrf/boat, ambulance, pwd), creates pending dispatch orders, creates auto-alerted
dispatches for immediate life threats ('now'), and notifies the human coordinator.
"""
import math
import uuid
import json
from typing import Any, Dict, List, Optional
from backend.db.database import get_db
from backend.services.messaging import send_message

def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two coordinates."""
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

# Mapping from Gemma responder_type to DB responders type substrings
TYPE_MAP = {
    "fire": ["fire", "fire_station"],
    "ndrf": ["ndrf", "boat", "boat_team"],
    "ambulance": ["ambulance", "medical", "ems"],
    "pwd": ["pwd", "pwd_unit", "drainage"],
    "police": ["police", "law"],
    "volunteer": ["volunteer", "citizen"]
}

def find_nearest_responder(incident_lat: Optional[float], incident_lng: Optional[float], responder_type: str) -> Optional[Dict[str, Any]]:
    """Finds the closest available responder unit matching the given type."""
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM responders WHERE available = 1")
        all_responders = [dict(r) for r in cursor.fetchall()]

    if not all_responders:
        return None

    # Match responder type candidates
    candidate_types = TYPE_MAP.get(responder_type.lower(), [responder_type.lower()])
    matched = [
        r for r in all_responders
        if any(ct in r.get("type", "").lower() for ct in candidate_types)
    ]

    # If no specific type matches, consider all available responders
    pool = matched if matched else all_responders

    if incident_lat is None or incident_lng is None:
        return pool[0]

    # Sort by distance
    def _dist(r):
        r_lat = r.get("lat")
        r_lng = r.get("lng")
        if r_lat is not None and r_lng is not None:
            return _haversine_m(incident_lat, incident_lng, r_lat, r_lng)
        return float("inf")

    pool.sort(key=_dist)
    return pool[0]

def build_task_card(incident_id: str) -> Dict[str, Any]:
    """Constructs a tactical task card for an incident."""
    with get_db() as conn:
        cursor_inc = conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (incident_id,))
        inc_row = cursor_inc.fetchone()
        if not inc_row:
            raise ValueError(f"Incident not found: {incident_id}")
        incident = dict(inc_row)

        cursor_tri = conn.execute("SELECT * FROM triage WHERE incident_id = ? ORDER BY created_at DESC", (incident_id,))
        tri_row = cursor_tri.fetchone()
        triage_data = dict(tri_row) if tri_row else {}

        # Calculate average trust from linked verifications
        cursor_trust = conn.execute(
            """
            SELECT AVG(COALESCE(v.trust_score, r.reporter_conf, 0.7)) as avg_trust
            FROM incident_reports ir
            JOIN reports r ON ir.report_id = r.report_id
            LEFT JOIN verifications v ON r.report_id = v.report_id
            WHERE ir.incident_id = ?
            """,
            (incident_id,),
        )
        trust_row = cursor_trust.fetchone()
        avg_trust = round(float(trust_row[0] or 0.7), 2)

    lat = incident.get("lat")
    lng = incident.get("lng")
    maps_link = f"https://www.google.com/maps?q={lat},{lng}" if lat is not None and lng is not None else None

    req_type = triage_data.get("responder_type", "ndrf")
    nearest_resp = find_nearest_responder(lat, lng, req_type)

    card = {
        "incident_id": incident_id,
        "hazard": incident.get("hazard_type", "unknown"),
        "location": {"lat": lat, "lng": lng},
        "maps_link": maps_link,
        "gemma_reasoning": triage_data.get("reasoning", "Emergency intervention requested."),
        "life_threat": triage_data.get("life_threat", "soon"),
        "time_to_harm": triage_data.get("time_to_harm", "minutes"),
        "confidence": incident.get("confidence", 0.5),
        "trust": avg_trust,
        "unverified": bool(incident.get("unverified", 0)),
        "nearest_responder": {
            "responder_id": nearest_resp.get("responder_id") if nearest_resp else "resp-default",
            "name": nearest_resp.get("name") if nearest_resp else "Field Response Team",
            "type": nearest_resp.get("type") if nearest_resp else req_type,
            "contact": nearest_resp.get("contact") if nearest_resp else None
        }
    }
    return card

def dispatch(incident_id: str) -> List[Dict[str, Any]]:
    """Create dispatch records for an incident and notify human coordinator.

    Rules:
    - build_task_card(incident_id).
    - Create a dispatches row with approval_status 'pending'.
    - If life_threat is 'now', ALSO create a dispatch with approval_status 'auto_alerted'
      to the nearest responder, awaiting human confirmation.
    - Send DISPATCH_PROPOSED from "dispatcher" to "human_coordinator".
    """
    card = build_task_card(incident_id)
    responder_id = card["nearest_responder"]["responder_id"]
    life_threat = card.get("life_threat", "soon")
    card_json = json.dumps(card)

    created_dispatches = []

    created_dispatches = []

    with get_db() as conn:
        # Check if an existing pending dispatch already exists for this incident
        cursor_existing = conn.execute(
            "SELECT dispatch_id FROM dispatches WHERE incident_id = ? AND approval_status = 'pending'",
            (incident_id,)
        )
        existing_row = cursor_existing.fetchone()

        if existing_row:
            d_pending_id = existing_row[0]
            conn.execute(
                """
                UPDATE dispatches
                SET responder_id = ?, task_card = ?
                WHERE dispatch_id = ?
                """,
                (responder_id, card_json, d_pending_id),
            )
            created_dispatches.append({"dispatch_id": d_pending_id, "status": "pending", "updated": True})
        else:
            # Standard pending dispatch
            d_pending_id = f"dsp-{uuid.uuid4().hex[:8]}"
            conn.execute(
                """
                INSERT INTO dispatches (dispatch_id, incident_id, responder_id, approval_status, task_card)
                VALUES (?, ?, ?, 'pending', ?)
                """,
                (d_pending_id, incident_id, responder_id, card_json),
            )
            created_dispatches.append({"dispatch_id": d_pending_id, "status": "pending"})

        # If life_threat is 'now', also create 'auto_alerted' dispatch if not already alerted
        if life_threat == "now":
            cursor_alert = conn.execute(
                "SELECT dispatch_id FROM dispatches WHERE incident_id = ? AND approval_status = 'auto_alerted'",
                (incident_id,)
            )
            existing_alert = cursor_alert.fetchone()
            if existing_alert:
                d_alert_id = existing_alert[0]
                conn.execute(
                    """
                    UPDATE dispatches
                    SET responder_id = ?, task_card = ?
                    WHERE dispatch_id = ?
                    """,
                    (responder_id, card_json, d_alert_id),
                )
                created_dispatches.append({"dispatch_id": d_alert_id, "status": "auto_alerted", "updated": True})
            else:
                d_alert_id = f"dsp-{uuid.uuid4().hex[:8]}"
                conn.execute(
                    """
                    INSERT INTO dispatches (dispatch_id, incident_id, responder_id, approval_status, task_card)
                    VALUES (?, ?, ?, 'auto_alerted', ?)
                    """,
                    (d_alert_id, incident_id, responder_id, card_json),
                )
                created_dispatches.append({"dispatch_id": d_alert_id, "status": "auto_alerted"})

    # Send DISPATCH_PROPOSED message from "dispatcher" to "human_coordinator"
    send_message(
        from_agent="dispatcher",
        to_agent="human_coordinator",
        msg_type="DISPATCH_PROPOSED",
        body={
            "incident_id": incident_id,
            "dispatches": created_dispatches,
            "task_card": card
        },
        ref_id=incident_id
    )

    return created_dispatches


class DispatcherAgent:
    """Class wrapper for compatibility."""

    def __init__(self, client=None):
        self.client = client

    def create_dispatch_plan(self, incident_id: str) -> Dict[str, Any]:
        dispatches = dispatch(incident_id)
        return {"incident_id": incident_id, "dispatches": dispatches}
