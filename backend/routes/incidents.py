"""Routes for incident management, clustering, and review."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
from backend.db.database import get_db

router = APIRouter(prefix="/incidents", tags=["Incidents"])

class IncidentCreate(BaseModel):
    title: str = Field(..., example="Severe Inundation Sector 4")
    description: Optional[str] = Field(None, example="Flood levels exceeding 4 feet near market.")
    severity: str = Field("moderate", example="high")
    primary_latitude: Optional[float] = Field(None, example=13.0827)
    primary_longitude: Optional[float] = Field(None, example=80.2707)
    radius_meters: Optional[float] = Field(500.0, example=500.0)

@router.post("/", status_code=201)
def create_incident(payload: IncidentCreate):
    """Manually or agentically declare a new unified incident."""
    incident_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO incidents (id, title, description, severity, primary_latitude, primary_longitude, radius_meters)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                incident_id,
                payload.title,
                payload.description,
                payload.severity,
                payload.primary_latitude,
                payload.primary_longitude,
                payload.radius_meters,
            ),
        )
    return {"id": incident_id, "status": "created"}

@router.get("/", response_model=List[Dict[str, Any]])
def list_incidents(limit: int = 50):
    """List all incidents ordered by creation time."""
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT id, title, description, severity, status, priority_score,
                   primary_latitude, primary_longitude, radius_meters, created_at, updated_at
            FROM incidents
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]

@router.get("/{incident_id}")
def get_incident(incident_id: str):
    """Retrieve details of a specific incident including linked reports."""
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,))
        incident = cursor.fetchone()
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")

        # Fetch attached reports
        cursor_reports = conn.execute(
            """
            SELECT r.* FROM reports r
            JOIN incident_reports ir ON r.id = ir.report_id
            WHERE ir.incident_id = ?
            """,
            (incident_id,),
        )
        reports = [dict(r) for r in cursor_reports.fetchall()]
        
        data = dict(incident)
        data["linked_reports"] = reports
        return data
