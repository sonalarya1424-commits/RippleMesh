"""Demo script testing the running FastAPI server.

Posts 3 reports to POST /report:
- 2 from different device ids at the SAME place using flood images (to cluster into one incident)
- 1 from another device at a place > 500m away using a normal image
Then queries and prints GET /incidents and GET /messages.
"""
import os
import sys
import time
import json
import requests
from pathlib import Path

BASE_URL = "http://localhost:8000"

def run_demo():
    project_root = Path(__file__).resolve().parent.parent

    # Find test images
    flood_dir = project_root / "test_images" / "flood"
    normal_dir = project_root / "test_images" / "normal"

    flood_images = sorted([f for f in flood_dir.glob("*.jpg")]) or sorted([f for f in flood_dir.glob("*.png")])
    normal_images = sorted([f for f in normal_dir.glob("*.jpg")]) or sorted([f for f in normal_dir.glob("*.png")])

    if len(flood_images) < 2 or not normal_images:
        print("[ERROR] Insufficient test images in test_images/ directory.")
        return

    # Pick 2 new flood images that were not used before (e.g. index 2 and 3)
    flood_img1 = str(flood_images[2]) if len(flood_images) > 2 else str(flood_images[0])
    flood_img2 = str(flood_images[3]) if len(flood_images) > 3 else str(flood_images[1])
    normal_img = str(normal_images[0])
    print(f"Selected test images:\n  Flood 1: {Path(flood_img1).name}\n  Flood 2: {Path(flood_img2).name}\n  Normal:  {Path(normal_img).name}")

    print("=" * 80)
    print("SUBMITTING REPORT 1 (Flood near bridge, Device A)")
    print("=" * 80)
    # Report 1: Belagavi Point 1 (15.8523, 74.5085)
    with open(flood_img1, "rb") as f1:
        res1 = requests.post(
            f"{BASE_URL}/report",
            data={
                "device_id": "demo-dev-A",
                "transcript": "water is rising rapidly near the bridge, roadway submerged",
                "lat": 15.8523,
                "lng": 74.5085,
                "capture_mode": "in_app"
            },
            files={"image": ("flood1.jpg", f1, "image/jpeg")}
        )
    print("Response 1:", res1.status_code, json.dumps(res1.json(), indent=2))

    print("\n" + "=" * 80)
    print("SUBMITTING REPORT 2 (Flood near bridge, Device B - SAME location, should cluster)")
    print("=" * 80)
    # Report 2: Belagavi Point 1 (15.8525, 74.5087) ~ 30 meters away, same hazard
    with open(flood_img2, "rb") as f2:
        res2 = requests.post(
            f"{BASE_URL}/report",
            data={
                "device_id": "demo-dev-B",
                "transcript": "water level continuing to rise around bridge pylons",
                "lat": 15.8525,
                "lng": 74.5087,
                "capture_mode": "in_app"
            },
            files={"image": ("flood2.jpg", f2, "image/jpeg")}
        )
    print("Response 2:", res2.status_code, json.dumps(res2.json(), indent=2))

    print("\n" + "=" * 80)
    print("SUBMITTING REPORT 3 (Normal Scene, Device C - > 1 km away, separate incident)")
    print("=" * 80)
    # Report 3: Belagavi North (15.8750, 74.5250) ~ 3 km away
    with open(normal_img, "rb") as f3:
        res3 = requests.post(
            f"{BASE_URL}/report",
            data={
                "device_id": "demo-dev-C",
                "transcript": "routine patrol, road is clear and dry here",
                "lat": 15.8750,
                "lng": 74.5250,
                "capture_mode": "in_app"
            },
            files={"image": ("normal.jpg", f3, "image/jpeg")}
        )
    res3_json = res3.json()
    print("Response 3:", res3.status_code, json.dumps(res3_json, indent=2))
    
    # Check if Report 3 (normal image) was dismissed
    data3 = res3_json.get("data", {})
    is_dismissed = data3.get("dismissed", False)
    dismiss_reason = data3.get("reason", "N/A")
    print(f"\n>>> Report 3 (Normal Scene) Dismissal Status: Dismissed={is_dismissed} (Reason: {dismiss_reason})")

    print("\n" + "=" * 80)
    print("GET /incidents (Sorted by priority_score descending)")
    print("=" * 80)
    res_inc = requests.get(f"{BASE_URL}/incidents")
    incidents = res_inc.json()
    print(f"Total Incidents: {len(incidents)}")
    for inc in incidents:
        print(f"\n  Incident ID: {inc.get('incident_id')} | Hazard: {inc.get('hazard_type')}")
        print(f"  Priority: {inc.get('priority_score')} | Life Threat: {inc.get('life_threat')} | Status: {inc.get('status')}")
        print(f"  Witnesses (Independent): {inc.get('independent_reports')} | Confidence: {inc.get('confidence')} | Trust: {inc.get('trust')}")
        print(f"  Coordinates: ({inc.get('lat')}, {inc.get('lng')}) | Unverified: {inc.get('unverified')}")
        print(f"  Reasoning: {inc.get('reasoning')}")

    print("\n" + "=" * 80)
    print("GET /messages?limit=50 (Inter-Agent Message Bus, chronological order - oldest first)")
    print("=" * 80)
    res_msg = requests.get(f"{BASE_URL}/messages?limit=50")
    messages = res_msg.json()
    
    # Chronological order (oldest first)
    messages_chronological = list(reversed(messages))
    msg_types_in_order = [m.get("msg_type") for m in messages_chronological]
    print(f"\nFULL LIST OF MESSAGE TYPES (Chronological / Oldest First, Total: {len(msg_types_in_order)}):")
    print(" -> ".join(msg_types_in_order))
    print("\nMessages Log (Oldest First):")
    for m in messages_chronological:
        print(f"  [{m.get('sent_at')}] {m.get('from_agent')} -> {m.get('to_agent')} [{m.get('msg_type')}] (bytes: {m.get('bytes')})")

    print("\n" + "=" * 80)
    print("DEMO RUN COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    run_demo()
