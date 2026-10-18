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
