from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import MODEL_NAME, MOCK_MODE, OLLAMA_URL
from backend.db.init_db import init_db
from backend.routes.reports import router as reports_router
from backend.routes.incidents import router as incidents_router
from backend.routes.dispatch import router as dispatch_router
from backend.routes.messages import router as messages_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist at startup
    init_db()
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

@app.get("/health", tags=["System"])
def health_check():
    """Health status and current agent configuration."""
    return {
        "status": "healthy",
        "mock_mode": MOCK_MODE,
        "model_name": MODEL_NAME,
        "ollama_url": OLLAMA_URL,
    }
