# RippleMesh — Autonomous Disaster Rescue Coordination & Intelligence System

RippleMesh is an offline-first, AI-powered disaster rescue coordination system designed for emergency operations centers (EOC) and mesh networks when conventional power and cellular infrastructure are severed.

This repository contains both the **Coordinator Dashboard** (React/Vite) and the **Multi-Agent Backend & Intelligence Service** (FastAPI, SQLite, Gemma/Ollama).

---

## Project Structure

```text
RippleMesh/
├── frontend/                    # Coordinator Dashboard (React + Vite)
│   ├── index.html               # HTML template with Google Fonts
│   ├── package.json             # React + Vite setup
│   ├── vite.config.js           # Dev server configuration
│   └── src/                     # Dashboard frontend source
│       ├── main.jsx             # Application entrypoint
│       ├── App.jsx              # Root state management & local mutations
│       ├── components/          # Tactical UI Components
│       ├── data/                # Mock incidents & responder datasets
│       ├── styles/              # Modular CSS Architecture
│       └── utils/               # IndexedDB offline persistence
├── backend/                     # Multi-Agent Backend
│   ├── main.py                  # FastAPI application entrypoint
│   ├── config.py                # Configuration (MODEL_NAME, OLLAMA_URL, MOCK_MODE)
│   ├── requirements.txt         # Python dependencies
│   ├── db/
│   │   ├── database.py          # SQLite connection helper & context manager
│   │   ├── schema.sql           # Database schema (12 tables with FKs & indexes)
│   │   ├── init_db.py           # Database initializer & Belagavi responders seeder
│   │   └── verify_db.py         # Schema verification helper
│   ├── agents/                  # Multi-agent system skeletons (Gemma, Reporter, Verifier, Corroboration, Coordinator, Dispatcher)
│   ├── services/                # Inter-agent messaging bus and scoring algorithms
│   ├── routes/                  # API endpoints (reports, incidents, dispatch, messages)
│   └── sample_data/             # Test flood report payloads
├── scripts/
│   └── get_dataset.py           # Disaster damage dataset downloader and sampler
├── test_images/                 # Sampled 90 test images across 6 hazard classes with labels.csv
└── tests/                       # Test suite
```

---

## 1. Coordinator Dashboard (Frontend)

### Setup & Run
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 2. Backend API & Agent Service

### Setup & Run
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python -m backend.db.init_db
uvicorn backend.main:app --reload --port 8000
```
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

## 3. Disaster Damage Dataset

To download and sample 15 images per class (earthquake, fire, flood, landslide, normal, smoke) from Kaggle into `test_images/`:
```bash
python scripts/get_dataset.py
```

---

## 4. API Endpoints & cURL Examples

### Health Check
```bash
curl -X GET "http://localhost:8000/health"
```

### Submit Distress Report (Multipart Ingestion & Pipeline)
```bash
curl -X POST "http://localhost:8000/report" \
  -F "device_id=node-belagavi-01" \
  -F "transcript=water rising near bridge, elderly person trapped" \
  -F "lat=15.8523" \
  -F "lng=74.5085" \
  -F "capture_mode=in_app" \
  -F "image=@test_images/flood/flood1408.jpg"
```

### List Prioritized Incidents
```bash
curl -X GET "http://localhost:8000/incidents"
```

### Incident Provenance Chain
```bash
curl -X GET "http://localhost:8000/incidents/{incident_id}"
```

### Approve / Edit / Reject Dispatch
```bash
curl -X POST "http://localhost:8000/dispatch/{dispatch_id}/approve" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve", "approver": "Commander Rao"}'
```

### Record Mission Outcome
```bash
curl -X POST "http://localhost:8000/dispatch/{dispatch_id}/outcome" \
  -H "Content-Type: application/json" \
  -d '{"outcome": "resolved"}'
```

### Retrieve Inter-Agent Message Logs
```bash
curl -X GET "http://localhost:8000/messages?limit=50"
```
