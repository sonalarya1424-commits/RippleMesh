# RippleMesh Backend

Multi-Agent Disaster Response & Flood Situational Intelligence System powered by FastAPI, SQLite, and Gemma/Ollama.

---

## Project Structure

```text
RippleMesh/
  backend/
    main.py                  # FastAPI application entrypoint
    config.py                # Environment configuration (MODEL_NAME, OLLAMA_URL, MOCK_MODE)
    requirements.txt         # Project dependencies
    db/
      database.py            # SQLite connection helper & context manager
      schema.sql             # SQL schema (reports, incidents, dispatch, agent messages)
      init_db.py             # Script to initialize database tables
    agents/
      __init__.py
      gemma_client.py        # Ollama / Gemma interaction wrapper
      reporter.py            # Ingestion & normalization agent
      verifier.py            # Credibility check & image deduplication agent
      corroboration.py       # Spatial/temporal report clustering agent
      coordinator.py         # Incident synthesis & priority agent
      dispatcher.py          # Field rescue team dispatch agent
    services/
      messaging.py           # Agent message bus & persistence logger
      scoring.py             # Confidence & priority scoring formulas
    routes/
      reports.py             # Ingestion & report retrieval endpoints
      incidents.py           # Incident lifecycle endpoints
      dispatch.py            # Dispatch order creation & tracking
      messages.py            # Agent message log endpoints
    sample_data/
      sample_reports.json    # 5 sample flood report payloads for testing
  tests/                     # Test suite directory
  README.md
```

---

## Configuration & Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MODEL_NAME` | `gemma4:e2b` | Ollama model identifier |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama service endpoint |
| `MOCK_MODE` | `true` | When `true`, agents return realistic mock JSON without calling the model |
| `DATABASE_PATH` | `backend/db/ripplemesh.db` | Path to SQLite database file |

---

## Setup & Run Instructions

### 1. Create and Activate a Virtual Environment

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### 3. Initialize Database

```bash
python -m backend.db.init_db
```

*(Note: The database is also auto-initialized when starting the FastAPI app.)*

### 4. Run the Server

From the project root:

```bash
uvicorn backend.main:app --reload --port 8000
```

### 5. Access API & Documentation

- Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)
