"""Agent-to-agent message bus and message persistence logging."""
import json
import uuid
from typing import Any, Dict, List, Optional
from backend.db.database import get_db

def send_message(
    from_agent: str,
    to_agent: str,
    msg_type: str,
    body: Dict[str, Any],
    ref_id: Optional[str] = None,
    from_device: Optional[str] = None,
    to_device: Optional[str] = None
) -> str:
    """Stores a message in the agent_messages table along with its UTF-8 byte size.

    Args:
        from_agent: Originating agent identifier (e.g. 'reporter').
        to_agent: Target agent identifier (e.g. 'verifier').
        msg_type: Message classification (e.g. 'NEW_REPORT').
        body: Message payload (will be serialized to JSON).
        ref_id: Optional reference ID (e.g. report_id or incident_id).
        from_device: Optional originating device ID.
        to_device: Optional target device ID.

    Returns:
        message_id (str)
    """
    message_id = str(uuid.uuid4())
    body_json = json.dumps(body, ensure_ascii=False)
    payload_bytes = len(body_json.encode("utf-8"))

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO agent_messages (
                message_id, from_agent, to_agent, from_device, to_device,
                msg_type, ref_id, body, bytes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                message_id,
                from_agent,
                to_agent,
                from_device,
                to_device,
                msg_type,
                ref_id,
                body_json,
                payload_bytes
            ),
        )

    return message_id


class MessageBus:
    """In-memory and database-backed event bus for inter-agent communication."""

    def __init__(self):
        self._listeners: Dict[str, List] = {}

    def publish(self, sender: str, receiver: str, message_type: str, payload: Dict[str, Any]) -> str:
        """Publish a message from one agent to another and persist it into agent_messages table."""
        return send_message(
            from_agent=sender,
            to_agent=receiver,
            msg_type=message_type,
            body=payload
        )

    def get_messages(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent agent messages from SQLite."""
        with get_db() as conn:
            cursor = conn.execute(
                """
                SELECT message_id, sent_at, from_agent, to_agent, from_device, to_device,
                       msg_type, ref_id, body, bytes
                FROM agent_messages
                ORDER BY sent_at DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

message_bus = MessageBus()
