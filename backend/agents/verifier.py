"""Verifier Agent module for RippleMesh.

Validates report credibility, performs image perceptual hash deduplication (detecting recycled media),
checks capture mode authenticity, evaluates claim-photo consistency, persists verification records,
and emits VERIFIED inter-agent message to the Corroboration agent.
"""
import uuid
from typing import Any, Dict, Optional
import imagehash
from backend.db.database import get_db
from backend.services.messaging import send_message

def _hamming_distance(hash1_str: str, hash2_str: str) -> int:
    """Computes the Hamming distance between two hex phash strings."""
    try:
        h1 = imagehash.hex_to_hash(hash1_str)
        h2 = imagehash.hex_to_hash(hash2_str)
        return h1 - h2
    except Exception:
        # Fallback binary bit count
        try:
            v1 = int(hash1_str, 16)
            v2 = int(hash2_str, 16)
            return bin(v1 ^ v2).count("1")
        except Exception:
            return 999

def verify(report_id: str) -> Dict[str, Any]:
    """Verify credibility of a report based on capture mode, duplicate phash, and claim match.

    Rules:
    - capture_mode 'in_app' scores higher than 'gallery'.
    - phash within hamming distance 5 of an EARLIER report's phash (from a different report_id)
      means duplicate, low trust, set duplicate_of.
    - claim_matches_photo from the Reporter.
    - Save to verifications with plain-language notes string.
    - Send VERIFIED message from "verifier" to "corroboration" through services/messaging.py.

    Returns:
        Dictionary of the saved verification record.
    """
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM reports WHERE report_id = ?", (report_id,))
        report = cursor.fetchone()
        if not report:
            raise ValueError(f"Report not found: {report_id}")
        report_dict = dict(report)

        # 1. Capture mode signal
        capture_mode = report_dict.get("capture_mode", "in_app")
        is_in_app = 1 if capture_mode == "in_app" else 0
        capture_score = 0.9 if is_in_app else 0.5

        # 2. Duplicate detection via phash against earlier reports
        phash = report_dict.get("phash")
        created_at = report_dict.get("created_at")
        duplicate_of: Optional[str] = None
        is_duplicate = False

        notes_parts = []
        if is_in_app:
            notes_parts.append("Captured in-app.")
        else:
            notes_parts.append("Uploaded from gallery.")

        if phash:
            # Look for earlier reports with a non-null phash
            # Query reports created earlier or with a different report_id
            cursor_earlier = conn.execute(
                """
                SELECT report_id, phash, created_at
                FROM reports
                WHERE report_id != ? AND phash IS NOT NULL AND (created_at < ? OR (created_at = ? AND report_id < ?))
                ORDER BY created_at ASC
                """,
                (report_id, created_at, created_at, report_id),
            )
            earlier_reports = cursor_earlier.fetchall()
            for er in earlier_reports:
                dist = _hamming_distance(phash, er["phash"])
                if dist <= 5:
                    is_duplicate = True
                    duplicate_of = er["report_id"]
                    break

        if is_duplicate:
            notes_parts.append(f"Duplicate image of report {duplicate_of}.")
        elif phash:
            notes_parts.append("Image not seen before.")
        else:
            notes_parts.append("No image attached.")

        # 3. Claim match signal
        claim_match = report_dict.get("claim_matches_photo")
        if claim_match is None:
            claim_match = 0.7
        claim_match = float(claim_match)

        if claim_match >= 0.7:
            notes_parts.append("Claim matches photo.")
        else:
            notes_parts.append("Discrepancy between claim and photo.")

        # Compute composite trust_score
        # Baseline formula: in_app (35%), claim_match (45%), non-duplicate bonus (20%)
        # If duplicate, heavily penalize trust_score
        if is_duplicate:
            trust_score = round(min(0.35, 0.2 * capture_score + 0.2 * claim_match), 4)
        else:
            trust_score = round(0.35 * capture_score + 0.45 * claim_match + 0.20, 4)

        trust_score = max(0.0, min(1.0, trust_score))
        notes_str = " ".join(notes_parts)

        # 4. Save to verifications table
        verification_id = f"ver-{uuid.uuid4().hex[:8]}"
        conn.execute(
            """
            INSERT INTO verifications (
                verification_id, report_id, trust_score, in_app_capture,
                duplicate_of, claim_photo_match, location_plausible,
                detector_ai_prob, notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                verification_id,
                report_id,
                trust_score,
                is_in_app,
                duplicate_of,
                claim_match,
                1, # location plausible
                0.0,
                notes_str
            ),
        )

        # Update report confidence in reports table
        conn.execute(
            "UPDATE reports SET reporter_conf = ? WHERE report_id = ?",
            (trust_score, report_id),
        )

        cursor_saved = conn.execute("SELECT * FROM verifications WHERE verification_id = ?", (verification_id,))
        saved_verification = dict(cursor_saved.fetchone())

    # 5. Send VERIFIED message from "verifier" to "corroboration" through services/messaging.py
    message_payload = {
        "report_id": report_id,
        "verification_id": verification_id,
        "trust_score": trust_score,
        "duplicate_of": duplicate_of,
        "hazard_type": report_dict.get("hazard_type"),
        "lat": report_dict.get("lat"),
        "lng": report_dict.get("lng"),
        "device_id": report_dict.get("device_id"),
        "notes": notes_str
    }
    send_message(
        from_agent="verifier",
        to_agent="corroboration",
        msg_type="VERIFIED",
        body=message_payload,
        ref_id=report_id,
        from_device=report_dict.get("device_id")
    )

    return saved_verification


class VerifierAgent:
    """Class wrapper for compatibility."""

    def __init__(self, client=None):
        self.client = client

    def verify_report(self, report_id: str) -> Dict[str, Any]:
        return verify(report_id)
