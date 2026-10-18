"""Script to reset demo data in RippleMesh SQLite database.

Deletes all rows from:
- reports
- media
- verifications
- incidents
- incident_reports
- triage
- dispatches
- agent_messages

Keeps responders table, devices (if any), and schema structure intact.
Prints counts before and after.
"""
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import get_db

TABLES = [
    "reports",
    "media",
    "verifications",
    "incidents",
    "incident_reports",
    "triage",
    "dispatches",
    "agent_messages"
]

def reset_demo():
    print("=" * 60)
    print("RIPPLE_MESH DEMO DATA RESET")
    print("=" * 60)

    with get_db() as conn:
        print("\n[Row counts BEFORE reset]:")
        for table in TABLES:
            try:
                count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                print(f"  {table:18}: {count}")
            except Exception as e:
                print(f"  {table:18}: [table not found or error: {e}]")

        # Disable foreign keys temporarily during cascade deletion if needed, then re-enable
        conn.execute("PRAGMA foreign_keys = OFF;")
        for table in TABLES:
            try:
                conn.execute(f"DELETE FROM {table}")
            except Exception as e:
                print(f"Error clearing {table}: {e}")
        conn.execute("PRAGMA foreign_keys = ON;")

        print("\n[Row counts AFTER reset]:")
        for table in TABLES:
            try:
                count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                print(f"  {table:18}: {count}")
            except Exception as e:
                print(f"  {table:18}: [table not found or error: {e}]")

        # Responders count check
        try:
            resp_count = conn.execute("SELECT COUNT(*) FROM responders").fetchone()[0]
            print(f"\n  responders (kept) : {resp_count}")
        except Exception as e:
            print(f"\n  responders (error): {e}")

    print("\n" + "=" * 60)
    print("RESET COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    reset_demo()
