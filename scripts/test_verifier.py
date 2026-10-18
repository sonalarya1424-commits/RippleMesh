import os
import sys
import uuid
import sqlite3
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import get_db
from backend.agents.verifier import verify
from backend.agents.corroboration import cluster_report
from backend.agents.reporter import text_mentions_person
from backend.services.scoring import confidence

TEST_PREFIX = "test-vf-"

def insert_test_report(
    report_id: str,
    device_id: str,
    phash: str = "d797d1c9140e4ee8",
    lat: float = 15.8523,
    lng: float = 74.5085,
    hazard_type: str = "flood",
    capture_mode: str = "in_app",
    claim_matches_photo: float = 0.8,
    created_at_override: str = None
):
    with get_db() as conn:
        # Register device if needed
        conn.execute(
            """
            INSERT OR IGNORE INTO devices (device_id, role, display_name, last_lat, last_lng)
            VALUES (?, 'test_node', ?, ?, ?)
            """,
            (device_id, device_id, lat, lng),
        )

        time_val = created_at_override if created_at_override else "CURRENT_TIMESTAMP"
        if created_at_override:
            conn.execute(
                """
                INSERT INTO reports (
                    report_id, device_id, lat, lng, hazard_type, summary,
                    reporter_conf, capture_mode, phash, claim_matches_photo,
                    people_at_risk, vulnerable, time_to_harm_guess, created_at
                )
                VALUES (?, ?, ?, ?, ?, 'Test report', 0.8, ?, ?, ?, 0, '[]', 'hours', ?)
                """,
                (report_id, device_id, lat, lng, hazard_type, capture_mode, phash, claim_matches_photo, created_at_override),
            )
        else:
            conn.execute(
                """
                INSERT INTO reports (
                    report_id, device_id, lat, lng, hazard_type, summary,
                    reporter_conf, capture_mode, phash, claim_matches_photo,
                    people_at_risk, vulnerable, time_to_harm_guess
                )
                VALUES (?, ?, ?, ?, ?, 'Test report', 0.8, ?, ?, ?, 0, '[]', 'hours')
                """,
                (report_id, device_id, lat, lng, hazard_type, capture_mode, phash, claim_matches_photo),
            )

def cleanup_test_data(test_ids, test_incidents, test_devices):
    with get_db() as conn:
        for rid in test_ids:
            conn.execute("DELETE FROM verifications WHERE report_id = ?", (rid,))
            conn.execute("DELETE FROM incident_reports WHERE report_id = ?", (rid,))
            conn.execute("DELETE FROM reports WHERE report_id = ?", (rid,))
            conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (rid,))

        for iid in test_incidents:
            conn.execute("DELETE FROM incidents WHERE incident_id = ?", (iid,))
            conn.execute("DELETE FROM agent_messages WHERE ref_id = ?", (iid,))

        for did in test_devices:
            conn.execute("DELETE FROM devices WHERE device_id = ?", (did,))

def run_tests():
    print("=" * 65)
    print("Running RippleMesh Verification & Corroboration Test Suite")
    print("=" * 65)

    created_report_ids = []
    created_incident_ids = []
    created_device_ids = []

    try:
        # -------------------------------------------------------------
        # CHECK 1: Same phash from two different devices
        # -------------------------------------------------------------
        dev1 = f"{TEST_PREFIX}dev-1"
        dev2 = f"{TEST_PREFIX}dev-2"
        rep1_id = f"{TEST_PREFIX}rep-01"
        rep2_id = f"{TEST_PREFIX}rep-02"
        created_device_ids.extend([dev1, dev2])
        created_report_ids.extend([rep1_id, rep2_id])

        # Report 1 created earlier
        insert_test_report(rep1_id, dev1, phash="d797d1c9140e4ee8", created_at_override="2026-10-18 01:00:00")
        v1 = verify(rep1_id)

        # Report 2 has same phash from different device, created later
        insert_test_report(rep2_id, dev2, phash="d797d1c9140e4ee8", created_at_override="2026-10-18 01:05:00")
        v2 = verify(rep2_id)

        check1_passed = (
            v2.get("duplicate_of") == rep1_id
            and v2.get("trust_score") < v1.get("trust_score")
        )
        print(f"Check 1: Same phash flagged duplicate with lower trust: {'PASS' if check1_passed else 'FAIL'}")
        if not check1_passed:
            print(f"   Details: v1 trust={v1.get('trust_score')}, v2 trust={v2.get('trust_score')}, dup_of={v2.get('duplicate_of')}")

        # -------------------------------------------------------------
        # CHECK 2: 3 reports from the SAME device at the same place
        # -------------------------------------------------------------
        dev_same = f"{TEST_PREFIX}dev-same"
        created_device_ids.append(dev_same)
        rep_same_ids = [f"{TEST_PREFIX}rep-s1", f"{TEST_PREFIX}rep-s2", f"{TEST_PREFIX}rep-s3"]
        created_report_ids.extend(rep_same_ids)

        inc_same = None
        for i, rid in enumerate(rep_same_ids):
            insert_test_report(rid, dev_same, phash=f"d797d1c9140e4ee{i}", lat=15.8600, lng=74.5000, hazard_type="fire")
            verify(rid)
            inc_same = cluster_report(rid)
            if inc_same["incident_id"] not in created_incident_ids:
                created_incident_ids.append(inc_same["incident_id"])

        check2_passed = (inc_same.get("independent_reports") == 1)
        print(f"Check 2: 3 reports from SAME device -> independent_reports stays 1: {'PASS' if check2_passed else 'FAIL'}")
        if not check2_passed:
            print(f"   Details: independent_reports={inc_same.get('independent_reports')}")

        # -------------------------------------------------------------
        # CHECK 3: 3 reports from 3 DIFFERENT devices at the same place
        # -------------------------------------------------------------
        dev_diffs = [f"{TEST_PREFIX}dev-d1", f"{TEST_PREFIX}dev-d2", f"{TEST_PREFIX}dev-d3"]
        created_device_ids.extend(dev_diffs)
        rep_diff_ids = [f"{TEST_PREFIX}rep-d1", f"{TEST_PREFIX}rep-d2", f"{TEST_PREFIX}rep-d3"]
        created_report_ids.extend(rep_diff_ids)

        inc_diff = None
        for i, rid in enumerate(rep_diff_ids):
            insert_test_report(rid, dev_diffs[i], phash=f"a797d1c9140e4ee{i}", lat=15.8700, lng=74.5100, hazard_type="landslide")
            verify(rid)
            inc_diff = cluster_report(rid)
            if inc_diff["incident_id"] not in created_incident_ids:
                created_incident_ids.append(inc_diff["incident_id"])

        check3_passed = (inc_diff.get("independent_reports") == 3)
        print(f"Check 3: 3 reports from 3 DIFFERENT devices -> independent_reports is 3: {'PASS' if check3_passed else 'FAIL'}")
        if not check3_passed:
            print(f"   Details: independent_reports={inc_diff.get('independent_reports')}")

        # -------------------------------------------------------------
        # CHECK 4: confidence(50, 0.7, 0) - confidence(5, 0.7, 0) < 0.1
        # -------------------------------------------------------------
        c50 = confidence(50, 0.7, 0)
        c5 = confidence(5, 0.7, 0)
        diff = c50 - c5
        check4_passed = (diff < 0.1)
        print(f"Check 4: confidence saturation: c50 ({c50}) - c5 ({c5}) = {diff:.4f} < 0.1: {'PASS' if check4_passed else 'FAIL'}")

        # -------------------------------------------------------------
        # CHECK 5: text_mentions_person checks from Part A
        # -------------------------------------------------------------
        p_check1 = text_mentions_person("many houses are underwater") is False
        p_check2 = text_mentions_person("household is safe") is False
        p_check3 = text_mentions_person("told everyone to move") is False
        p_check4 = text_mentions_person("an old man is stuck") is True
        p_check5 = text_mentions_person("2 children trapped in house") is True
        check5_passed = p_check1 and p_check2 and p_check3 and p_check4 and p_check5

        print(f"Check 5: Whole-word regex matching for text_mentions_person: {'PASS' if check5_passed else 'FAIL'}")
        if not check5_passed:
            print(f"   Details: p1={p_check1}, p2={p_check2}, p3={p_check3}, p4={p_check4}, p5={p_check5}")

    finally:
        # Clean up test rows
        cleanup_test_data(created_report_ids, created_incident_ids, created_device_ids)
        print("\n[OK] Cleaned up all test artifacts from database.")
        print("=" * 65)

if __name__ == "__main__":
    run_tests()
