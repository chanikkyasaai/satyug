from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from database import get_db
import models, schemas

router = APIRouter(prefix="/api", tags=["CRUD"])


# Helper to 404 if not found
def _get_or_404(db_obj, model_name: str):
    if not db_obj:
        raise HTTPException(status_code=404, detail=f"{model_name} not found")
    return db_obj


# Students
@router.post("/students", response_model=schemas.StudentOut)
def create_student(student_in: schemas.StudentCreate, db: Session = Depends(get_db)):
    student = models.Student(**student_in.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/students", response_model=List[schemas.StudentOut])
def list_students(db: Session = Depends(get_db)):
    return db.query(models.Student).all()


@router.get("/students/{student_id}", response_model=schemas.StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    return _get_or_404(student, "Student")


@router.put("/students/{student_id}", response_model=schemas.StudentOut)
def update_student(student_id: int, student_in: schemas.StudentCreate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    _get_or_404(student, "Student")
    for k, v in student_in.model_dump().items():
        setattr(student, k, v)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    _get_or_404(student, "Student")
    db.delete(student)
    db.commit()
    return {"deleted": True}


# Faculty
@router.post("/faculty", response_model=schemas.FacultyOut)
def create_faculty(fac_in: schemas.FacultyCreate, db: Session = Depends(get_db)):
    fac = models.Faculty(**fac_in.model_dump())
    db.add(fac)
    db.commit()
    db.refresh(fac)
    return fac


@router.get("/faculty", response_model=List[schemas.FacultyOut])
def list_faculty(db: Session = Depends(get_db)):
    return db.query(models.Faculty).all()


@router.get("/faculty/{faculty_id}", response_model=schemas.FacultyOut)
def get_faculty(faculty_id: int, db: Session = Depends(get_db)):
    fac = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    return _get_or_404(fac, "Faculty")


@router.put("/faculty/{faculty_id}", response_model=schemas.FacultyOut)
def update_faculty(faculty_id: int, fac_in: schemas.FacultyCreate, db: Session = Depends(get_db)):
    fac = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    _get_or_404(fac, "Faculty")
    for k, v in fac_in.model_dump().items():
        setattr(fac, k, v)
    db.add(fac)
    db.commit()
    db.refresh(fac)
    return fac


@router.delete("/faculty/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    fac = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    _get_or_404(fac, "Faculty")
    db.delete(fac)
    db.commit()
    return {"deleted": True}


# TimeSlots
@router.post("/timeslots", response_model=schemas.TimeSlotOut)
def create_timeslot(ts_in: schemas.TimeSlotCreate, db: Session = Depends(get_db)):
    ts = models.TimeSlot(**ts_in.model_dump())
    db.add(ts)
    db.commit()
    db.refresh(ts)
    return ts


@router.get("/timeslots", response_model=List[schemas.TimeSlotOut])
def list_timeslots(db: Session = Depends(get_db)):
    return db.query(models.TimeSlot).all()


@router.get("/timeslots/{ts_id}", response_model=schemas.TimeSlotOut)
def get_timeslot(ts_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.TimeSlot).filter(models.TimeSlot.id == ts_id).first()
    return _get_or_404(ts, "TimeSlot")


@router.put("/timeslots/{ts_id}", response_model=schemas.TimeSlotOut)
def update_timeslot(ts_id: int, ts_in: schemas.TimeSlotCreate, db: Session = Depends(get_db)):
    ts = db.query(models.TimeSlot).filter(models.TimeSlot.id == ts_id).first()
    _get_or_404(ts, "TimeSlot")
    for k, v in ts_in.model_dump().items():
        setattr(ts, k, v)
    db.add(ts)
    db.commit()
    db.refresh(ts)
    return ts


@router.delete("/timeslots/{ts_id}")
def delete_timeslot(ts_id: int, db: Session = Depends(get_db)):
    ts = db.query(models.TimeSlot).filter(models.TimeSlot.id == ts_id).first()
    _get_or_404(ts, "TimeSlot")
    db.delete(ts)
    db.commit()
    return {"deleted": True}


# Classrooms
@router.post("/classrooms", response_model=schemas.ClassroomOut)
def create_classroom(c_in: schemas.ClassroomCreate, db: Session = Depends(get_db)):
    c = models.Classroom(**c_in.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/classrooms", response_model=List[schemas.ClassroomOut])
def list_classrooms(db: Session = Depends(get_db)):
    return db.query(models.Classroom).all()


@router.get("/classrooms/{c_id}", response_model=schemas.ClassroomOut)
def get_classroom(c_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Classroom).filter(models.Classroom.id == c_id).first()
    return _get_or_404(c, "Classroom")


@router.put("/classrooms/{c_id}", response_model=schemas.ClassroomOut)
def update_classroom(c_id: int, c_in: schemas.ClassroomCreate, db: Session = Depends(get_db)):
    c = db.query(models.Classroom).filter(models.Classroom.id == c_id).first()
    _get_or_404(c, "Classroom")
    for k, v in c_in.model_dump().items():
        setattr(c, k, v)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/classrooms/{c_id}")
def delete_classroom(c_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Classroom).filter(models.Classroom.id == c_id).first()
    _get_or_404(c, "Classroom")
    db.delete(c)
    db.commit()
    return {"deleted": True}


# Courses
@router.post("/courses", response_model=schemas.CourseOut)
def create_course(course_in: schemas.CourseCreate, db: Session = Depends(get_db)):
    course = models.Course(**course_in.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/courses", response_model=List[schemas.CourseOut])
def list_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()


@router.get("/courses/{course_id}", response_model=schemas.CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    return _get_or_404(course, "Course")


@router.put("/courses/{course_id}", response_model=schemas.CourseOut)
def update_course(course_id: int, course_in: schemas.CourseCreate, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    _get_or_404(course, "Course")
    for k, v in course_in.model_dump().items():
        setattr(course, k, v)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    _get_or_404(course, "Course")
    db.delete(course)
    db.commit()
    return {"deleted": True}


# Enrollments
@router.post("/enrollments", response_model=schemas.EnrollmentOut)
def create_enrollment(en_in: schemas.EnrollmentCreate, db: Session = Depends(get_db)):
    enrollment = models.Enrollment(**en_in.model_dump())
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/enrollments", response_model=List[schemas.EnrollmentOut])
def list_enrollments(db: Session = Depends(get_db)):
    return db.query(models.Enrollment).all()


@router.get("/enrollments/{en_id}", response_model=schemas.EnrollmentOut)
def get_enrollment(en_id: int, db: Session = Depends(get_db)):
    en = db.query(models.Enrollment).filter(models.Enrollment.id == en_id).first()
    return _get_or_404(en, "Enrollment")


@router.delete("/enrollments/{en_id}")
def delete_enrollment(en_id: int, db: Session = Depends(get_db)):
    en = db.query(models.Enrollment).filter(models.Enrollment.id == en_id).first()
    _get_or_404(en, "Enrollment")
    db.delete(en)
    db.commit()
    return {"deleted": True}


# Disruptions
@router.post("/disruptions", response_model=schemas.DisruptionOut)
def create_disruption(d_in: schemas.DisruptionCreate, db: Session = Depends(get_db)):
    d = models.DisruptionLog(**d_in.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.get("/disruptions", response_model=List[schemas.DisruptionOut])
def list_disruptions(db: Session = Depends(get_db)):
    return db.query(models.DisruptionLog).all()


@router.get("/disruptions/{d_id}", response_model=schemas.DisruptionOut)
def get_disruption(d_id: int, db: Session = Depends(get_db)):
    d = db.query(models.DisruptionLog).filter(models.DisruptionLog.id == d_id).first()
    return _get_or_404(d, "Disruption")


@router.put("/disruptions/{d_id}", response_model=schemas.DisruptionOut)
def update_disruption(d_id: int, d_in: schemas.DisruptionCreate, db: Session = Depends(get_db)):
    d = db.query(models.DisruptionLog).filter(models.DisruptionLog.id == d_id).first()
    _get_or_404(d, "Disruption")
    for k, v in d_in.model_dump().items():
        setattr(d, k, v)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/disruptions/{d_id}")
def delete_disruption(d_id: int, db: Session = Depends(get_db)):
    d = db.query(models.DisruptionLog).filter(models.DisruptionLog.id == d_id).first()
    _get_or_404(d, "Disruption")
    db.delete(d)
    db.commit()
    return {"deleted": True}


# Optimization Results
@router.post("/optimization_results", response_model=schemas.OptimizationResultOut)
def create_optimization_result(r_in: schemas.OptimizationResultCreate, db: Session = Depends(get_db)):
    r = models.OptimizationResult(**r_in.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.get("/optimization_results", response_model=List[schemas.OptimizationResultOut])
def list_optimization_results(db: Session = Depends(get_db)):
    return db.query(models.OptimizationResult).all()


@router.get("/optimization_results/{r_id}", response_model=schemas.OptimizationResultOut)
def get_optimization_result(r_id: int, db: Session = Depends(get_db)):
    r = db.query(models.OptimizationResult).filter(models.OptimizationResult.id == r_id).first()
    return _get_or_404(r, "OptimizationResult")


@router.put("/optimization_results/{r_id}", response_model=schemas.OptimizationResultOut)
def update_optimization_result(r_id: int, r_in: schemas.OptimizationResultCreate, db: Session = Depends(get_db)):
    r = db.query(models.OptimizationResult).filter(models.OptimizationResult.id == r_id).first()
    _get_or_404(r, "OptimizationResult")
    for k, v in r_in.model_dump().items():
        setattr(r, k, v)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/optimization_results/{r_id}")
def delete_optimization_result(r_id: int, db: Session = Depends(get_db)):
    r = db.query(models.OptimizationResult).filter(models.OptimizationResult.id == r_id).first()
    _get_or_404(r, "OptimizationResult")
    db.delete(r)
    db.commit()
    return {"deleted": True}
