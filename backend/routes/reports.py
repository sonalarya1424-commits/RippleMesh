"""Routes for handling flood and emergency reports."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
from backend.db.database import get_db

router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportCreate(BaseModel):
    source: str = Field(..., example="sms")
    author: Optional[str] = Field(None, example="citizen_101")
    text_content: str = Field(..., example="Water level rising rapidly on Main Street, 3 feet high.")
    image_url: Optional[str] = Field(None, example="http://example.com/flood.jpg")
    latitude: Optional[float] = Field(None, example=13.0827)
    longitude: Optional[float] = Field(None, example=80.2707)
    location_name: Optional[str] = Field(None, example="Main Street Bridge")

@router.post("/", status_code=201)
def create_report(payload: ReportCreate):
    """Ingest a new report and trigger processing pipeline."""
    report_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO reports (id, source, author, text_content, image_url, latitude, longitude, location_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report_id,
                payload.source,
                payload.author,
                payload.text_content,
                payload.image_url,
                payload.latitude,
                payload.longitude,
                payload.location_name,
            ),
        )
    return {"id": report_id, "status": "received", "message": "Report logged successfully"}

@router.get("/", response_model=List[Dict[str, Any]])
def list_reports(limit: int = 50):
    """List recent reports."""
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT id, source, author, text_content, image_url, image_hash, latitude, longitude,
                   location_name, status, confidence, created_at
            FROM reports
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]

@router.get("/{report_id}")
def get_report(report_id: str):
    """Retrieve a single report by ID."""
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Report not found")
        return dict(row)
