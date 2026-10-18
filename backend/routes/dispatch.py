"""Routes for field team dispatch and resource logistics."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uuid
from backend.db.database import get_db

router = APIRouter(prefix="/dispatch", tags=["Dispatch"])

class DispatchOrderCreate(BaseModel):
    incident_id: str = Field(..., example="inc-123")
    team_name: str = Field(..., example="Rescue Unit Alpha")
    resource_type: str = Field(..., example="Inflatable Boat + Medic")
    instructions: Optional[str] = Field(None, example="Evacuate elderly residents near temple.")

@router.post("/", status_code=201)
def create_dispatch_order(payload: DispatchOrderCreate):
    """Create a new dispatch deployment order."""
    order_id = str(uuid.uuid4())
    with get_db() as conn:
        # Check incident exists
        check = conn.execute("SELECT id FROM incidents WHERE id = ?", (payload.incident_id,)).fetchone()
        if not check:
            raise HTTPException(status_code=404, detail="Incident not found")

        conn.execute(
            """
            INSERT INTO dispatch_orders (id, incident_id, team_name, resource_type, instructions)
            VALUES (?, ?, ?, ?, ?)
            """,
            (order_id, payload.incident_id, payload.team_name, payload.resource_type, payload.instructions),
        )
    return {"id": order_id, "status": "dispatched"}

@router.get("/", response_model=List[Dict[str, Any]])
def list_dispatch_orders(limit: int = 50):
    """List all recent dispatch orders."""
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT id, incident_id, team_name, resource_type, instructions, status, dispatched_at
            FROM dispatch_orders
            ORDER BY dispatched_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]
