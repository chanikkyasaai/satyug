from typing import Any, List, Dict
from sqlalchemy.orm import Session

from models import Course, Faculty, DisruptionLog, OptimizationResult
from utils.scoring import score_solution

from datetime import datetime


def _is_supabase(db: Any) -> bool:
    return db is not None and hasattr(db, "table")


def _resp_data(resp: Any):
    if resp is None:
        return None
    data = getattr(resp, "data", None)
    if data is not None:
        return data
    try:
        return resp.get("data")
    except Exception:
        return None


def find_candidate_faculty(db: Any, course: Any) -> List[Dict[str, Any]]:
    candidates: List[Dict[str, Any]] = []
    if _is_supabase(db):
        resp = db.table("faculty").select("*").execute()
        facs = _resp_data(resp) or []
        for f in facs:
            resp2 = db.table("courses").select("*").eq("faculty_id", f["id"]).execute()
            cur_workload = len(_resp_data(resp2) or [])
            candidates.append({
                "id": f["id"],
                "name": f.get("name"),
                "expertise": f.get("expertise", "") or "",
                "workload": cur_workload,
                "workload_cap": int(f.get("workload_cap", 3) or 3),
                "available": f.get("available", True),
            })
    else:
        facs = db.query(Faculty).all()
        for f in facs:
            cur_workload = db.query(Course).filter(Course.faculty_id == f.id).count()
            candidates.append({
                "id": f.id,
                "name": f.name,
                "expertise": f.expertise or "",
                "workload": cur_workload,
                "workload_cap": f.workload_cap or 3,
                "available": getattr(f, "available", True),
            })
    return candidates


def optimize_faculty_assignment(db: Any, course_id: int, faculty_unavailable: int) -> List[Dict[str, Any]]:
    if _is_supabase(db):
        resp = db.table("courses").select("*").eq("id", course_id).execute()
        course = (_resp_data(resp) or [None])[0]
        if not course:
            raise ValueError("Course not found")
    else:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError("Course not found")

    candidates = find_candidate_faculty(db, course)

    filtered: List[Dict[str, Any]] = []
    for c in candidates:
        if faculty_unavailable and c["id"] == faculty_unavailable:
            continue
        course_faculty_id = course.get("faculty_id") if isinstance(course, dict) else course.faculty_id
        if course_faculty_id is not None and c["id"] == course_faculty_id:
            continue
        filtered.append(c)

    solutions: List[Dict[str, Any]] = []
    for cand in filtered:
        course_payload = {"id": course["id"], "name": course.get("name")} if isinstance(course, dict) else {"id": course.id, "name": course.name}
        s = score_solution(cand, course_payload)
        rank = "Compromise"
        if s >= 90:
            rank = "Best"
        elif s >= 50:
            rank = "Good"
        solutions.append({"faculty": cand, "score": s, "rank": rank})

    solutions.sort(key=lambda x: x["score"], reverse=True)
    return solutions


def record_disruption_and_solutions(db: Any, course_id: int, faculty_unavailable: int, reason: str) -> Dict[str, Any]:
    if _is_supabase(db):
        disruption_row = {
            "course_id": course_id,
            "faculty_unavailable": faculty_unavailable,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "pending",
        }
        resp = db.table("disruptions").insert([disruption_row]).execute()
        ddata = _resp_data(resp) or []
        disruption_id = ddata[0]["id"] if ddata else None

        sols = optimize_faculty_assignment(db, course_id, faculty_unavailable)
        rows = []
        for s in sols[:10]:
            rows.append({
                "disruption_id": disruption_id,
                "candidate_faculty_id": s["faculty"]["id"],
                "score": s["score"],
                "rank": s["rank"],
                "approved": False,
            })
        if rows:
            db.table("optimization_results").insert(rows).execute()
        return {"disruption_id": disruption_id, "solutions_count": len(sols)}

    disruption = DisruptionLog(
        course_id=course_id,
        faculty_unavailable=faculty_unavailable,
        reason=reason,
        timestamp=datetime.utcnow(),
        status="pending",
    )
    db.add(disruption)
    db.commit()
    db.refresh(disruption)

    sols = optimize_faculty_assignment(db, course_id, faculty_unavailable)
    for idx, s in enumerate(sols[:10], start=1):
        orow = OptimizationResult(
            disruption_id=disruption.id,
            candidate_faculty_id=s["faculty"]["id"],
            score=s["score"],
            rank=s["rank"],
            approved=False,
        )
        db.add(orow)
    db.commit()
    return {"disruption_id": disruption.id, "solutions_count": len(sols)}


def apply_reassignment(db: Any, course_id: int, new_faculty_id: int, resolved_by: str = "system") -> Dict[str, Any]:
    if _is_supabase(db):
        resp = db.table("courses").select("*").eq("id", course_id).execute()
        course = (_resp_data(resp) or [None])[0]
        if not course:
            return {"success": False, "message": "Course not found"}

        old_faculty = course.get("faculty_id")
        db.table("courses").update({"faculty_id": new_faculty_id}).eq("id", course_id).execute()
        db.table("disruptions").update({"status": "resolved", "resolved_by": resolved_by}).eq("course_id", course_id).eq("status", "pending").execute()
        return {"success": True, "course_id": course_id, "old_faculty": old_faculty, "new_faculty": new_faculty_id}

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return {"success": False, "message": "Course not found"}

    old_faculty = course.faculty_id
    setattr(course, "faculty_id", new_faculty_id)
    db.add(course)

    disruptions = db.query(DisruptionLog).filter(DisruptionLog.course_id == course_id, DisruptionLog.status == "pending").all()
    for d in disruptions:
        setattr(d, "status", "resolved")
        setattr(d, "resolved_by", resolved_by)
        db.add(d)

    db.commit()
    db.refresh(course)
    return {"success": True, "course_id": course.id, "old_faculty": old_faculty, "new_faculty": new_faculty_id}

