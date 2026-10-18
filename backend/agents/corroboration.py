"""Corroboration Agent module for RippleMesh.

Clusters incoming verified reports to existing or newly synthesized disaster incidents
using spatial (haversine) and temporal windows. Computes distinct device counts to ensure
independent_reports counts only distinct device_ids, updates incident confidence using
the scoring service, and notifies the Coordinator agent with an INCIDENT_UPDATED message.
"""
import math
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from backend.config import CLUSTER_RADIUS_M, CLUSTER_WINDOW_MIN
from backend.db.database import get_db
from backend.services.scoring import confidence
from backend.services.messaging import send_message

def _haversine_distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def _parse_time(time_str: Optional[str]) -> datetime:
    """Parses SQLite timestamp strings reliably."""
    if not time_str:
        return datetime.utcnow()
    # Normalize common SQLite format: YYYY-MM-DD HH:MM:SS
    cleaned = time_str.replace("T", " ").replace("Z", "").split(".")[0]
    try:
        return datetime.strptime(cleaned, "%Y-%m-%d %H:%M:%S")
    except Exception:
        return datetime.utcnow()

def cluster_report(report_id: str) -> Dict[str, Any]:
    """Attach the report to an existing incident or create a new incident.

    Rules:
    - Attach to an existing incident if same hazard_type, within CLUSTER_RADIUS_M and CLUSTER_WINDOW_MIN.
      Otherwise, create a new incident.
    - independent_reports counts only DISTINCT device_ids. Repeats from the same device never count.
    - Update the incident's confidence using scoring.confidence() with the average trust of its reports.
    - Send INCIDENT_UPDATED from "corroboration" to "coordinator" via services/messaging.py.

    Returns:
        Dictionary of the updated/created incident record.
    """
    with get_db() as conn:
        # Fetch current report
        cursor = conn.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
        rep_row = cursor.fetchone()
        if not rep_row:
            raise ValueError(f"Report not found: {report_id}")
        report = dict(rep_row)

        rep_lat = report.get("lat")
        rep_lng = report.get("lng")
        hazard_type = report.get("hazard_type", "other")
        report_time = _parse_time(report.get("created_at"))
        rep_device_id = report.get("device_id")

        # 1. Search for candidate existing incidents
        cursor_inc = conn.execute(
            """
            SELECT * FROM incidents
            WHERE hazard_type = ? AND status NOT IN ('resolved', 'false_alarm', 'rejected')
            ORDER BY last_updated_at DESC
            """,
            (hazard_type,),
        )
        candidates = [dict(r) for r in cursor_inc.fetchall()]

        target_incident_id: Optional[str] = None
        for inc in candidates:
            inc_lat = inc.get("lat")
            inc_lng = inc.get("lng")
            if inc_lat is not None and inc_lng is not None and rep_lat is not None and rep_lng is not None:
                dist_m = _haversine_distance_m(rep_lat, rep_lng, inc_lat, inc_lng)
                if dist_m <= CLUSTER_RADIUS_M:
                    inc_time = _parse_time(inc.get("last_updated_at"))
                    time_diff_min = abs((report_time - inc_time).total_seconds()) / 60.0
                    if time_diff_min <= CLUSTER_WINDOW_MIN:
                        target_incident_id = inc["incident_id"]
                        break

        # 2. Attach or create incident
        if target_incident_id is None:
            # Create new incident
            target_incident_id = f"inc-{uuid.uuid4().hex[:8]}"
            conn.execute(
                """
                INSERT INTO incidents (
                    incident_id, hazard_type, lat, lng, first_reported_at,
                    last_updated_at, independent_reports, confidence, status, priority_score, unverified
                )
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 0.5, 'new', 0.0, 0)
                """,
                (target_incident_id, hazard_type, rep_lat, rep_lng),
            )

        # Check if this report's device is already present in this incident's reports
        cursor_devs = conn.execute(
            """
            SELECT DISTINCT r.device_id
            FROM reports r
            JOIN incident_reports ir ON r.report_id = ir.report_id
            WHERE ir.incident_id = ? AND r.device_id IS NOT NULL
            """,
            (target_incident_id,),
        )
        existing_devices = {row[0] for row in cursor_devs.fetchall()}
        is_independent = 1 if (rep_device_id and rep_device_id not in existing_devices) or not existing_devices else 0

        # Link report to incident
        conn.execute(
            """
            INSERT OR IGNORE INTO incident_reports (incident_id, report_id, independent)
            VALUES (?, ?, ?)
            """,
            (target_incident_id, report_id, is_independent),
        )

        # 3. Recalculate distinct device count (independent_reports)
        cursor_distinct = conn.execute(
            """
            SELECT COUNT(DISTINCT r.device_id) as distinct_devs,
                   COUNT(r.report_id) as total_reps,
                   AVG(COALESCE(v.trust_score, r.reporter_conf, 0.7)) as avg_trust,
                   MIN(r.created_at) as earliest_rep,
                   MAX(r.created_at) as latest_rep
            FROM reports r
            JOIN incident_reports ir ON r.report_id = ir.report_id
            LEFT JOIN verifications v ON r.report_id = v.report_id
            WHERE ir.incident_id = ?
            """,
            (target_incident_id,),
        )
        agg = dict(cursor_distinct.fetchone())
        distinct_devices = agg.get("distinct_devs") or 1
        avg_trust_val = float(agg.get("avg_trust") or 0.7)

        # Calculate time staleness since last update
        latest_time = _parse_time(agg.get("latest_rep"))
        mins_since_update = max(0.0, (datetime.utcnow() - latest_time).total_seconds() / 60.0)

        # Calculate incident confidence using scoring.confidence
        inc_conf = confidence(
            independent_reports=distinct_devices,
            avg_trust=avg_trust_val,
            minutes_since_update=mins_since_update
        )

        # Update incident record
        conn.execute(
            """
            UPDATE incidents
            SET independent_reports = ?,
                confidence = ?,
                last_updated_at = CURRENT_TIMESTAMP
            WHERE incident_id = ?
            """,
            (distinct_devices, inc_conf, target_incident_id),
        )

        cursor_res = conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (target_incident_id,))
        updated_incident = dict(cursor_res.fetchone())

    # 4. Send INCIDENT_UPDATED from "corroboration" to "coordinator" through services/messaging.py
    message_payload = {
        "incident_id": target_incident_id,
        "hazard_type": hazard_type,
        "independent_reports": distinct_devices,
        "confidence": inc_conf,
        "lat": rep_lat,
        "lng": rep_lng,
        "latest_report_id": report_id
    }
    send_message(
        from_agent="corroboration",
        to_agent="coordinator",
        msg_type="INCIDENT_UPDATED",
        body=message_payload,
        ref_id=target_incident_id,
        from_device=rep_device_id
    )

    return updated_incident


class CorroborationAgent:
    """Class wrapper for compatibility."""

    def __init__(self, client=None):
        self.client = client

    def find_clusters(self, report_id: str) -> List[Dict[str, Any]]:
        inc = cluster_report(report_id)
        return [inc]
