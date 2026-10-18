import os
import sqlite3
from backend.config import DATABASE_PATH

# 4 Seed Responders in the Belagavi (Belgaum, Karnataka) area
SEED_RESPONDERS = [
    {
        "responder_id": "resp-belagavi-fire-01",
        "name": "Belagavi Central Fire Station",
        "type": "fire_station",
        "lat": 15.8497,
        "lng": 74.4977,
        "available": 1,
        "contact": "+91-831-2407101",
    },
    {
        "responder_id": "resp-belagavi-ndrf-01",
        "name": "NDRF 10th Bn Quick Response Boat Team",
        "type": "boat_team",
        "lat": 15.8660,
        "lng": 74.5120,
        "available": 1,
        "contact": "+91-831-2408200",
    },
    {
        "responder_id": "resp-belagavi-amb-01",
        "name": "BIMS Emergency Ambulance Unit",
        "type": "ambulance",
        "lat": 15.8582,
        "lng": 74.5028,
        "available": 1,
        "contact": "+91-831-2403108",
    },
    {
        "responder_id": "resp-belagavi-pwd-01",
        "name": "Belagavi PWD Drainage & Debris Clearing Unit",
        "type": "pwd_unit",
        "lat": 15.8523,
        "lng": 74.5085,
        "available": 1,
        "contact": "+91-831-2405400",
    },
]

def init_db(reset: bool = False):
    """Initializes the database schema and seeds initial data."""
    db_dir = os.path.dirname(DATABASE_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    if reset and os.path.exists(DATABASE_PATH):
        os.remove(DATABASE_PATH)

    schema_file = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(DATABASE_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        conn.executescript(schema_sql)
        
        # Seed responders if not already present
        cursor = conn.cursor()
        for resp in SEED_RESPONDERS:
            cursor.execute(
                """
                INSERT OR IGNORE INTO responders (responder_id, name, type, lat, lng, available, contact)
                VALUES (:responder_id, :name, :type, :lat, :lng, :available, :contact)
                """,
                resp,
            )
        conn.commit()
        print(f"Database initialized and seeded successfully at: {DATABASE_PATH}")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
