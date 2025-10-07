from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Student(Base):   
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    roll_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True)
    year = Column(Integer)
    branch = Column(String)

    enrollments = relationship("Enrollment", back_populates="student")


class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True)
    expertise = Column(String)  # Comma-separated or JSON
    workload_cap = Column(Integer, default=3)
    current_workload = Column(Integer, default=0)
    available = Column(Boolean, default=True)

    courses = relationship("Course", back_populates="faculty")


class TimeSlot(Base):
    __tablename__ = "timeslots"
    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, nullable=False)   # e.g. "Mon"
    start_time = Column(String, nullable=False)  # "09:00"
    end_time = Column(String, nullable=False)    # "10:00"

    courses = relationship("Course", back_populates="timeslot")


class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, nullable=False)
    capacity = Column(Integer)
    building = Column(String)
    resources = Column(String, nullable=True)  # e.g. "Projector, Lab"

    courses = relationship("Course", back_populates="classroom")


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    credits = Column(Integer)
    semester = Column(Integer)
    mandatory = Column(Boolean, default=False)

    faculty_id = Column(Integer, ForeignKey("faculty.id"))
    timeslot_id = Column(Integer, ForeignKey("timeslots.id"))
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    max_seats = Column(Integer, default=60)

    faculty = relationship("Faculty", back_populates="courses")
    timeslot = relationship("TimeSlot", back_populates="courses")
    classroom = relationship("Classroom", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course")


class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))  # Corrected line

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class DisruptionLog(Base):
    __tablename__ = "disruptions"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    faculty_unavailable = Column(Integer, ForeignKey("faculty.id"))
    reason = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String, default="pending")  # pending/resolved
    resolved_by = Column(String, nullable=True)


class OptimizationResult(Base):
    __tablename__ = "optimization_results"
    id = Column(Integer, primary_key=True, index=True)
    disruption_id = Column(Integer, ForeignKey("disruptions.id"))
    candidate_faculty_id = Column(Integer, ForeignKey("faculty.id"))
    score = Column(Integer)
    rank = Column(String)  # Best / Good / Compromise
    approved = Column(Boolean, default=False)

class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String, index=True)
    course_name = Column(String)
    predicted_enrollment = Column(Integer)
    recommended_sections = Column(Integer)
    recommended_faculty = Column(String)
    faculty_score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())