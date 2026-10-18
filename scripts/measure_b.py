import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import backend.config as config
config.MOCK_MODE = False

from backend.db.database import get_db
from backend.agents.coordinator import triage
from backend.services.scoring import confidence

print("=" * 70)
print("PART D: MEASURING INCIDENT B TRIAGE (5 ATTEMPTS)")
print("=" * 70)

inc_b_id = "inc-measure-B"
rep_b_id = "rep-measure-B"
dev_b_id = "dev-measure-B"

fallback_count = 0
success_count = 0

for attempt in range(1, 6):
    print(f"\n--- Attempt {attempt}/5 ---")
    with get_db() as conn:
        # Clean up
        conn.execute("DELETE FROM triage WHERE incident_id = ?", (inc_b_id,))
        conn.execute("DELETE FROM dispatches WHERE incident_id = ?", (inc_b_id,))
        conn.execute("DELETE FROM incident_reports WHERE incident_id = ?", (inc_b_id,))
        conn.execute("DELETE FROM reports WHERE report_id = ?", (rep_b_id,))
        conn.execute("DELETE FROM verifications WHERE report_id = ?", (rep_b_id,))
        conn.execute("DELETE FROM incidents WHERE incident_id = ?", (inc_b_id,))
        conn.execute("DELETE FROM devices WHERE device_id = ?", (dev_b_id,))
        conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (inc_b_id,))

        conf_b = confidence(independent_reports=500, avg_trust=0.8)
        conn.execute(
            "INSERT INTO devices (device_id, role, display_name, last_lat, last_lng) VALUES (?, 'mesh_node', 'Node B', 15.8530, 74.5090)",
            (dev_b_id,)
        )
        conn.execute(
            """
            INSERT INTO reports (
                report_id, device_id, lat, lng, hazard_type, summary, transcript,
                reporter_conf, capture_mode, claim_matches_photo, people_at_risk, vulnerable, time_to_harm_guess
            )
            VALUES (?, ?, 15.8530, 74.5090, 'flood', 'girl standing near flood',
                    'a girl is standing near the flood water at the edge', 0.8, 'in_app', 0.8, 1, '[\"child\"]', 'hours')
            """,
            (rep_b_id, dev_b_id),
        )
        conn.execute(
            """
            INSERT INTO verifications (verification_id, report_id, trust_score, in_app_capture, claim_photo_match, notes)
            VALUES (?, ?, 0.8, 1, 0.8, 'Multiple reports confirm girl standing safely at perimeter.')
            """,
            (f"ver-{rep_b_id}", rep_b_id),
        )
        conn.execute(
            """
            INSERT INTO incidents (
                incident_id, hazard_type, lat, lng, first_reported_at, last_updated_at,
                independent_reports, confidence, status, priority_score, unverified
            )
            VALUES (?, 'flood', 15.8530, 74.5090, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 500, ?, 'new', 0.0, 0)
            """,
            (inc_b_id, conf_b),
        )
        conn.execute(
            "INSERT INTO incident_reports (incident_id, report_id, independent) VALUES (?, ?, 1)",
            (inc_b_id, rep_b_id),
        )

    triage_row = triage(inc_b_id)
    model_used = triage_row.get("model_used", "")
    print(f"  Attempt {attempt} model_used: {model_used} | life_threat: {triage_row.get('life_threat')} | responder: {triage_row.get('responder_type')}")
    print(f"  Reasoning: {triage_row.get('reasoning')}")

    if model_used == "fallback-defaults":
        fallback_count += 1
    else:
        success_count += 1

# Clean up
with get_db() as conn:
    conn.execute("DELETE FROM triage WHERE incident_id = ?", (inc_b_id,))
    conn.execute("DELETE FROM dispatches WHERE incident_id = ?", (inc_b_id,))
    conn.execute("DELETE FROM incident_reports WHERE incident_id = ?", (inc_b_id,))
    conn.execute("DELETE FROM reports WHERE report_id = ?", (rep_b_id,))
    conn.execute("DELETE FROM verifications WHERE report_id = ?", (rep_b_id,))
    conn.execute("DELETE FROM incidents WHERE incident_id = ?", (inc_b_id,))
    conn.execute("DELETE FROM devices WHERE device_id = ?", (dev_b_id,))
    conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (inc_b_id,))

print("\n" + "=" * 70)
print(f"MEASUREMENT RESULTS: Total=5 | Structured Success={success_count} | Fallback Defaults={fallback_count}")
print("=" * 70)
