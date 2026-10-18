"""Routes for handling flood and emergency reports."""
import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.db.database import get_db
from backend.services.pipeline import run_pipeline

router = APIRouter(tags=["Reports"])

# Upload directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class ReportCreate(BaseModel):
    source: str = Field(..., example="sms")
    author: Optional[str] = Field(None, example="citizen_101")
    text_content: str = Field(..., example="Water level rising rapidly on Main Street, 3 feet high.")
    image_url: Optional[str] = Field(None, example="http://example.com/flood.jpg")
    latitude: Optional[float] = Field(None, example=13.0827)
    longitude: Optional[float] = Field(None, example=80.2707)
    location_name: Optional[str] = Field(None, example="Main Street Bridge")

@router.post("/report", status_code=201)
async def submit_multipart_report(
    device_id: Optional[str] = Form(None),
    transcript: str = Form(""),
    lat: Optional[float] = Form(None),
    lng: Optional[float] = Form(None),
    capture_mode: str = Form("in_app"),
    image: Optional[UploadFile] = File(None)
):
    """Multipart form endpoint: saves image to backend/uploads/ and runs agent pipeline."""
    saved_image_path: Optional[str] = None
    if image and image.filename:
        file_ext = Path(image.filename).suffix or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{file_ext}"
        destination = UPLOAD_DIR / unique_name
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        saved_image_path = str(destination)

    try:
        pipeline_res = run_pipeline(
            device_id=device_id,
            transcript=transcript,
            image_path=saved_image_path,
            lat=lat,
            lng=lng,
            capture_mode=capture_mode
        )
        return {
            "status": "success",
            "data": pipeline_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reports", status_code=201)
def create_report(payload: ReportCreate):
    """Fallback JSON endpoint for logging raw reports."""
    report_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO reports (report_id, transcript, summary, lat, lng, capture_mode)
            VALUES (?, ?, ?, ?, ?, 'in_app')
            """,
            (report_id, payload.text_content, payload.text_content[:50], payload.latitude, payload.longitude),
        )
    return {"id": report_id, "status": "received", "message": "Report logged successfully"}

@router.get("/reports", response_model=List[Dict[str, Any]])
def list_reports(limit: int = 50):
    """List recent reports."""
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT report_id, device_id, lat, lng, hazard_type, summary,
                   transcript, reporter_conf, capture_mode, payload_bytes,
                   phash, image_path, claim_matches_photo, people_at_risk,
                   vulnerable, time_to_harm_guess, created_at
            FROM reports
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]

@router.get("/reports/{report_id}")
def get_report(report_id: str):
    """Retrieve a single report by ID."""
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Report not found")
        return dict(row)
