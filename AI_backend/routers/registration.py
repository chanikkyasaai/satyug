# backend/routers/registration.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_supabase
from services.solver import validate_schedule, enroll_student
from models import Enrollment
from schemas import EnrollmentCreate, EnrollmentOut

router = APIRouter(prefix="/registration", tags=["Tier2"])

@router.post("/validate")
def api_validate_schedule(student_id: int, course_ids: List[int], db: Session = Depends(get_supabase)):
    """
    Validate a student's selected course list (real-time).
    Returns conflicts and suggestions (if any).
    """
    try:
        res = validate_schedule(db, student_id, course_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return res

@router.post("/enroll", response_model=EnrollmentOut)
def api_enroll(enroll_in: EnrollmentCreate, db: Session = Depends(get_supabase)):
    """
    Enroll a student into a single course (endpoint called after validate success).
    """
    # ideally, run a final validation (seat + clash) before enrolling
    validation = validate_schedule(db, enroll_in.student_id, [enroll_in.course_id])
    if not validation["valid"] and (validation["seat_conflicts"] or validation["conflicts"]):
        raise HTTPException(status_code=400, detail={"message": "Validation failed", "details": validation})

    result = enroll_student(db, enroll_in.student_id, enroll_in.course_id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Could not enroll"))

    # fetch enrollment to return
    enrollment = db.query(Enrollment).filter(Enrollment.id == result["enrollment_id"]).first()
    return enrollment
