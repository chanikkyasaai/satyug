# backend/seed.py
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models

def seed():
    Base.metadata.drop_all(bind=engine)   # clear tables (for testing only!)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    # Faculty
    f1 = models.Faculty(name="Dr. Sharma", email="sharma@uni.edu", expertise="Mathematics, AI", workload_cap=3, available=True)
    f2 = models.Faculty(name="Prof. Reddy", email="reddy@uni.edu", expertise="Physics, Electronics", workload_cap=2, available=True)
    f3 = models.Faculty(name="Dr. Mehta", email="mehta@uni.edu", expertise="Computer Science, Data Science", workload_cap=4, available=True)

    db.add_all([f1, f2, f3])
    db.commit()

    # TimeSlots
    ts1 = models.TimeSlot(day="Mon", start_time="09:00", end_time="10:00")
    ts2 = models.TimeSlot(day="Mon", start_time="10:00", end_time="11:00")
    ts3 = models.TimeSlot(day="Wed", start_time="14:00", end_time="15:00")
    ts4 = models.TimeSlot(day="Fri", start_time="09:00", end_time="10:00")

    db.add_all([ts1, ts2, ts3, ts4])
    db.commit()

    # Classrooms
    c1 = models.Classroom(room_number="A101", capacity=60, building="Block A", resources="Projector")
    c2 = models.Classroom(room_number="B202", capacity=40, building="Block B", resources="Lab, Projector")

    db.add_all([c1, c2])
    db.commit()

    # Courses
    math1 = models.Course(code="MATH101", name="Calculus I", credits=3, semester=1, mandatory=True,
                          faculty_id=f1.id, timeslot_id=ts1.id, classroom_id=c1.id, max_seats=50)
    math2 = models.Course(code="MATH101", name="Calculus I", credits=3, semester=1, mandatory=True,
                          faculty_id=f1.id, timeslot_id=ts3.id, classroom_id=c1.id, max_seats=50)  # alternative section
    phy1 = models.Course(code="PHY101", name="Physics I", credits=4, semester=1, mandatory=True,
                         faculty_id=f2.id, timeslot_id=ts2.id, classroom_id=c2.id, max_seats=40)
    cs1 = models.Course(code="CS101", name="Introduction to Programming", credits=4, semester=1, mandatory=False,
                        faculty_id=f3.id, timeslot_id=ts4.id, classroom_id=c2.id, max_seats=45)

    db.add_all([math1, math2, phy1, cs1])
    db.commit()

    # Students
    s1 = models.Student(name="Aarav", roll_number="21CS001", email="aarav@uni.edu", year=1, branch="CSE")
    s2 = models.Student(name="Ananya", roll_number="21CS002", email="ananya@uni.edu", year=1, branch="CSE")

    db.add_all([s1, s2])
    db.commit()

    # Enrollments (initial)
    e1 = models.Enrollment(student_id=s1.id, course_id=math1.id)
    e2 = models.Enrollment(student_id=s1.id, course_id=phy1.id)

    db.add_all([e1, e2])
    db.commit()

    print("✅ Database seeded successfully with sample data.")

if __name__ == "__main__":
    seed()
