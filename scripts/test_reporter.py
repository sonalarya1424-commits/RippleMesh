import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Force MOCK_MODE = False for this test script only
import backend.config as config
config.MOCK_MODE = False

from backend.agents.reporter import create_report
from backend.services.messaging import message_bus

def run_test():
    flood_dir = PROJECT_ROOT / "test_images" / "flood"
    flood_images = sorted([f for f in flood_dir.glob("*.jpg")]) or sorted([f for f in flood_dir.glob("*.png")])

    if not flood_images:
        print(f"[ERROR] No flood images found in {flood_dir}")
        return

    test_image = str(flood_images[0])
    test_text = "water is rising near the bridge"

    print("=" * 60)
    print("Testing Reporter Agent (MOCK_MODE=False)")
    print(f"Image: {test_image}")
    print(f"Transcript: {test_text}")
    print("=" * 60)

    report_row = create_report(
        device_id="node-belagavi-mesh-01",
        transcript_text=test_text,
        image_path=test_image,
        lat=15.8523,
        lng=74.5085,
        capture_mode="in_app"
    )

    print("\n--- SAVED REPORT ROW FROM DATABASE ---")
    for k, v in report_row.items():
        print(f"  {k}: {v}")

    print("\n--- LATEST AGENT MESSAGES (from messaging bus) ---")
    msgs = message_bus.get_messages(limit=2)
    for m in msgs:
        print(f"  [Msg ID: {m['message_id']}] from={m['from_agent']} to={m['to_agent']} type={m['msg_type']} bytes={m['bytes']}")
        print(f"  Payload: {m['body']}")

    print("\n" + "=" * 60)
    print("Reporter Agent test complete!")
    print("=" * 60)

if __name__ == "__main__":
    run_test()
