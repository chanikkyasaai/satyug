from typing import Dict, List
from sqlalchemy.orm import Session

import models


# Days ordering used for weekly timetable output
DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri"]


def _empty_week() -> Dict[str, List[dict]]:
    return {day: [] for day in DAY_ORDER}


def get_student_weekly_timetable(db: Session, student_id: int) -> Dict[str, List[dict]]:
    """Return a dict keyed by weekday (Mon-Fri) containing the student's classes.

    Each entry in the list contains subject/course name, code, time range, classroom, and course id.
    """
    timetable = _empty_week()

    enrollments = (
        db.query(models.Enrollment)
        .join(models.Course, models.Enrollment.course)
        .join(models.TimeSlot, models.Course.timeslot)
        .outerjoin(models.Classroom, models.Course.classroom)
        .filter(models.Enrollment.student_id == student_id)
        .all()
    )

    for enrollment in enrollments:
        course = enrollment.course
        timeslot = course.timeslot
        if not timeslot or timeslot.day not in DAY_ORDER:
            continue
        classroom = course.classroom
        timetable[timeslot.day].append(
            {
                "courseId": course.id,
                "courseCode": course.code,
                "courseName": course.name,
                "startTime": timeslot.start_time,
                "endTime": timeslot.end_time,
                "classroom": None
                if classroom is None
                else {
                    "roomNumber": classroom.room_number,
                    "building": classroom.building,
                },
                "faculty": None
                if course.faculty is None
                else {
                    "id": course.faculty.id,
                    "name": course.faculty.name,
                },
            }
        )

    # Sort each day's entries by start_time (HH:MM strings sort lexicographically)
    for day in DAY_ORDER:
        timetable[day].sort(key=lambda x: (x["startTime"], x["endTime"]))

    return timetable


def get_faculty_weekly_timetable(db: Session, faculty_id: int) -> Dict[str, List[dict]]:
    """Return a dict keyed by weekday (Mon-Fri) containing the faculty's classes."""
    timetable = _empty_week()

    courses = (
        db.query(models.Course)
        .join(models.TimeSlot, models.Course.timeslot)
        .outerjoin(models.Classroom, models.Course.classroom)
        .filter(models.Course.faculty_id == faculty_id)
        .all()
    )

    for course in courses:
        timeslot = course.timeslot
        if not timeslot or timeslot.day not in DAY_ORDER:
            continue
        classroom = course.classroom
        timetable[timeslot.day].append(
            {
                "courseId": course.id,
                "courseCode": course.code,
                "courseName": course.name,
                "startTime": timeslot.start_time,
                "endTime": timeslot.end_time,
                "classroom": None
                if classroom is None
                else {
                    "roomNumber": classroom.room_number,
                    "building": classroom.building,
                },
            }
        )

    for day in DAY_ORDER:
        timetable[day].sort(key=lambda x: (x["startTime"], x["endTime"]))

    return timetable


