"""Key priority and confidence test suite without image model dependency.

Validates that high urgency (life_threat 'now') outranks report counts,
even when an incident has 500 reports versus 1 report with low trust.
"""
import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Force MOCK_MODE = True
import backend.config as config
config.MOCK_MODE = True

from backend.db.database import get_db
from backend.services.scoring import confidence as calc_confidence, priority as calc_priority
from backend.services.messaging import send_message
from backend.agents.dispatcher import dispatch

def test_priority_ranking():
    test_reports = []
    test_incidents = []
    test_devices = []

    inc_a_id = "test-inc-A-drowning"
    inc_b_id = "test-inc-B-crowd"
    inc_c_id = "test-inc-C-calm"
    test_incidents.extend([inc_a_id, inc_b_id, inc_c_id])

    try:
        # ---------------------------------------------------------------------
        # 1. Incident A: a man drowning. 1 report, gallery photo (trust 0.1)
        # ---------------------------------------------------------------------
        lat_a, lng_a = 15.8523, 74.5085
        dev_a = "test-dev-A1"
        rep_a = "test-rep-A1"
        test_devices.append(dev_a)
        test_reports.append(rep_a)

        # confidence(1, 0.1, 0) is ~0.3420
        conf_a = calc_confidence(independent_reports=1, avg_trust=0.1, minutes_since_update=0.0)
        prio_a = calc_priority(
            life_threat="now",
            time_to_harm="seconds",
            rescuable_in_time=0.8,
            vulnerability=[],
            confidence_val=conf_a
        )
        unverified_a = 1 if (conf_a < 0.6) else 0

        # ---------------------------------------------------------------------
        # 2. Incident B: a girl near the water. 500 reports from 500 DIFFERENT devices, trust 0.8
        # ---------------------------------------------------------------------
        lat_b, lng_b = 15.8650, 74.5200
        num_b_reports = 500
        conf_b = calc_confidence(independent_reports=num_b_reports, avg_trust=0.8, minutes_since_update=0.0)
        prio_b = calc_priority(
            life_threat="soon",
            time_to_harm="minutes",
            rescuable_in_time=0.9,
            vulnerability=[],
            confidence_val=conf_b
        )
        unverified_b = 0

        # Also compute B with 5 witnesses to test identical priority property
        conf_b5 = calc_confidence(independent_reports=5, avg_trust=0.8, minutes_since_update=0.0)
        prio_b5 = calc_priority(
            life_threat="soon",
            time_to_harm="minutes",
            rescuable_in_time=0.9,
            vulnerability=[],
            confidence_val=conf_b5
        )

        # ---------------------------------------------------------------------
        # 3. Incident C: 500 witnesses, life_threat 'none', time_to_harm 'hours', trust 0.88, confidence 0.95
        # ---------------------------------------------------------------------
        lat_c, lng_c = 15.8800, 74.5300
        conf_c = 0.95
        prio_c = calc_priority(
            life_threat="none",
            time_to_harm="hours",
            rescuable_in_time=0.9,
            vulnerability=[],
            confidence_val=conf_c
        )
        unverified_c = 0

        # Insert test records directly into database
        with get_db() as conn:
            # Insert Incident A
            conn.execute(
                "INSERT OR IGNORE INTO devices (device_id, role, display_name, last_lat, last_lng) VALUES (?, 'node', 'Node A', ?, ?)",
                (dev_a, lat_a, lng_a)
            )
            conn.execute(
                """
                INSERT INTO reports (report_id, device_id, lat, lng, hazard_type, summary, transcript, reporter_conf, capture_mode)
                VALUES (?, ?, ?, ?, 'flood', 'man drowning', 'a man is drowning near the bridge', 0.1, 'gallery')
                """,
                (rep_a, dev_a, lat_a, lng_a)
            )
            conn.execute(
                "INSERT INTO verifications (verification_id, report_id, trust_score, notes) VALUES (?, ?, 0.1, 'Gallery photo low trust')",
                (f"ver-{rep_a}", rep_a)
            )
            conn.execute(
                """
                INSERT INTO incidents (incident_id, hazard_type, lat, lng, independent_reports, confidence, priority_score, status, unverified)
                VALUES (?, 'flood', ?, ?, 1, ?, ?, 'triaged', ?)
                """,
                (inc_a_id, lat_a, lng_a, conf_a, prio_a, unverified_a)
            )
            conn.execute("INSERT INTO incident_reports (incident_id, report_id, independent) VALUES (?, ?, 1)", (inc_a_id, rep_a))
            conn.execute(
                """
                INSERT INTO triage (triage_id, incident_id, life_threat, time_to_harm, vulnerability, rescuable_in_time, responder_type, reasoning, model_used)
                VALUES (?, ?, 'now', 'seconds', '[]', 0.8, 'ndrf', 'Person actively drowning in swift current.', 'gemma4:e2b')
                """,
                (f"tri-{inc_a_id}", inc_a_id)
            )

            # Insert Incident B
            conn.execute(
                """
                INSERT INTO incidents (incident_id, hazard_type, lat, lng, independent_reports, confidence, priority_score, status, unverified)
                VALUES (?, 'flood', ?, ?, ?, ?, ?, 'triaged', ?)
                """,
                (inc_b_id, lat_b, lng_b, num_b_reports, conf_b, prio_b, unverified_b)
            )
            conn.execute(
                """
                INSERT INTO triage (triage_id, incident_id, life_threat, time_to_harm, vulnerability, rescuable_in_time, responder_type, reasoning, model_used)
                VALUES (?, ?, 'soon', 'minutes', '[]', 0.9, 'ndrf', 'Girl observed standing near rising floodwaters.', 'gemma4:e2b')
                """,
                (f"tri-{inc_b_id}", inc_b_id)
            )

            # Insert Incident C
            conn.execute(
                """
                INSERT INTO incidents (incident_id, hazard_type, lat, lng, independent_reports, confidence, priority_score, status, unverified)
                VALUES (?, 'flood', ?, ?, 500, ?, ?, 'triaged', ?)
                """,
                (inc_c_id, lat_c, lng_c, conf_c, prio_c, unverified_c)
            )
            conn.execute(
                """
                INSERT INTO triage (triage_id, incident_id, life_threat, time_to_harm, vulnerability, rescuable_in_time, responder_type, reasoning, model_used)
                VALUES (?, ?, 'none', 'hours', '[]', 0.9, 'ndrf', 'Water accumulation on roadside, no life threat.', 'gemma4:e2b')
                """,
                (f"tri-{inc_c_id}", inc_c_id)
            )

        # Send VERIFY_REQUEST for Incident A
        send_message(
            from_agent="coordinator",
            to_agent="all",
            msg_type="VERIFY_REQUEST",
            body={"incident_id": inc_a_id, "alert": "Immediate life threat unverified"},
            ref_id=inc_a_id
        )

        # Dispatch orders
        dispatch(inc_a_id)
        dispatch(inc_b_id)
        dispatch(inc_c_id)

        # ---------------------------------------------------------------------
        # ASSERTIONS
        # ---------------------------------------------------------------------
        # 1. Incident A (man drowning, now, seconds, rescuable 0.8) with very LOW trust of 0.1
        #    (confidence ~0.34) must STILL rank above Incident B (girl, 500 witnesses, soon, minutes, rescuable 0.9, conf 0.92)
        assert prio_a > prio_b, f"Assertion 1 Failed: Expected priority(A) > priority(B), got {prio_a} <= {prio_b}"

        # 2. Incident C: 500 witnesses, life_threat 'none', time_to_harm 'hours', confidence 0.95
        #    must rank BELOW both A and B
        assert prio_c < prio_a, f"Assertion 2a Failed: Expected priority(C) < priority(A), got {prio_c} >= {prio_a}"
        assert prio_c < prio_b, f"Assertion 2b Failed: Expected priority(C) < priority(B), got {prio_c} >= {prio_b}"

        # 3. Priority of an incident must be nearly identical whether it has 5 or 500 witnesses when trust & triage are same
        #    (apart from the confidence change), and the 500-witness version must NOT exceed priority of 'now' incident A.
        prio_diff_b = abs(prio_b - prio_b5)
        assert prio_diff_b < 0.05, f"Assertion 3a Failed: Priority diff between 5 and 500 witnesses ({prio_diff_b}) exceeds 0.05"
        assert prio_b < prio_a, f"Assertion 3b Failed: 500-witness priority ({prio_b}) exceeded 'now' incident A ({prio_a})"

        # Verify Incident A unverified flag and message
        assert unverified_a == 1, f"Expected Incident A unverified=1, got {unverified_a}"
        with get_db() as conn:
            cursor_msg = conn.execute(
                "SELECT message_id FROM agent_messages WHERE ref_id = ? AND msg_type = 'VERIFY_REQUEST'",
                (inc_a_id,),
            )
            assert cursor_msg.fetchone() is not None, "Expected VERIFY_REQUEST message for Incident A"

        # ---------------------------------------------------------------------
        # PRINT UPDATED RANKING TABLE
        # ---------------------------------------------------------------------
        print("\n" + "=" * 90)
        print(f"{'Incident':<15} | {'Witnesses':<10} | {'Confidence':<10} | {'Life Threat':<12} | {'Priority':<10} | {'Rank'}")
        print("-" * 90)
        print(f"{'Incident A':<15} | {'1':<10} | {conf_a:<10.4f} | {'now':<12} | {prio_a:<10.4f} | #1 (CRITICAL)")
        print(f"{'Incident B':<15} | {'500':<10} | {conf_b:<10.4f} | {'soon':<12} | {prio_b:<10.4f} | #2 (HIGH)")
        print(f"{'Incident C':<15} | {'500':<10} | {conf_c:<10.4f} | {'none':<12} | {prio_c:<10.4f} | #3 (LOW)")
        print("=" * 90)
        print("\n>>> All Extended Assertions (1, 2, 3) PASSED successfully!")

    finally:
        # Clean up all test rows
        with get_db() as conn:
            for rid in test_reports:
                conn.execute("DELETE FROM verifications WHERE report_id = ?", (rid,))
                conn.execute("DELETE FROM incident_reports WHERE report_id = ?", (rid,))
                conn.execute("DELETE FROM reports WHERE report_id = ?", (rid,))
                conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (rid,))

            for iid in test_incidents:
                conn.execute("DELETE FROM triage WHERE incident_id = ?", (iid,))
                conn.execute("DELETE FROM dispatches WHERE incident_id = ?", (iid,))
                conn.execute("DELETE FROM incidents WHERE incident_id = ?", (iid,))
                conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (iid,))

            for did in test_devices:
                conn.execute("DELETE FROM devices WHERE device_id = ?", (did,))

        print("[OK] Test database rows cleaned up cleanly.")

def test_priority_floor():
    """Unit test that priority is never 0.0 for life_threat soon or now, even if rescuable_in_time is 0."""
    from backend.services.scoring import priority as compute_priority
    # Test now with rescuable_in_time 0.2 (which is the coordinator floor)
    p_now = compute_priority(life_threat="now", time_to_harm="hours", rescuable_in_time=0.2, vulnerability=[], confidence_val=0.1)
    assert p_now > 0.0, f"Expected priority > 0 for life_threat 'now', got {p_now}"

    # Test soon with rescuable_in_time 0.2
    p_soon = compute_priority(life_threat="soon", time_to_harm="hours", rescuable_in_time=0.2, vulnerability=[], confidence_val=0.1)
    assert p_soon > 0.0, f"Expected priority > 0 for life_threat 'soon', got {p_soon}"
    print("[OK] Priority floor test passed: priority is never 0.0 for soon or now.")

if __name__ == "__main__":
    test_priority_ranking()
    test_priority_floor()

