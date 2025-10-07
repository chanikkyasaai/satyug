# SAT-YUG Database Schema (Overview)

Source: AI_backend/models.py

students
- id (PK), name, roll_number (unique), email (unique), year, branch
- Relations: enrollments (1:N)

faculty
- id (PK), name, email (unique), expertise, workload_cap, current_workload, available
- Relations: courses (1:N); referenced by disruptions.faculty_unavailable; referenced by optimization_results.candidate_faculty_id

timeslots
- id (PK), day (Mon–Fri), start_time (HH:MM), end_time (HH:MM)
- Relations: courses (1:N)

classrooms
- id (PK), room_number, capacity, building, resources
- Relations: courses (1:N)

courses
- id (PK), code, name, credits, semester, mandatory, faculty_id (FK), timeslot_id (FK), classroom_id (FK), max_seats
- Relations: faculty (N:1), timeslot (N:1), classroom (N:1), enrollments (1:N)

enrollments
- id (PK), student_id (FK), course_id (FK), timestamp (UTC)
- Relations: student (N:1), course (N:1)

disruptions
- id (PK), course_id (FK), faculty_unavailable (FK), reason, timestamp, status (pending|resolved), resolved_by (nullable)
- Relations: course (N:1), faculty_unavailable (N:1)

optimization_results
- id (PK), disruption_id (FK), candidate_faculty_id (FK), score, rank (Best|Good|Compromise), approved
- Relations: disruption (N:1), candidate_faculty (N:1)

ERD (textual)
- students (1) --< enrollments >-- (1) courses
- faculty (1) --< courses >-- (1) timeslots
- classrooms (1) --< courses
- disruptions (N) -> courses; (N) -> faculty (faculty_unavailable)
- optimization_results (N) -> disruptions; (N) -> faculty (candidate_faculty)

Field naming guide (synonyms)
- course_name -> courses.name
- course_code -> courses.code
- faculty_name -> faculty.name
- room -> classrooms.room_number
- start/end -> timeslots.start_time / timeslots.end_time
