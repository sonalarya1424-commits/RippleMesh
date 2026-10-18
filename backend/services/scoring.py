"""Scoring formulas for report credibility, corroboration confidence, and incident priority."""
from typing import Dict, Any

def compute_confidence_score(report_data: Dict[str, Any]) -> float:
    """Compute confidence score (0.0 to 1.0) for a given report.

    TODO: Factor in image presence, perceptual hash uniqueness, text length, and source reliability.
    """
    # Placeholder formula
    base_score = 0.5
    if report_data.get("image_url"):
        base_score += 0.2
    if report_data.get("latitude") is not None and report_data.get("longitude") is not None:
        base_score += 0.2
    return min(base_score, 1.0)

def compute_priority_score(incident_data: Dict[str, Any]) -> float:
    """Compute priority score (0.0 to 100.0) for emergency response dispatching.

    TODO: Factor in flood depth, trapped individuals, hospital/infrastructure proximity, and corroborating reports count.
    """
    # Placeholder formula
    severity = incident_data.get("severity", "moderate").lower()
    severity_map = {
        "low": 25.0,
        "moderate": 50.0,
        "high": 75.0,
        "critical": 95.0,
    }
    return severity_map.get(severity, 50.0)
