"""Routes for viewing inter-agent message logs and communication activity."""
from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from backend.services.messaging import message_bus
from backend.services.auth import require_coordinator

router = APIRouter(prefix="/messages", tags=["Messages"])

class AgentMessageCreate(BaseModel):
    sender: str = Field(..., example="reporter")
    receiver: str = Field(..., example="verifier")
    message_type: str = Field(..., example="NEW_REPORT")
    payload: Dict[str, Any] = Field(default_factory=dict)

@router.post("/", status_code=201)
def send_agent_message(data: AgentMessageCreate):
    """Publish a new message to the agent bus."""
    msg_id = message_bus.publish(
        sender=data.sender,
        receiver=data.receiver,
        message_type=data.message_type,
        payload=data.payload,
    )
    return {"id": msg_id, "status": "published"}

@router.get("/", response_model=List[Dict[str, Any]])
def list_messages(limit: int = Query(50, ge=1, le=500), session: Dict[str, Any] = Depends(require_coordinator)):
    """Retrieve logged messages between autonomous agents, newest first."""
    return message_bus.get_messages(limit=limit)
