"""Authentication and session management for coordinator dashboard."""
import secrets
import time
from collections import defaultdict
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel, Field
from backend.config import COORDINATOR_PIN

router = APIRouter(prefix="/auth", tags=["Auth"])

# In-memory session store: token -> {"name": str, "created_at": float}
_sessions: Dict[str, Dict[str, any]] = {}

# In-memory rate limiting for failed logins: ip -> list of failure timestamps
_failed_attempts: Dict[str, list] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
MAX_FAILED_ATTEMPTS = 5

class LoginPayload(BaseModel):
    name: str = Field(..., example="Commander Rao")
    pin: str = Field(..., example="4321")

def _check_rate_limit(ip: str):
    now = time.time()
    # keep only attempts within window
    _failed_attempts[ip] = [t for t in _failed_attempts[ip] if now - t < RATE_LIMIT_WINDOW]
    if len(_failed_attempts[ip]) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Please wait 1 minute before trying again."
        )

def _record_failed_attempt(ip: str):
    _failed_attempts[ip].append(time.time())

@router.post("/login")
def login(payload: LoginPayload, request: Request):
    """Coordinator login endpoint protected by PIN and IP rate limiting."""
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    if payload.pin != COORDINATOR_PIN:
        _record_failed_attempt(client_ip)
        raise HTTPException(status_code=401, detail="Invalid coordinator PIN")

    token = secrets.token_urlsafe(32)
    _sessions[token] = {
        "name": payload.name.strip() or "Coordinator",
        "created_at": time.time()
    }
    return {
        "status": "success",
        "token": token,
        "name": _sessions[token]["name"]
    }

@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    """Deletes active coordinator session."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        _sessions.pop(token, None)
    return {"status": "logged_out"}

def require_coordinator(authorization: Optional[str] = Header(None)) -> Dict[str, any]:
    """Dependency: validates Bearer token and returns session user dict."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    session = _sessions.get(token)
    if not session:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Session expired or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return session
