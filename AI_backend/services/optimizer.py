# backend/services/optimizer.py
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import Course, Faculty, DisruptionLog, OptimizationResult
from utils.scoring import score_solution
from datetime import datetime

def find_candidate_faculty(db: Session, course: Course) -> List[Dict[str, Any]]:
    """
    Simple candidate search:
      - All faculty who are marked available
      - Return dicts with current workload computed
    """
    facs = db.query(Faculty).all()
    candidates = []
    for f in facs:
        # compute current workload (number of courses assigned)
        cur_workload = db.query(Course).filter(Course.faculty_id == f.id).count()
        candidates.append({
            "id": f.id,
            "name": f.name,
            "expertise": f.expertise or "",
            "workload": cur_workload,
            "workload_cap": f.workload_cap or 3,
            "available": f.available
        })
    # filter out same faculty assigned to course (or optionally exclude faculty_unavailable)
    return candidates

def optimize_faculty_assignment(db: Session, course_id: int, faculty_unavailable: int ) -> List[Dict[str, Any]]:
    """
    For a single course, return ranked candidate replacements with scores.
    Steps:
      - fetch course
      - gather candidate faculty
      - compute score with scoring module
      - return list sorted by score (desc)
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise ValueError("Course not found")

    candidates = find_candidate_faculty(db, course)

    # optionally exclude the faculty_unavailable and the current assigned faculty
    filtered = []
    for c in candidates:
        if faculty_unavailable and c["id"] == faculty_unavailable:
            continue
        if course.faculty_id is not None and c["id"] == course.faculty_id:
            continue
        filtered.append(c)

    solutions = []
    for cand in filtered:
        s = score_solution(cand, {"id": course.id, "name": course.name})
        rank = "Compromise"
        if s >= 90:
            rank = "Best"
        elif s >= 50:
            rank = "Good"
        solutions.append({
            "faculty": cand,
            "score": s,
            "rank": rank
        })

    solutions.sort(key=lambda x: x["score"], reverse=True)
    return solutions

def record_disruption_and_solutions(db: Session, course_id: int, faculty_unavailable: int, reason: str) -> Dict[str, Any]:
    """
    Create disruption log entry and compute candidate solutions, store them in optimization_results table for auditing.
    """
    disruption = DisruptionLog(course_id=course_id, faculty_unavailable=faculty_unavailable, reason=reason, timestamp=datetime.utcnow(), status="pending")
    db.add(disruption)
    db.commit()
    db.refresh(disruption)

    sols = optimize_faculty_assignment(db, course_id, faculty_unavailable)
    # store top N solutions
    for idx, s in enumerate(sols[:10], start=1):
        orow = OptimizationResult(
            disruption_id=disruption.id,
            candidate_faculty_id=s["faculty"]["id"],
            score=s["score"],
            rank=s["rank"],
            approved=False
        )
        db.add(orow)
    db.commit()
    return {"disruption_id": disruption.id, "solutions_count": len(sols)}

def apply_reassignment(db: Session, course_id: int, new_faculty_id: int, resolved_by: str = "system") -> Dict[str, Any]:
    """
    Update the course to point to new_faculty_id, mark disruption resolved if present and create audit record.
    Must be called inside a transaction in caller code if needed.
    """
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return {"success": False, "message": "Course not found"}

    old_faculty = course.faculty_id
    setattr(course, "faculty_id", new_faculty_id)  # Assign to the instance attribute
    db.add(course)

    # Update any disruption logs referencing old_faculty for this course and mark resolved
    disruptions = db.query(DisruptionLog).filter(DisruptionLog.course_id == course_id, DisruptionLog.status == "pending").all()
    for d in disruptions:
        setattr(d, "status", "resolved")
        setattr(d, "resolved_by", resolved_by)
        db.add(d)

    db.commit()
    # Refresh
    db.refresh(course)
    return {"success": True, "course_id": course.id, "old_faculty": old_faculty, "new_faculty": new_faculty_id}
