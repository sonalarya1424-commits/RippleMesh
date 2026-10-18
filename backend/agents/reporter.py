"""Reporter Agent module for RippleMesh.

Responsible for ingesting raw incident/flood signals (SMS, webhooks, social, in-app reports),
normalizing unstructured information via Gemma inference or mock responses,
validating fields, computing image perceptual hash, persisting reports,
and dispatching an agent message to the Verifier agent.
"""
import os
import re
import uuid
import json
from typing import Any, Dict, List, Optional
from pathlib import Path

from backend.agents.gemma_client import ask_gemma
from backend.db.database import get_db
from backend.services.messaging import send_message

SYSTEM_PROMPT = (
    "You are the Reporter agent in a disaster-response mesh. From the person's message and photo, "
    "output ONLY JSON: {hazard_type: flood|fire|landslide|earthquake|other|none, summary: max 25 words, "
    "people_at_risk: true|false, vulnerable: [child|elderly|injured|disabled], "
    "time_to_harm_guess: seconds|minutes|hours, reporter_conf: 0-1, claim_matches_photo: 0-1, notes: string}. "
    "If the photo contradicts what the person said, set claim_matches_photo low and explain in notes. "
    "Never invent details you cannot see or hear. "
    "people_at_risk must be true ONLY if a person is clearly visible in the photo OR the person's message explicitly mentions someone in danger. Otherwise false. Do not assume. If unsure, use false and lower reporter_conf. Reserve claim_matches_photo above 0.9 and reporter_conf above 0.8 for cases where the photo clearly and specifically confirms every detail in the message. A generic scene match is at most 0.7. "
    "If the photo shows no disaster or hazard, use hazard_type none."
)

VALID_HAZARDS = {"flood", "fire", "landslide", "earthquake", "other", "none"}
VALID_TIMES = {"seconds", "minutes", "hours"}

REPORTER_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "hazard_type": {
            "type": "string",
            "enum": ["flood", "fire", "landslide", "earthquake", "other", "none"]
        },
        "summary": {
            "type": "string"
        },
        "people_at_risk": {
            "type": "boolean"
        },
        "vulnerable": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "time_to_harm_guess": {
            "type": "string",
            "enum": ["seconds", "minutes", "hours"]
        },
        "reporter_conf": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
        },
        "claim_matches_photo": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
        },
        "notes": {
            "type": "string"
        }
    },
    "required": [
        "hazard_type",
        "summary",
        "people_at_risk",
        "vulnerable",
        "time_to_harm_guess",
        "reporter_conf",
        "claim_matches_photo",
        "notes"
    ]
}

def compute_phash(image_path: Optional[str]) -> Optional[str]:
    """Compute perceptual hash using imagehash library if an image is provided."""
    if not image_path or not os.path.exists(image_path):
        return None
    try:
        from PIL import Image
        import imagehash
        with Image.open(image_path) as img:
            return str(imagehash.phash(img))
    except Exception as e:
        print(f"[compute_phash] Error computing phash for {image_path}: {e}")
        return None

def text_mentions_person(transcript: str) -> bool:
    """Returns True if the lowercase transcript contains any person/danger keywords as whole words."""
    if not transcript:
        return False
    lower = transcript.lower()
    keywords = [
        "person", "people", "man", "woman", "girl", "boy", "child",
        "kid", "baby", "elderly", "old", "family", "trapped", "stuck",
        "drowning", "stranded", "injured", "someone", "somebody"
    ]
    return any(re.search(r"\b" + re.escape(word) + r"\b", lower) for word in keywords)

def create_report(
    device_id: Optional[str],
    transcript_text: str,
    image_path: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    capture_mode: str = "in_app"
) -> Dict[str, Any]:
    """Create a structured report from raw sensor/citizen data using Gemma and store it in SQLite.

    Args:
        device_id: Device ID originating the signal.
        transcript_text: Person's message or audio transcript.
        image_path: Optional path to an image file.
        lat: Optional latitude coordinate.
        lng: Optional longitude coordinate.
        capture_mode: 'in_app' or 'gallery'.

    Returns:
        Dictionary representation of the saved report row.
    """
    user_prompt = f"Reporter message: \"{transcript_text}\""
    if image_path:
        user_prompt += f"\nImage attached: {image_path}"

    # 1. Call ask_gemma with json_mode=True, thinking=False, and REPORTER_JSON_SCHEMA
    raw_ai_output = ask_gemma(
        system_prompt=SYSTEM_PROMPT,
        user_text=user_prompt,
        image_path=image_path,
        json_mode=True,
        thinking=False,
        json_schema=REPORTER_JSON_SCHEMA
    )

    if not isinstance(raw_ai_output, dict):
        raw_ai_output = {}

    # 2. Validate fields with lenient mappings and fill safe defaults
    raw_hazard = str(raw_ai_output.get("hazard_type", "other")).lower().strip()
    hazard_map = {
        "flood": "flood", "flooding": "flood", "water": "flood", "submerged": "flood",
        "fire": "fire", "wildfire": "fire", "flames": "fire", "smoke": "fire",
        "landslide": "landslide", "mudslide": "landslide",
        "earthquake": "earthquake", "quake": "earthquake", "tremor": "earthquake",
        "none": "none", "clear": "none", "safe": "none", "normal": "none", "no hazard": "none",
        "other": "other"
    }
    hazard_type = hazard_map.get(raw_hazard, "other" if raw_hazard not in VALID_HAZARDS else raw_hazard)

    summary = str(raw_ai_output.get("summary", transcript_text[:120] if transcript_text else "Disaster observation"))
    # Limit summary to ~25 words
    words = summary.split()
    if len(words) > 25:
        summary = " ".join(words[:25])

    people_at_risk_raw = raw_ai_output.get("people_at_risk", False)
    if isinstance(people_at_risk_raw, str):
        gemma_people_at_risk = True if people_at_risk_raw.lower() in ("true", "1", "yes") else False
    else:
        gemma_people_at_risk = bool(people_at_risk_raw)

    vulnerable_raw = raw_ai_output.get("vulnerable", [])
    if not isinstance(vulnerable_raw, list):
        vulnerable_raw = []

    # Rules for person mentions in transcript:
    notes_flag: Optional[str] = None
    transcript_lower = transcript_text.lower() if transcript_text else ""

    if not text_mentions_person(transcript_text):
        if gemma_people_at_risk:
            notes_flag = "person flag overridden: not mentioned in report"
        people_at_risk = 0
        vulnerable_list = []
    else:
        people_at_risk = 1 if gemma_people_at_risk else 0
        # Only keep vulnerable tags if matching word appears in transcript as whole words
        vulnerable_list = []
        for tag in vulnerable_raw:
            tag_lower = str(tag).lower()
            if tag_lower == "child" and any(re.search(r"\b" + re.escape(w) + r"\b", transcript_lower) for w in ["child", "kid", "baby"]):
                vulnerable_list.append("child")
            elif tag_lower == "elderly" and any(re.search(r"\b" + re.escape(w) + r"\b", transcript_lower) for w in ["elderly", "old"]):
                vulnerable_list.append("elderly")
            elif tag_lower == "injured" and re.search(r"\binjured\b", transcript_lower):
                vulnerable_list.append("injured")
            elif tag_lower == "disabled" and re.search(r"\bdisabled\b", transcript_lower):
                vulnerable_list.append("disabled")

    vulnerable_json = json.dumps(vulnerable_list)

    raw_time_guess = str(raw_ai_output.get("time_to_harm_guess", "hours")).lower().strip()
    time_guess_map = {
        "seconds": "seconds", "second": "seconds", "immediate": "seconds",
        "minutes": "minutes", "minute": "minutes", "soon": "minutes",
        "hours": "hours", "hour": "hours", "days": "hours"
    }
    time_to_harm_guess = time_guess_map.get(raw_time_guess, "hours" if raw_time_guess not in VALID_TIMES else raw_time_guess)

    try:
        reporter_conf = float(raw_ai_output.get("reporter_conf", 0.8))
        reporter_conf = max(0.0, min(1.0, reporter_conf))
    except (ValueError, TypeError):
        reporter_conf = 0.8

    try:
        claim_matches_photo = float(raw_ai_output.get("claim_matches_photo", 1.0 if not image_path else 0.8))
        claim_matches_photo = max(0.0, min(1.0, claim_matches_photo))
    except (ValueError, TypeError):
        claim_matches_photo = 0.8

    # Small models overstate their own confidence, so we cap it in code. Real trust comes from the Verifier and corroboration.
    reporter_conf = min(reporter_conf, 0.8)
    claim_matches_photo = min(claim_matches_photo, 0.8)
    if not people_at_risk:
        vulnerable_json = json.dumps([])
    if not transcript_text or not transcript_text.strip():
        claim_matches_photo = 0.5

    # CODE GUARD: if hazard_type is "none", force people_at_risk to false and vulnerable to []
    if hazard_type == "none":
        people_at_risk = 0
        vulnerable_json = json.dumps([])
        notes_flag = "hazard_type is none: people_at_risk and vulnerable forced to false/empty"

    # Safe capture mode validation
    clean_capture_mode = "in_app" if capture_mode == "in_app" else "gallery"

    # 3. Compute perceptual hash
    phash_value = compute_phash(image_path)

    # 4. Save to reports table
    report_id = f"rep-{uuid.uuid4().hex[:8]}"
    payload_dict = {
        "device_id": device_id,
        "transcript": transcript_text,
        "image_path": image_path,
        "lat": lat,
        "lng": lng,
        "capture_mode": clean_capture_mode,
        "ai_output": raw_ai_output
    }
    payload_bytes = len(json.dumps(payload_dict).encode("utf-8"))

    with get_db() as conn:
        # If a device_id is provided, ensure device record exists to satisfy foreign key constraint
        if device_id:
            conn.execute(
                """
                INSERT OR IGNORE INTO devices (device_id, role, display_name, last_lat, last_lng)
                VALUES (?, 'mesh_node', ?, ?, ?)
                """,
                (device_id, device_id, lat, lng),
            )

        conn.execute(
            """
            INSERT INTO reports (
                report_id, device_id, lat, lng, hazard_type, summary,
                language, transcript, reporter_conf, capture_mode, payload_bytes,
                phash, image_path, claim_matches_photo, people_at_risk,
                vulnerable, time_to_harm_guess
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report_id,
                device_id,
                lat,
                lng,
                hazard_type,
                summary,
                "en",
                transcript_text,
                reporter_conf,
                clean_capture_mode,
                payload_bytes,
                phash_value,
                image_path,
                claim_matches_photo,
                people_at_risk,
                vulnerable_json,
                time_to_harm_guess
            ),
        )

        # Retrieve saved row
        cursor = conn.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
        saved_row = dict(cursor.fetchone())
        saved_row["notes_flag"] = notes_flag

    # 5. Send agent_message from "reporter" to "verifier" through services/messaging.py
    message_payload = {
        "report_id": report_id,
        "hazard_type": hazard_type,
        "summary": summary,
        "lat": lat,
        "lng": lng,
        "phash": phash_value,
        "claim_matches_photo": claim_matches_photo,
        "reporter_conf": reporter_conf,
        "people_at_risk": people_at_risk,
        "time_to_harm_guess": time_to_harm_guess
    }
    send_message(
        from_agent="reporter",
        to_agent="verifier",
        msg_type="NEW_REPORT",
        body=message_payload,
        ref_id=report_id,
        from_device=device_id
    )

    return saved_row


class ReporterAgent:
    """Class wrapper for compatibility."""

    def __init__(self, client=None):
        self.client = client

    def process_raw_report(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return create_report(
            device_id=raw_data.get("device_id"),
            transcript_text=raw_data.get("text_content") or raw_data.get("transcript") or "",
            image_path=raw_data.get("image_path"),
            lat=raw_data.get("lat"),
            lng=raw_data.get("lng"),
            capture_mode=raw_data.get("capture_mode", "in_app")
        )
