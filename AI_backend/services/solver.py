# backend/services/solver.py
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from models import Course, TimeSlot, Enrollment
from datetime import datetime, time
import re

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

def _fetch_course_timeslot(db: Session, course: Course):
    ts = db.query(TimeSlot).filter(TimeSlot.id == course.timeslot_id).first()
    return ts

def validate_schedule(db: Session, student_id: int, selected_course_ids: List[int]) -> Dict[str, Any]:
    """
    Validate chosen courses for a single student:
      - check timeslot overlaps among selected courses AND with already enrolled courses
      - check seat capacity
    Returns:
      { valid: bool, conflicts: [...], suggestions: {course_id: [alternative_course_ids, ...]} }
    """
    # fetch selected courses and timeslots
    courses = db.query(Course).filter(Course.id.in_(selected_course_ids)).all()
    course_map = {c.id: c for c in courses}

    # fetch student's current enrollments (course ids)
    existing_enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    existing_course_ids = [e.course_id for e in existing_enrollments]
    existing_courses = db.query(Course).filter(Course.id.in_(existing_course_ids)).all()

    # Build list of (course_id, day, start, end)
    slots = []
    for c in courses + existing_courses:
        ts = _fetch_course_timeslot(db, c)
        if ts is None:
            # treat missing timeslot as conflict
            slots.append({"course_id": c.id, "day": None, "start": None, "end": None})
        else:
            slots.append({"course_id": c.id, "day": ts.day, "start": ts.start_time, "end": ts.end_time})

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
            other_sections = db.query(Course).filter(Course.code == c.code, Course.id != c.id).all()
            good_alts = []
            for sec in other_sections:
                # seats available?
                cnt = db.query(Enrollment).filter(Enrollment.course_id == sec.id).count()
                if cnt >= (int(getattr(sec, "max_seats", 0)) or 0):
                    continue
                sec_ts = _fetch_course_timeslot(db, sec)
                if sec_ts is None:
                    continue
                clash = False
                for ec in existing_courses:
                    ets = _fetch_course_timeslot(db, ec)
                    if ets and timeslot_overlaps(sec_ts.day, sec_ts.start_time, sec_ts.end_time, ets.day, ets.start_time, ets.end_time):
                        clash = True
                        break
                if not clash:
                    good_alts.append(sec.id)
            if good_alts:
                suggestions.setdefault(sc, []).extend(good_alts)

    return {
        "valid": valid,
        "conflicts": conflicts,
        "seat_conflicts": seat_conflicts,
        "suggestions": suggestions
    }

def enroll_student(db: Session, student_id: int, course_id: int) -> Dict[str, Any]:
    """
    Enroll a student after running validate. This function does simple checks and creates Enrollment.
    Returns success boolean and message.
    """
    # verify capacity
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
