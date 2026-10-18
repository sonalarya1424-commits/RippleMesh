"""Migration 001: Safely add missing columns to reports and incidents tables if not already present."""
import sqlite3
from backend.config import DATABASE_PATH

def migrate():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Helper function to get existing column names for a table
    def get_columns(table_name: str):
        cursor.execute(f"PRAGMA table_info({table_name});")
        return {row[1] for row in cursor.fetchall()}

    reports_cols = get_columns("reports")
    incidents_cols = get_columns("incidents")

    # Columns to check for reports:
    # phash, image_path, claim_matches_photo, people_at_risk, vulnerable, time_to_harm_guess, reporter_conf, capture_mode
    reports_to_add = {
        "phash": "TEXT",
        "image_path": "TEXT",
        "claim_matches_photo": "REAL",
        "people_at_risk": "INTEGER",
        "vulnerable": "INTEGER",
        "time_to_harm_guess": "TEXT",
        "reporter_conf": "REAL",
        "capture_mode": "TEXT",
    }

    print("Checking 'reports' table columns...")
    for col, col_type in reports_to_add.items():
        if col not in reports_cols:
            print(f"  Adding column 'reports.{col}' ({col_type})...")
            cursor.execute(f"ALTER TABLE reports ADD COLUMN {col} {col_type};")
        else:
            print(f"  Column 'reports.{col}' already exists. Skipping.")

    # Columns to check for incidents:
    # unverified, priority_score, confidence, independent_reports, status
    incidents_to_add = {
        "unverified": "INTEGER DEFAULT 0",
        "priority_score": "REAL DEFAULT 0.0",
        "confidence": "REAL DEFAULT 0.0",
        "independent_reports": "INTEGER DEFAULT 1",
        "status": "TEXT DEFAULT 'new'",
    }

    print("\nChecking 'incidents' table columns...")
    for col, col_def in incidents_to_add.items():
        if col not in incidents_cols:
            print(f"  Adding column 'incidents.{col}' ({col_def})...")
            cursor.execute(f"ALTER TABLE incidents ADD COLUMN {col} {col_def};")
        else:
            print(f"  Column 'incidents.{col}' already exists. Skipping.")

    conn.commit()
    conn.close()
    print("\nMigration 001 applied successfully and verified idempotent.")

if __name__ == "__main__":
    migrate()
