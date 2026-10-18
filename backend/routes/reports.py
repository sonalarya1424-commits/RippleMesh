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

@router.get("/report-status/{report_id}")
def get_report_status(report_id: str):
    """Returns ONLY plain high-level status for citizens: received | verified | help_being_arranged | dismissed | resolved.
    Exposes no scores, confidence, trust, priority, coordinates, or incident IDs.
    """
    with get_db() as conn:
        # Check if report exists
        cur_rep = conn.execute("SELECT report_id, hazard_type FROM reports WHERE report_id = ?", (report_id,))
        rep = cur_rep.fetchone()
        if not rep:
            raise HTTPException(status_code=404, detail="Report not found")
        rep_dict = dict(rep)

        if rep_dict.get("hazard_type") == "none":
            return {
                "status": "dismissed",
                "message": "No emergency hazard was visible in your submission. Report dismissed."
            }

        # Check associated incident and dispatch
        cur_inc = conn.execute(
            """
            SELECT i.incident_id, i.status as inc_status, d.approval_status, d.outcome
            FROM incident_reports ir
            JOIN incidents i ON ir.incident_id = i.incident_id
            LEFT JOIN dispatches d ON i.incident_id = d.incident_id
            WHERE ir.report_id = ?
            ORDER BY d.dispatched_at DESC
            LIMIT 1
            """,
            (report_id,)
        )
        row = cur_inc.fetchone()

        if not row:
            # Check verification
            cur_ver = conn.execute("SELECT verification_id FROM verifications WHERE report_id = ?", (report_id,))
            ver = cur_ver.fetchone()
            if ver:
                return {
                    "status": "verified",
                    "message": "Your report has been verified by autonomous field agents."
                }
            return {
                "status": "received",
                "message": "Your report has been received and is queued for verification."
            }

        inc_data = dict(row)
        outcome = inc_data.get("outcome")
        approval = inc_data.get("approval_status")
        inc_status = inc_data.get("inc_status")

        if outcome == "resolved" or inc_status == "resolved":
            return {
                "status": "resolved",
                "message": "The situation has been attended to and resolved by field teams."
            }
        if outcome == "false_alarm" or inc_status in ("false_alarm", "rejected"):
            return {
                "status": "dismissed",
                "message": "The incident report has been reviewed and closed."
            }
        if approval in ("approved", "edited", "auto_alerted") or inc_status == "dispatched":
            return {
                "status": "help_being_arranged",
                "message": "Emergency response personnel have been dispatched to the scene."
            }
        if inc_status in ("triaged", "new"):
            return {
                "status": "help_being_arranged",
                "message": "Control room is prioritizing your incident and coordinating rescue resources."
            }

        return {
            "status": "verified",
            "message": "Your report has been verified and merged into local situation awareness."
        }
