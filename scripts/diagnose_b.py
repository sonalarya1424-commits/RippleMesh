import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import backend.config as config
config.MOCK_MODE = False
from backend.agents.gemma_client import ask_gemma, _extract_json
from backend.agents.coordinator import COORDINATOR_SYSTEM_PROMPT

prompt = """Incident ID: inc-real-test-B
Hazard: flood
Independent Reports: 500
Confidence Score: 0.92

Witness Reports / Transcripts:
  1. "a girl is standing near the flood water at the edge"

Verification Notes:
  - Multiple reports confirm girl standing safely at perimeter."""

print("=" * 70)
print("PART A: DIAGNOSE INCIDENT B TRIAGE (3 ATTEMPTS)")
print("=" * 70)

for i in range(1, 4):
    print(f"\n--- ATTEMPT {i} ---")
    res = ask_gemma(
        system_prompt=COORDINATOR_SYSTEM_PROMPT,
        user_text=prompt,
        json_mode=False,
        thinking=False,
        num_predict=500
    )
    raw_str = str(res)
    print(f"Raw Gemma Output (repr):\n{repr(raw_str)}")
    try:
        parsed = _extract_json(raw_str)
        print(f"JSON Parsing SUCCESS: {parsed}")
    except Exception as e:
        print(f"Exact reason parsing failed: {type(e).__name__}: {e}")
