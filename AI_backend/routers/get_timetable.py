from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from services.timetable_service import (
    get_student_weekly_timetable,
    get_faculty_weekly_timetable,
)
import models


router = APIRouter(prefix="/api/timetable", tags=["Timetable"])


@router.get("/student/{student_id}")
def get_student_timetable(student_id: int, db: Session = Depends(get_db)):
    # Validate existence
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return get_student_weekly_timetable(db, student_id)


@router.get("/faculty/{faculty_id}")
def get_faculty_timetable(faculty_id: int, db: Session = Depends(get_db)):
    # Validate existence
    faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return get_faculty_weekly_timetable(db, faculty_id)


