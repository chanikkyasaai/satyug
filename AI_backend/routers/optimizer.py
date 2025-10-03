# backend/routers/optimizer.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from services.optimizer import optimize_faculty_assignment, record_disruption_and_solutions, apply_reassignment
from typing import Dict, Any

router = APIRouter(prefix="/optimizer", tags=["Tier3"])

@router.post("/reassign")
def api_reassign(course_id: int, faculty_unavailable: int , reason: str = "", db: Session = Depends(get_db)):
    """
    Admin triggers a reassign computation when a faculty becomes unavailable.
    Returns ranked candidate solutions.
    Also records disruption and stores candidate solutions in DB for audit.
    """
    try:
        sols = optimize_faculty_assignment(db, course_id, faculty_unavailable)
        # record disruption & solutions in DB
        record_info = record_disruption_and_solutions(db, course_id, faculty_unavailable, reason or "unspecified")
        return {"candidates": sols, "disruption_recorded": record_info}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve")
def api_approve_reassignment(course_id: int = Body(...), new_faculty_id: int = Body(...), admin_name: str = Body("admin"), db: Session = Depends(get_db)):
    """
    Admin approves and applies the reassignment. This updates Course.faculty_id and resolves disruptions.
    """
    try:
        res = apply_reassignment(db, course_id, new_faculty_id, resolved_by=admin_name)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail=res.get("message", "failed"))
        # TODO: notify students via notifications module
        return {"message": "Reassignment applied", "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
