# backend/services/solver.py
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import Course, TimeSlot, Enrollment
from datetime import datetime, time
import re


def _is_supabase(db: Any) -> bool:
    """Return True if `db` looks like a Supabase client."""
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


def _to_dict_course(obj):
    """Convert a SQLAlchemy Course object or a supabase row dict to a plain dict."""
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    # assume SQLAlchemy model
    return {
        "id": obj.id,
        "code": obj.code,
        "name": obj.name,
        "credits": obj.credits,
        "semester": obj.semester,
        "mandatory": obj.mandatory,
        "faculty_id": obj.faculty_id,
        "timeslot_id": obj.timeslot_id,
        "classroom_id": obj.classroom_id,
        "max_seats": obj.max_seats,
    }


def _to_dict_timeslot(obj):
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj
    return {"id": obj.id, "day": obj.day, "start_time": obj.start_time, "end_time": obj.end_time}


def parse_time_str(t: str) -> time:
    # t expected like "09:00" or "9:00"
    return datetime.strptime(t, "%H:%M").time()

def timeslot_overlaps(a_day, a_start, a_end, b_day, b_start, b_end) -> bool:
    if a_day != b_day:
        return False
    a_s = parse_time_str(a_start)
    a_e = parse_time_str(a_end)
    b_s = parse_time_str(b_start)
    b_e = parse_time_str(b_end)
    return max(a_s, b_s) < min(a_e, b_e)  # strict overlap

def _fetch_course_timeslot(db, course: Course):
    # Support both SQLAlchemy Session and Supabase client
    if _is_supabase(db):
        resp = db.table("timeslots").select("*").eq("id", course["timeslot_id"]).execute()
        rows = _resp_data(resp)
        return rows[0] if rows else None
    else:
        ts = db.query(TimeSlot).filter(TimeSlot.id == course.timeslot_id).first()
        return ts

def validate_schedule(db, student_id: int, selected_course_ids: List[int]) -> Dict[str, Any]:
    """
    Validate chosen courses for a single student:
      - check timeslot overlaps among selected courses AND with already enrolled courses
      - check seat capacity
    Returns:
      { valid: bool, conflicts: [...], suggestions: {course_id: [alternative_course_ids, ...]} }
    """
    # fetch selected courses and timeslots
    if _is_supabase(db):
        resp = db.table("courses").select("*").in_("id", selected_course_ids).execute()
        courses = _resp_data(resp) or []
        course_map = {c["id"]: c for c in courses}

        # fetch student's current enrollments (course ids)
        resp = db.table("enrollments").select("course_id").eq("student_id", student_id).execute()
        existing_enrollments = _resp_data(resp) or []
        existing_course_ids = [e["course_id"] for e in existing_enrollments]
        existing_courses = []
        if existing_course_ids:
            resp = db.table("courses").select("*").in_("id", existing_course_ids).execute()
            existing_courses = _resp_data(resp) or []
    else:
        courses = db.query(Course).filter(Course.id.in_(selected_course_ids)).all()
        course_map = {c.id: c for c in courses}

        # fetch student's current enrollments (course ids)
        existing_enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
        existing_course_ids = [e.course_id for e in existing_enrollments]
        existing_courses = db.query(Course).filter(Course.id.in_(existing_course_ids)).all()

    # Build list of (course_id, day, start, end)
    slots = []
    for c in list(courses) + list(existing_courses):
        # normalize c to dict for supabase path
        if _is_supabase(db):
            course_obj = c
            c_id = c["id"]
        else:
            course_obj = c
            c_id = c.id

        ts = _fetch_course_timeslot(db, course_obj)
        if ts is None:
            # treat missing timeslot as conflict
            slots.append({"course_id": c_id, "day": None, "start": None, "end": None})
        else:
            if _is_supabase(db):
                slots.append({"course_id": c_id, "day": ts["day"], "start": ts["start_time"], "end": ts["end_time"]})
            else:
                slots.append({"course_id": c_id, "day": ts.day, "start": ts.start_time, "end": ts.end_time})

    # detect overlaps
    conflicts = []
    seen_pairs = set()
    for i in range(len(slots)):
        for j in range(i+1, len(slots)):
            a = slots[i]; b = slots[j]
            if a["day"] is None or b["day"] is None:
                continue
            if timeslot_overlaps(a["day"], a["start"], a["end"], b["day"], b["start"], b["end"]):
                pair = tuple(sorted([a["course_id"], b["course_id"]]))
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    # only report if at least one of pair is in the *selected* course_ids
                    if a["course_id"] in selected_course_ids or b["course_id"] in selected_course_ids:
                        conflicts.append({"courses": pair})

    # check seat capacity for selected courses
    seat_conflicts = []
    suggestions = {}
    for c in courses:
        if _is_supabase(db):
            c_id = c["id"]
            # enrolled count
            resp = db.table("enrollments").select("count").filter("course_id", "eq", c_id).execute() if False else None
            # PostgREST doesn't provide a direct count in the same simple call; use count via RPC or fetch rows and len()
            resp = db.table("enrollments").select("*").eq("course_id", c_id).execute()
            enrolled_rows = _resp_data(resp) or []
            enrolled_count = len(enrolled_rows)
            max_seats = int(c.get("max_seats", 0) or 0)
            if enrolled_count >= max_seats:
                seat_conflicts.append({"course_id": c_id})
                # try to find alternatives: same course code but different timeslot and seats available
                resp = db.table("courses").select("*").eq("code", c["code"]).neq("id", c_id).execute()
                alt = _resp_data(resp) or []
                alternatives = []
                for a in alt:
                    resp = db.table("enrollments").select("*").eq("course_id", a["id"]).execute()
                    cnt = len(_resp_data(resp) or [])
                    if cnt < int(a.get("max_seats", 0) or 0):
                        alternatives.append(a["id"])
                if alternatives:
                    suggestions[c_id] = alternatives
        else:
            # enrolled count
            enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
            max_seats = int(getattr(c, "max_seats", 0) or 0)
            if enrolled_count >= max_seats:
                seat_conflicts.append({"course_id": c.id})
                # try to find alternatives: same course code but different timeslot and seats available
                alt = db.query(Course).filter(
                    Course.code == c.code,
                    Course.id != c.id
                ).all()
                alternatives = []
                for a in alt:
                    cnt = db.query(Enrollment).filter(Enrollment.course_id == a.id).count()
                    if cnt < int(getattr(a, "max_seats", 0) or 0):
                        alternatives.append(a.id)
                if alternatives:
                    suggestions[c.id] = alternatives

    valid = (len(conflicts) == 0 and len(seat_conflicts) == 0)
    # Also include smart suggestions for timeslot conflicts:
    # For each conflicting selected course, look for same code other sections with no time clash with student's existing schedule
    for pair in conflicts:
        c1, c2 = pair["courses"]
        # if one is existing and the other is selected, suggest change for selected one
        selected = c1 if c1 in selected_course_ids and c2 not in selected_course_ids else c2 if c2 in selected_course_ids and c1 not in selected_course_ids else None
        if selected is None:
            # both selected - give alternatives for both
            candidates = [c1, c2]
        else:
            candidates = [selected]

        for sc in candidates:
            c = course_map.get(sc)
            if c is None:
                continue
            # find other sections (same code) that don't clash with student's existing courses
            if _is_supabase(db):
                resp = db.table("courses").select("*").eq("code", c["code"]).neq("id", c["id"]).execute()
                other_sections = _resp_data(resp) or []
            else:
                other_sections = db.query(Course).filter(Course.code == c.code, Course.id != c.id).all()

            good_alts = []
            for sec in other_sections:
                # seats available?
                if _is_supabase(db):
                    sec_id = sec["id"]
                    resp = db.table("enrollments").select("*").eq("course_id", sec_id).execute()
                    cnt = len(_resp_data(resp) or [])
                    max_seats_sec = int(sec.get("max_seats", 0) or 0)
                else:
                    sec_id = sec.id
                    cnt = db.query(Enrollment).filter(Enrollment.course_id == sec.id).count()
                    max_seats_sec = int(getattr(sec, "max_seats", 0) or 0)

                if cnt >= max_seats_sec:
                    continue
                sec_ts = _fetch_course_timeslot(db, sec)
                if sec_ts is None:
                    continue
                clash = False
                for ec in existing_courses:
                    ets = _fetch_course_timeslot(db, ec)
                    if ets and timeslot_overlaps(sec_ts["day"] if _is_supabase(db) else sec_ts.day, sec_ts["start_time"] if _is_supabase(db) else sec_ts.start_time, sec_ts["end_time"] if _is_supabase(db) else sec_ts.end_time, ets["day"] if _is_supabase(db) else ets.day, ets["start_time"] if _is_supabase(db) else ets.start_time, ets["end_time"] if _is_supabase(db) else ets.end_time):
                        clash = True
                        break
                if not clash:
                    good_alts.append(sec_id)
            if good_alts:
                suggestions.setdefault(sc, []).extend(good_alts)

    return {
        "valid": valid,
        "conflicts": conflicts,
        "seat_conflicts": seat_conflicts,
        "suggestions": suggestions
    }

def enroll_student(db, student_id: int, course_id: int) -> Dict[str, Any]:
    """
    Enroll a student after running validate. This function does simple checks and creates Enrollment.
    Returns success boolean and message.
    """
    # verify capacity
    if _is_supabase(db):
        resp = db.table("courses").select("*").eq("id", course_id).execute()
        course = (_resp_data(resp) or [None])[0]
        if not course:
            return {"success": False, "message": "Course not found"}
        resp = db.table("enrollments").select("*").eq("course_id", course_id).execute()
        enrolled_count = len(_resp_data(resp) or [])
        max_seats = int(course.get("max_seats", 0) or 0)
        if enrolled_count >= max_seats:
            return {"success": False, "message": "Course full"}
        # create enrollment via supabase
        try:
            resp = db.table("enrollments").insert([{"student_id": student_id, "course_id": course_id}]).execute()
            data = _resp_data(resp)
            return {"success": True, "enrollment": data}
        except Exception as exc:
            return {"success": False, "message": str(exc)}
    else:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return {"success": False, "message": "Course not found"}
        enrolled_count = db.query(Enrollment).filter(Enrollment.course_id == course_id).count()
        max_seats = getattr(course, "max_seats", 0)
        if enrolled_count >= (int(max_seats) if max_seats is not None else 0):
            return {"success": False, "message": "Course full"}
        # create enrollment
        enrollment = Enrollment(student_id=student_id, course_id=course_id)
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return {"success": True, "enrollment_id": enrollment.id}
