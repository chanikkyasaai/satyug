# backend/utils/scoring.py
from typing import Dict, Any
from builtins import str

def expertise_match_score(faculty_expertise: str, course_name: str) -> int:
    """
    Simple token-match scoring:
      - +50 if any token in course_name appears in expertise
      - +20 if partial similarity
    """
    if not faculty_expertise:
        return 0
    f_tokens = set([t.strip().lower() for t in faculty_expertise.split(",") if t.strip()])
    c_tokens = set([t.strip().lower() for t in course_name.split() if len(t) > 2])
    # direct intersection
    if f_tokens.intersection(c_tokens):
        return 50
    # partial check: any expertise word appears as substring of course name
    for ft in f_tokens:
        for ct in c_tokens:
            if ft in ct or ct in ft:
                return 30
    return 0

def score_solution(candidate: Dict[str, Any], course: Dict[str, Any]) -> int:
    """
    candidate: {"id":..., "name":..., "expertise":..., "workload": <int>, "workload_cap": <int>, "available": bool}
    course: {"id":..., "name":..., "credits":...}
    Returns integer score (higher = better)
    """
    score = 0
    # availability
    if not candidate.get("available", True):
        score -= 1000  # heavily penalize unavailable
    # expertise
    score += expertise_match_score(candidate.get("expertise", ""), course.get("name", ""))
    # workload: prefer faculty with more spare capacity
    cap = candidate.get("workload_cap", 3)
    cur = candidate.get("workload", 0)
    spare = cap - cur
    score += max(0, spare) * 20
    # small penalty for current heavy load
    if cur >= cap:
        score -= 200
    # prefer faculty with exact domain match in name
    if candidate.get("name", "").lower() in course.get("name", "").lower():
        score += 10
    # clamp
    return int(score)
