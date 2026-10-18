import os

MODEL_NAME = os.getenv("MODEL_NAME", "gemma4:e2b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() in ("true", "1", "yes")

DATABASE_PATH = os.getenv("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "db", "ripplemesh.db"))

CLUSTER_RADIUS_M = float(os.getenv("CLUSTER_RADIUS_M", 200))
CLUSTER_WINDOW_MIN = float(os.getenv("CLUSTER_WINDOW_MIN", 30))

COORDINATOR_PIN = os.getenv("COORDINATOR_PIN", "4321")
