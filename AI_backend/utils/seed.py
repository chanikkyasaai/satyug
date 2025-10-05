"""Seed script using the Supabase client.

This script will attempt to use the Supabase Python client (created in
`AI_backend/database.py`) to insert sample rows for faculty, timeslots,
classrooms, courses, students and enrollments.

Notes:
- The Supabase client must be configured (SUPABASEURL & SUPABASEKEY) and
  the server-side (service_role) key is required for inserts that touch
  Postgres directly. Keep the service_role key secret.
- This script inserts explicit `id` values so foreign keys can be set in
  the same run. If your DB already contains conflicting ids, change/remove
  the ids or run on a fresh DB.
"""

from typing import Any, Optional
import sys
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASEURL = os.getenv("SUPABASEURL")
SUPABASEKEY = os.getenv("SUPABASEKEY")

if SUPABASEURL is None or SUPABASEKEY is None:
    print("SUPABASEURL and SUPABASEKEY must be set in environment variables")
    sys.exit(1)
supabase: Optional[Client] = None
try:
    supabase = create_client(SUPABASEURL, SUPABASEKEY)
except Exception as e:
    print(f"Could not create Supabase client: {e}")
    sys.exit(1)
	

def _extract_data(resp: Any):
	# supabase client .execute() may return an object/dict with data
	if resp is None:
		return None
	# try attribute
	data = getattr(resp, "data", None)
	if data is not None:
		return data
	# try dict-like
	try:
		return resp.get("data")
	except Exception:
		return None


def seed_using_supabase(supabase_client: Any) -> None:
	print("Seeding database via Supabase client...")

	# Define sample rows with explicit ids so FKs can reference them
	# faculties = [
	# 	{"id": 1, "name": "Dr. Sharma", "email": "sharma@uni.edu", "expertise": "Mathematics, AI", "workload_cap": 3, "available": True},
	# 	{"id": 2, "name": "Prof. Reddy", "email": "reddy@uni.edu", "expertise": "Physics, Electronics", "workload_cap": 2, "available": True},
	# 	{"id": 3, "name": "Dr. Mehta", "email": "mehta@uni.edu", "expertise": "Computer Science, Data Science", "workload_cap": 4, "available": True},
	# ]

	# timeslots = [
	# 	{"id": 1, "day": "Mon", "start_time": "09:00", "end_time": "10:00"},
	# 	{"id": 2, "day": "Mon", "start_time": "10:00", "end_time": "11:00"},
	# 	{"id": 3, "day": "Wed", "start_time": "14:00", "end_time": "15:00"},
	# 	{"id": 4, "day": "Fri", "start_time": "09:00", "end_time": "10:00"},
	# ]

	# classrooms = [
	# 	{"id": 1, "room_number": "A101", "capacity": 60, "building": "Block A", "resources": "Projector"},
	# 	{"id": 2, "room_number": "B202", "capacity": 40, "building": "Block B", "resources": "Lab, Projector"},
	# ]

	# courses = [
	# 	{"id": 1, "code": "MATH101", "name": "Calculus I", "credits": 3, "semester": 1, "mandatory": True, "faculty_id": 1, "timeslot_id": 1, "classroom_id": 1, "max_seats": 50},
	# 	{"id": 2, "code": "MATH101", "name": "Calculus I", "credits": 3, "semester": 1, "mandatory": True, "faculty_id": 1, "timeslot_id": 3, "classroom_id": 1, "max_seats": 50},
	# 	{"id": 3, "code": "PHY101", "name": "Physics I", "credits": 4, "semester": 1, "mandatory": True, "faculty_id": 2, "timeslot_id": 2, "classroom_id": 2, "max_seats": 40},
	# 	{"id": 4, "code": "CS101", "name": "Introduction to Programming", "credits": 4, "semester": 1, "mandatory": False, "faculty_id": 3, "timeslot_id": 4, "classroom_id": 2, "max_seats": 45},
	# ]

	# students = [
	# 	{"id": 1, "name": "Aarav", "roll_number": "21CS001", "email": "aarav@uni.edu", "year": 1, "branch": "CSE"},
	# 	{"id": 2, "name": "Ananya", "roll_number": "21CS002", "email": "ananya@uni.edu", "year": 1, "branch": "CSE"},
	# ]

	# enrollments = [
	# 	{"id": 1, "student_id": 1, "course_id": 1},
	# 	{"id": 2, "student_id": 1, "course_id": 3},
	# ]

	# Helper to insert and print response
	def insert(table: str, rows: list):
		try:
			resp = supabase_client.table(table).insert(rows).execute()
			data = _extract_data(resp)
			print(f"Inserted into {table}: {data if data is not None else 'OK'}")
			return data
		except Exception as exc:
			print(f"Failed to insert into {table}: {exc}")
			raise

	# # Insert in order
	# insert("faculty", faculties)
	# insert("timeslots", timeslots)
	# insert("classrooms", classrooms)
	# insert("courses", courses)
	# insert("students", students)
	# insert("enrollments", enrollments)

	print("✅ Supabase seed completed.")


def main():
	if not supabase:
		print("Supabase client not configured. Please set SUPABASEURL and SUPABASEKEY and ensure the supabase package is installed.")
		sys.exit(1)

	seed_using_supabase(supabase)


if __name__ == "__main__":
	main()
