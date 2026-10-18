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
    test_incident_id = "inc-real-roof-test"
    test_report_id = "rep-real-roof-test"
    test_device_id = "dev-real-roof-test"

    print("=" * 65)
    print("Running Coordinator Real Triage Test (MOCK_MODE=False)")
    print("Transcript: 'elderly woman stuck on roof, water rising'")
    print("=" * 65)

    try:
        with get_db() as conn:
            # Clean up prior instance if exists
            conn.execute("DELETE FROM triage WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM dispatches WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM incident_reports WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM reports WHERE report_id = ?", (test_report_id,))
            conn.execute("DELETE FROM incidents WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM devices WHERE device_id = ?", (test_device_id,))
            conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (test_incident_id,))

            # Insert device
            conn.execute(
                "INSERT INTO devices (device_id, role, display_name, last_lat, last_lng) VALUES (?, 'mesh_node', 'Roof Node', 15.8582, 74.5028)",
                (test_device_id,)
            )

            # Insert single report
            conn.execute(
                """
                INSERT INTO reports (
                    report_id, device_id, lat, lng, hazard_type, summary, transcript,
                    reporter_conf, capture_mode, claim_matches_photo, people_at_risk, vulnerable, time_to_harm_guess
                )
                VALUES (?, ?, 15.8582, 74.5028, 'flood', 'elderly woman on roof',
                        'elderly woman stuck on roof, water rising', 0.8, 'in_app', 0.8, 1, '[\"elderly\"]', 'minutes')
                """,
                (test_report_id, test_device_id),
            )

            # Insert verification
            conn.execute(
                """
                INSERT INTO verifications (verification_id, report_id, trust_score, in_app_capture, claim_photo_match, notes)
                VALUES (?, ?, 0.82, 1, 0.8, 'In-app report. Water level rising fast.')
                """,
                (f"ver-{test_report_id}", test_report_id),
            )

            # Insert incident
            conn.execute(
                """
                INSERT INTO incidents (
                    incident_id, hazard_type, lat, lng, first_reported_at, last_updated_at,
                    independent_reports, confidence, status, priority_score, unverified
                )
                VALUES (?, 'flood', 15.8582, 74.5028, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 0.63, 'new', 0.0, 0)
                """,
                (test_incident_id,),
            )

            conn.execute(
                "INSERT INTO incident_reports (incident_id, report_id, independent) VALUES (?, ?, 1)",
                (test_incident_id, test_report_id),
            )

        # Execute real Gemma triage
        triage_row = triage(test_incident_id)

        # Retrieve updated incident
        with get_db() as conn:
            cursor_inc = conn.execute("SELECT * FROM incidents WHERE incident_id = ?", (test_incident_id,))
            updated_incident = dict(cursor_inc.fetchone())

        # Also trigger dispatch to verify tactical task card and responder assignment
        dispatches = dispatch(test_incident_id)

        print("\n--- SAVED TRIAGE ROW ---")
        for k, v in triage_row.items():
            print(f"  {k}: {v}")

        print("\n--- UPDATED INCIDENT ---")
        print(f"  Incident ID: {updated_incident.get('incident_id')}")
        print(f"  Priority Score: {updated_incident.get('priority_score')}")
        print(f"  Confidence: {updated_incident.get('confidence')}")
        print(f"  Status: {updated_incident.get('status')}")
        print(f"  Unverified: {updated_incident.get('unverified')}")

        print("\n--- DISPATCH ORDERS CREATED ---")
        for d in dispatches:
            print(f"  Dispatch ID: {d['dispatch_id']} | Status: {d['status']}")

        print("\n" + "=" * 65)
        print("Coordinator Real Triage Test Complete!")
        print("=" * 65)

    finally:
        # Clean up test rows
        with get_db() as conn:
            conn.execute("DELETE FROM triage WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM dispatches WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM incident_reports WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM reports WHERE report_id = ?", (test_report_id,))
            conn.execute("DELETE FROM verifications WHERE report_id = ?", (test_report_id,))
            conn.execute("DELETE FROM incidents WHERE incident_id = ?", (test_incident_id,))
            conn.execute("DELETE FROM devices WHERE device_id = ?", (test_device_id,))
            conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (test_incident_id,))

if __name__ == "__main__":
    run_real_triage()
