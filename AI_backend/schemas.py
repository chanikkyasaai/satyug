from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# ---------- Student ----------
class StudentBase(BaseModel):
    name: str
    roll_number: str
    email: str
    year: int
    branch: str

class StudentCreate(StudentBase):
    pass

class StudentOut(StudentBase):
    id: int
    class Config:
        orm_mode = True


# ---------- Faculty ----------
class FacultyBase(BaseModel):
    name: str
    email: str
    expertise: str
    workload_cap: int
    available: bool = True

class FacultyCreate(FacultyBase):
    pass

class FacultyOut(FacultyBase):
    id: int
    current_workload: int
    class Config:
        orm_mode = True


# ---------- TimeSlot ----------
class TimeSlotBase(BaseModel):
    day: str
    start_time: str
    end_time: str

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotOut(TimeSlotBase):
    id: int
    class Config:
        orm_mode = True


# ---------- Classroom ----------
class ClassroomBase(BaseModel):
    room_number: str
    capacity: int
    building: str
    resources: Optional[str]

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomOut(ClassroomBase):
    id: int
    class Config:
        orm_mode = True


# ---------- Course ----------
class CourseBase(BaseModel):
    code: str
    name: str
    credits: int
    semester: int
    mandatory: bool
    faculty_id: int
    timeslot_id: int
    classroom_id: int
    max_seats: int

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int
    class Config:
        orm_mode = True


# ---------- Enrollment ----------
class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentOut(EnrollmentBase):
    id: int
    timestamp: datetime
    class Config:
        orm_mode = True


# ---------- Disruption ----------
class DisruptionBase(BaseModel):
    course_id: int
    faculty_unavailable: int
    reason: str

class DisruptionCreate(DisruptionBase):
    pass

class DisruptionOut(DisruptionBase):
    id: int
    timestamp: datetime
    status: str
    resolved_by: Optional[str]
    class Config:
        orm_mode = True


# ---------- OptimizationResult ----------
class OptimizationResultBase(BaseModel):
    disruption_id: int
    candidate_faculty_id: int
    score: int
    rank: str
    approved: bool = False

class OptimizationResultCreate(OptimizationResultBase):
    pass

class OptimizationResultOut(OptimizationResultBase):
    id: int
    class Config:
        orm_mode = True
