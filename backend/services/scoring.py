"""Scoring formulas for report credibility, corroboration confidence, and incident priority."""
import math
from typing import Dict, Any, List, Union

def confidence(independent_reports: int, avg_trust: float, minutes_since_update: float = 0.0) -> float:
    """Calculate incident confidence score.

    base = 1 - exp(-0.7 * independent_reports)
    Blended with avg_trust: (0.6 * base + 0.4 * avg_trust)
    Multiplied by a gentle staleness decay over time: exp(-0.001 * minutes_since_update)

    Properties:
    - 1 independent report with 0.8 trust -> ~0.62
    - 5 independent reports with 0.7 trust -> ~0.86
    - 50 independent reports with 0.7 trust -> ~0.88 (barely beats 5)
    - Count saturation prevents report flood spam from inflating confidence beyond ~0.9.
    """
    n = max(0, independent_reports)
    base = 1.0 - math.exp(-0.7 * n)
    trust = max(0.0, min(1.0, float(avg_trust)))
    blended = 0.6 * base + 0.4 * trust

    # Gentle staleness decay: half-life ~700 minutes (~11.5 hours)
    mins = max(0.0, float(minutes_since_update))
    decay = math.exp(-0.001 * mins)

    score = blended * decay
    return round(max(0.0, min(1.0, score)), 4)


def priority(
    life_threat: str,
    time_to_harm: str,
    rescuable_in_time: float,
    vulnerability: Union[List[str], str],
    confidence_val: float
) -> float:
    """Calculate incident tactical priority score (0.0 to 1.0+ or scaled to 100).

    Formula:
    priority = severity_w * urgency_w * rescuable_in_time * (1 + min(0.3, 0.1 * len(vulnerability))) * max(confidence, 0.3)

    Weights:
    - severity_w: {now: 1.0, soon: 0.6, none: 0.2}
    - urgency_w: {seconds: 1.0, minutes: 0.6, hours: 0.3}

    Crucial rule:
    Report count NEVER raises priority directly; it only affects confidence.
    """
    severity_map = {"now": 1.0, "soon": 0.6, "none": 0.2}
    urgency_map = {"seconds": 1.0, "minutes": 0.6, "hours": 0.3}

    sev_key = str(life_threat).lower().strip()
    urg_key = str(time_to_harm).lower().strip()

    severity_w = severity_map.get(sev_key, 0.2)
    urgency_w = urgency_map.get(urg_key, 0.3)

    rescuable = max(0.0, min(1.0, float(rescuable_in_time)))

    if isinstance(vulnerability, str):
        try:
            import json
            vuln_list = json.loads(vulnerability)
            if not isinstance(vuln_list, list):
                vuln_list = []
        except Exception:
            vuln_list = [v.strip() for v in vulnerability.split(",") if v.strip()]
    elif isinstance(vulnerability, list):
        vuln_list = vulnerability
    else:
        vuln_list = []

    vuln_mult = 1.0 + min(0.3, 0.1 * len(vuln_list))
    conf_factor = 0.5 + 0.5 * float(confidence_val)

    raw_priority = severity_w * urgency_w * rescuable * vuln_mult * conf_factor
    return round(raw_priority, 4)


# Backwards compatibility wrappers
def compute_confidence_score(report_data: Dict[str, Any]) -> float:
    return confidence(
        independent_reports=1,
        avg_trust=report_data.get("reporter_conf", 0.7),
        minutes_since_update=0.0
    )

def compute_priority_score(incident_data: Dict[str, Any]) -> float:
    return priority(
        life_threat="soon" if incident_data.get("severity") in ("high", "critical") else "none",
        time_to_harm="minutes" if incident_data.get("severity") == "critical" else "hours",
        rescuable_in_time=0.9,
        vulnerability=[],
        confidence_val=float(incident_data.get("confidence", 0.5))
    )
