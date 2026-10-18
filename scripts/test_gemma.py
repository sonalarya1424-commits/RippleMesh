import os
import sys
import time
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Force MOCK_MODE to false for this script only
import backend.config as config
config.MOCK_MODE = False

from backend.agents.gemma_client import ask_gemma

def run_test():
    project_root = Path(__file__).resolve().parent.parent

    # Find first flood image
    flood_dir = project_root / "test_images" / "flood"
    normal_dir = project_root / "test_images" / "normal"

    flood_images = sorted([f for f in flood_dir.glob("*.jpg")]) or sorted([f for f in flood_dir.glob("*.png")])
    normal_images = sorted([f for f in normal_dir.glob("*.jpg")]) or sorted([f for f in normal_dir.glob("*.png")])

    if not flood_images:
        print(f"[ERROR] No images found in {flood_dir}")
        return
    if not normal_images:
        print(f"[ERROR] No images found in {normal_dir}")
        return

    first_flood = str(flood_images[0])
    first_normal = str(normal_images[0])

    prompt = "Describe this scene in 2 sentences. Is there flooding? Are people at risk?"
    system_prompt = "You are an emergency disaster response analyst. Be concise, precise, and objective."

    print("=" * 60)
    print("Testing Gemma with First Flood Image:")
    print(f"Path: {first_flood}")
    print("=" * 60)
    t0 = time.time()
    flood_answer = ask_gemma(
        system_prompt=system_prompt,
        user_text=prompt,
        image_path=first_flood,
        json_mode=False
    )
    flood_latency = time.time() - t0

    print("\n[Flood Image Answer]:")
    print(flood_answer.strip())
    print(f"[Flood Image Latency]: {flood_latency:.2f}s")

    print("\n" + "=" * 60)
    print("Testing Gemma with First Normal Image:")
    print(f"Path: {first_normal}")
    print("=" * 60)
    t0 = time.time()
    normal_answer = ask_gemma(
        system_prompt=system_prompt,
        user_text=prompt,
        image_path=first_normal,
        json_mode=False
    )
    normal_latency = time.time() - t0

    print("\n[Normal Image Answer]:")
    print(normal_answer.strip())
    print(f"[Normal Image Latency]: {normal_latency:.2f}s")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    run_test()
