"""Runs a real Coordinator triage test with MOCK_MODE=False on gemma4:e2b."""
import os
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Force MOCK_MODE = False
import backend.config as config
config.MOCK_MODE = False

from backend.db.database import get_db
from backend.agents.coordinator import triage
from backend.agents.dispatcher import dispatch

def run_real_triage():
    print("=" * 70)
    print("Running Coordinator Real Triage Test (MOCK_MODE=False)")
    print("Comparing:")
    print("  Incident A: 1 report, 'a man is drowning near the bridge, he is going under'")
    print("  Incident B: 500 distinct devices, 'a girl is standing near the flood water at the edge'")
    print("=" * 70)

    inc_a_id = "inc-real-test-A"
    rep_a_id = "rep-real-test-A"
    dev_a_id = "dev-real-test-A"

    inc_b_id = "inc-real-test-B"
    rep_b_id = "rep-real-test-B"
    dev_b_id = "dev-real-test-B"

    # Clean up prior test rows
    with get_db() as conn:
        for inc_id in [inc_a_id, inc_b_id]:
            conn.execute("DELETE FROM triage WHERE incident_id = ?", (inc_id,))
            conn.execute("DELETE FROM dispatches WHERE incident_id = ?", (inc_id,))
            conn.execute("DELETE FROM incident_reports WHERE incident_id = ?", (inc_id,))
            conn.execute("DELETE FROM incidents WHERE incident_id = ?", (inc_id,))
            conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (inc_id,))
        for rep_id in [rep_a_id, rep_b_id]:
            conn.execute("DELETE FROM reports WHERE report_id = ?", (rep_id,))
            conn.execute("DELETE FROM verifications WHERE report_id = ?", (rep_id,))
        for dev_id in [dev_a_id, dev_b_id]:
            conn.execute("DELETE FROM devices WHERE device_id = ?", (dev_id,))

        # Setup Incident A: 1 report, transcript "a man is drowning near the bridge, he is going under"
        # Confidence calculated with confidence(independent_reports=1, avg_trust=0.8) -> ~0.62
        conf_a = confidence(independent_reports=1, avg_trust=0.8)
        conn.execute(
            "INSERT INTO devices (device_id, role, display_name, last_lat, last_lng) VALUES (?, 'mesh_node', 'Node A', 15.8523, 74.5085)",
            (dev_a_id,)
        )
        conn.execute(
            """
            INSERT INTO reports (
                report_id, device_id, lat, lng, hazard_type, summary, transcript,
                reporter_conf, capture_mode, claim_matches_photo, people_at_risk, vulnerable, time_to_harm_guess
            )
            VALUES (?, ?, 15.8523, 74.5085, 'flood', 'man drowning',
                    'a man is drowning near the bridge, he is going under', 0.8, 'in_app', 0.8, 1, '[]', 'seconds')
            """,
            (rep_a_id, dev_a_id),
        )
        conn.execute(
            """
            INSERT INTO verifications (verification_id, report_id, trust_score, in_app_capture, claim_photo_match, notes)
            VALUES (?, ?, 0.8, 1, 0.8, 'Direct visual confirmation of drowning person.')
            """,
            (f"ver-{rep_a_id}", rep_a_id),
        )
        conn.execute(
            """
            INSERT INTO incidents (
                incident_id, hazard_type, lat, lng, first_reported_at, last_updated_at,
                independent_reports, confidence, status, priority_score, unverified
            )
            VALUES (?, 'flood', 15.8523, 74.5085, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?, 'new', 0.0, 0)
            """,
            (inc_a_id, conf_a),
        )
        conn.execute(
            "INSERT INTO incident_reports (incident_id, report_id, independent) VALUES (?, ?, 1)",
            (inc_a_id, rep_a_id),
        )

        # Setup Incident B: 500 distinct devices, transcript "a girl is standing near the flood water at the edge"
        # Confidence calculated with confidence(independent_reports=500, avg_trust=0.8) -> ~0.92
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

    try:
        print("\n--- Triaging Incident A with Real Gemma ---")
        triage_a = triage(inc_a_id)

        print("\n--- Triaging Incident B with Real Gemma ---")
        triage_b = triage(inc_b_id)

        with get_db() as conn:
            row_a = dict(conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (inc_a_id,)).fetchone())
            row_b = dict(conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (inc_b_id,)).fetchone())

        score_a = row_a["priority_score"]
        score_b = row_b["priority_score"]

        print("\n" + "=" * 70)
        print("REAL GEMMA TRIAGE RESULTS")
        print("=" * 70)
        print("INCIDENT A (Man Drowning - 1 Report):")
        print(f"  life_threat     : {triage_a.get('life_threat')}")
        print(f"  time_to_harm    : {triage_a.get('time_to_harm')}")
        print(f"  responder_type  : {triage_a.get('responder_type')}")
        print(f"  reasoning       : {triage_a.get('reasoning')}")
        print(f"  model_used      : {triage_a.get('model_used')}")
        print(f"  confidence      : {row_a['confidence']}")
        print(f"  priority_score  : {score_a}")
        if triage_a.get('model_used') == "fallback-defaults":
            print("  [NOTE: Incident A used fallback-defaults!]")

        print("\nINCIDENT B (Girl Standing - 500 Reports):")
        print(f"  life_threat     : {triage_b.get('life_threat')}")
        print(f"  time_to_harm    : {triage_b.get('time_to_harm')}")
        print(f"  responder_type  : {triage_b.get('responder_type')}")
        print(f"  reasoning       : {triage_b.get('reasoning')}")
        print(f"  model_used      : {triage_b.get('model_used')}")
        print(f"  confidence      : {row_b['confidence']}")
        print(f"  priority_score  : {score_b}")
        if triage_b.get('model_used') == "fallback-defaults":
            print("  [NOTE: Incident B used fallback-defaults!]")

        print("\n" + "-" * 70)
        a_ranks_above_b = score_a > score_b
        print(f"Incident A ({score_a}) ranks ABOVE Incident B ({score_b}): {a_ranks_above_b}")
        print("-" * 70)

    finally:
        # Clean up test rows
        with get_db() as conn:
            for inc_id in [inc_a_id, inc_b_id]:
                conn.execute("DELETE FROM triage WHERE incident_id = ?", (inc_id,))
                conn.execute("DELETE FROM dispatches WHERE incident_id = ?", (inc_id,))
                conn.execute("DELETE FROM incident_reports WHERE incident_id = ?", (inc_id,))
                conn.execute("DELETE FROM incidents WHERE incident_id = ?", (inc_id,))
                conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (inc_id,))
            for rep_id in [rep_a_id, rep_b_id]:
                conn.execute("DELETE FROM reports WHERE report_id = ?", (rep_id,))
                conn.execute("DELETE FROM verifications WHERE report_id = ?", (rep_id,))
            for dev_id in [dev_a_id, dev_b_id]:
                conn.execute("DELETE FROM devices WHERE device_id = ?", (dev_id,))
        print("Cleaned up test rows.")

if __name__ == "__main__":
    from backend.services.scoring import confidence
    run_real_triage()
