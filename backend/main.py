from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import MODEL_NAME, MOCK_MODE, OLLAMA_URL
from backend.db.init_db import init_db
from backend.routes.reports import router as reports_router
from backend.routes.incidents import router as incidents_router
from backend.routes.dispatch import router as dispatch_router
from backend.routes.messages import router as messages_router
from backend.services.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist at startup
    init_db()
    if MOCK_MODE:
        print(f"MODE: MOCK (fake data, no model)")
    else:
        print(f"MODE: REAL ({MODEL_NAME})")
    yield

app = FastAPI(
    title="RippleMesh Backend API",
    description="Multi-agent disaster response & flood situational intelligence system",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(reports_router)
app.include_router(incidents_router)
app.include_router(dispatch_router)
app.include_router(messages_router)
app.include_router(auth_router)

from pathlib import Path
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

UI_DIR = Path(__file__).resolve().parent / "ui"
UI_DIR.mkdir(parents=True, exist_ok=True)
CITIZEN_DIR = UI_DIR / "citizen"
COORDINATOR_DIR = UI_DIR / "coordinator"
CITIZEN_DIR.mkdir(parents=True, exist_ok=True)
COORDINATOR_DIR.mkdir(parents=True, exist_ok=True)

# Mount sub-directories
app.mount("/citizen", StaticFiles(directory=str(CITIZEN_DIR), html=True), name="citizen")
app.mount("/coordinator", StaticFiles(directory=str(COORDINATOR_DIR), html=True), name="coordinator")
# Mount style.css / static assets
app.mount("/ui-static", StaticFiles(directory=str(UI_DIR)), name="ui-static")

@app.get("/", include_in_schema=False)
def landing_page():
    landing_file = UI_DIR / "index.html"
    if landing_file.exists():
        return FileResponse(landing_file)
    return RedirectResponse(url="/citizen/")

@app.get("/health", tags=["System"])
def health_check():
    """Health status and current agent configuration."""
    return {
        "status": "healthy",
        "mock_mode": MOCK_MODE,
        "model": MODEL_NAME,
        "model_name": MODEL_NAME,
        "ollama_url": OLLAMA_URL,
    }
