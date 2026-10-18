"""Agent-to-agent message bus and message persistence logging."""
import json
import uuid
from typing import Any, Dict, List
from backend.db.database import get_db

class MessageBus:
    """In-memory and database-backed event bus for inter-agent communication."""

    def __init__(self):
        self._listeners: Dict[str, List] = {}

    def publish(self, sender: str, receiver: str, message_type: str, payload: Dict[str, Any]) -> str:
        """Publish a message from one agent to another and persist it into agent_messages table.

        TODO: Support asynchronous event subscription callbacks.
        TODO: Implement real-time WebSocket broadcasting to frontend UI.
        """
        msg_id = str(uuid.uuid4())
        payload_str = json.dumps(payload)

        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO agent_messages (id, sender_agent, receiver_agent, message_type, payload)
                VALUES (?, ?, ?, ?, ?)
                """,
                (msg_id, sender, receiver, message_type, payload_str),
            )
        return msg_id

    def get_messages(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent agent messages from SQLite."""
        with get_db() as conn:
            cursor = conn.execute(
                """
                SELECT id, sender_agent, receiver_agent, message_type, payload, created_at
                FROM agent_messages
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,),
            )
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

message_bus = MessageBus()
