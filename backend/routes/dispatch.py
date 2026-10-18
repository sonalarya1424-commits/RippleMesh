"""Routes for field team dispatch, approval, outcome updates, and resource logistics."""
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from backend.db.database import get_db
from backend.services.messaging import send_message
from backend.services.auth import require_coordinator

router = APIRouter(prefix="/dispatch", tags=["Dispatch"])

class DispatchApprovePayload(BaseModel):
    action: str = Field(..., example="approve")  # approve | edit | reject
    edited_card: Optional[Dict[str, Any]] = None
    approver: Optional[str] = Field("human_operator", example="Commander Rao")

class DispatchOutcomePayload(BaseModel):
    outcome: str = Field(..., example="resolved")  # reached | resolved | false_alarm

@router.post("/{dispatch_id}/approve")
def approve_dispatch(dispatch_id: str, payload: DispatchApprovePayload, session: Dict[str, Any] = Depends(require_coordinator)):
    """Update approval_status and incident status, send HUMAN_DECISION message."""
    action = payload.action.lower().strip()
    status_map = {
        "approve": "approved",
        "edit": "edited",
        "reject": "rejected"
    }
    if action not in status_map:
        raise HTTPException(status_code=400, detail=f"Invalid action '{payload.action}'. Allowed: approve, edit, reject")

    new_approval_status = status_map[action]
    approver_name = session.get("name", "coordinator-1")

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM dispatches WHERE dispatch_id = ?", (dispatch_id,))
        dsp = cursor.fetchone()
        if not dsp:
            raise HTTPException(status_code=404, detail="Dispatch order not found")
        dsp_dict = dict(dsp)
        incident_id = dsp_dict["incident_id"]

        # If edited_card provided, serialize it
        task_card_update = None
        if payload.edited_card:
            task_card_update = json.dumps(payload.edited_card)

        if task_card_update:
            conn.execute(
                """
                UPDATE dispatches
                SET approval_status = ?, approved_by = ?, task_card = ?
                WHERE dispatch_id = ?
                """,
                (new_approval_status, approver_name, task_card_update, dispatch_id),
            )
        else:
            conn.execute(
                """
                UPDATE dispatches
                SET approval_status = ?, approved_by = ?
                WHERE dispatch_id = ?
                """,
                (new_approval_status, approver_name, dispatch_id),
            )

        # Update incident status
        new_inc_status = "dispatched" if action in ("approve", "edit") else "rejected"
        conn.execute(
            "UPDATE incidents SET status = ?, last_updated_at = CURRENT_TIMESTAMP WHERE incident_id = ?",
            (new_inc_status, incident_id),
        )

    # Send HUMAN_DECISION message from "human_coordinator" to "dispatcher"
    send_message(
        from_agent="human_coordinator",
        to_agent="dispatcher",
        msg_type="HUMAN_DECISION",
        body={
            "dispatch_id": dispatch_id,
            "incident_id": incident_id,
            "action": action,
            "approval_status": new_approval_status,
            "approver": approver_name,
            "edited_card": payload.edited_card
        },
        ref_id=dispatch_id
    )

    return {
        "dispatch_id": dispatch_id,
        "incident_id": incident_id,
        "approval_status": new_approval_status,
        "incident_status": new_inc_status
    }

@router.post("/{dispatch_id}/outcome")
def set_dispatch_outcome(dispatch_id: str, payload: DispatchOutcomePayload, session: Dict[str, Any] = Depends(require_coordinator)):
    """Set field mission outcome: reached | resolved | false_alarm."""
    allowed_outcomes = {"reached", "resolved", "false_alarm"}
    outcome = payload.outcome.lower().strip()
    if outcome not in allowed_outcomes:
        raise HTTPException(status_code=400, detail=f"Invalid outcome '{payload.outcome}'. Allowed: reached, resolved, false_alarm")

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM dispatches WHERE dispatch_id = ?", (dispatch_id,))
        dsp = cursor.fetchone()
        if not dsp:
            raise HTTPException(status_code=404, detail="Dispatch order not found")
        dsp_dict = dict(dsp)
        incident_id = dsp_dict["incident_id"]

        conn.execute(
            """
            UPDATE dispatches
            SET outcome = ?, outcome_at = CURRENT_TIMESTAMP
            WHERE dispatch_id = ?
            """,
            (outcome, dispatch_id),
        )

        # If outcome is resolved or false_alarm, update incident status accordingly
        if outcome in ("resolved", "false_alarm"):
            conn.execute(
                "UPDATE incidents SET status = ?, last_updated_at = CURRENT_TIMESTAMP WHERE incident_id = ?",
                (outcome, incident_id),
            )

    return {
        "dispatch_id": dispatch_id,
        "incident_id": incident_id,
        "outcome": outcome,
        "status": "updated"
    }

@router.get("/", response_model=List[Dict[str, Any]])
def list_dispatch_orders(limit: int = 50):
    """List recent dispatch orders."""
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT dispatch_id, incident_id, responder_id, approved_by,
                   approval_status, task_card, dispatched_at, outcome, outcome_at
            FROM dispatches
            ORDER BY dispatched_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return [dict(row) for row in cursor.fetchall()]
