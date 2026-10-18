import os
import sqlite3
from backend.db.init_db import init_db

def verify():
    # Reinitialize cleanly
    init_db(reset=True)

    conn = sqlite3.connect("backend/db/ripplemesh.db")
    cursor = conn.cursor()

    # Verify tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall() if not row[0].startswith("sqlite_")]
    print("--- TABLES ---")
    for t in tables:
        print(f"  - {t}")

    # Verify seeded responders
    cursor.execute("SELECT responder_id, name, type, lat, lng, contact FROM responders;")
    responders = cursor.fetchall()
    print("\n--- SEEDED RESPONDERS ---")
    for r in responders:
        print(f"  {r[0]}: {r[1]} ({r[2]}) at ({r[3]}, {r[4]}) [Contact: {r[5]}]")

    # Verify indexes
    cursor.execute("SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND NOT name LIKE 'sqlite_autoindex_%' ORDER BY tbl_name, name;")
    indexes = cursor.fetchall()
    print("\n--- INDEXES ---")
    for idx in indexes:
        print(f"  {idx[0]} on {idx[1]}")

    conn.close()

if __name__ == "__main__":
    verify()
