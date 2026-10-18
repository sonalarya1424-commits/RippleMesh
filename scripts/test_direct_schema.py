import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import backend.config as config
config.MOCK_MODE = False
import ollama
from backend.agents.coordinator import COORDINATOR_SYSTEM_PROMPT, COORDINATOR_JSON_SCHEMA

prompt = """Incident ID: inc-real-test-B
Hazard: flood
Independent Reports: 500
Confidence Score: 0.92

Witness Reports / Transcripts:
  1. "a girl is standing near the flood water at the edge"

Verification Notes:
  - Multiple reports confirm girl standing safely at perimeter."""

print("Testing direct Ollama call with format=COORDINATOR_JSON_SCHEMA...")
try:
    res = ollama.chat(
        model=config.MODEL_NAME,
        messages=[
            {"role": "system", "content": COORDINATOR_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        format=COORDINATOR_JSON_SCHEMA,
        options={"num_predict": 500}
    )
    print("Content:\n", res["message"]["content"])
except Exception as e:
    print(f"Error: {e}")
