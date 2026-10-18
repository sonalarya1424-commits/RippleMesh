import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import sqlite3
from backend.config import DATABASE_PATH

ADDITIONAL_RESPONDERS = [
    {
        "responder_id": "resp-belagavi-ndrf-land-01",
        "name": "NDRF Search and Rescue Team (land)",
        "type": "ndrf_land",
        "lat": 15.8640,
        "lng": 74.5095,
        "available": 1,
        "contact": "+91-831-2408201",
    },
    {
        "responder_id": "resp-belagavi-civil-vol-01",
        "name": "Civil Defence Volunteers",
        "type": "volunteer",
        "lat": 15.8515,
        "lng": 74.5070,
        "available": 1,
        "contact": "+91-831-2409999",
    },
]

def seed_more():
    conn = sqlite3.connect(DATABASE_PATH)
    try:
        cursor = conn.cursor()
        for resp in ADDITIONAL_RESPONDERS:
            cursor.execute(
                """
                INSERT OR IGNORE INTO responders (responder_id, name, type, lat, lng, available, contact)
                VALUES (:responder_id, :name, :type, :lat, :lng, :available, :contact)
                """,
                resp,
            )
        conn.commit()
        print(f"[seed_more_responders] Successfully seeded {len(ADDITIONAL_RESPONDERS)} responders.")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_more()
