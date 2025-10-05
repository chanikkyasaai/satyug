# SAT-YUG — AI Backend

This document describes the FastAPI backend in `AI_backend/` (APIs, data models, environment, and usage examples). The backend supports two database access patterns:

- Supabase client (PostgREST style): the code will call `supabase.table(...).select(...).execute()` etc. when a Supabase client is injected.
- SQLAlchemy ORM Session: legacy / server-side operations (DDL, create_all) use SQLAlchemy models and session operations.

Repository layout (relevant files)

- `main.py` — FastAPI app entrypoint and router registration.
- `database.py` — initializes SQLAlchemy engine and optionally a Supabase client; provides `get_supabase()` used as a FastAPI dependency.
- `models.py` — SQLAlchemy models (students, faculty, courses, timeslots, classrooms, enrollments, disruptions, optimization_results).
- `schemas.py` — Pydantic request/response models used by routers.
- `routers/registration.py` — endpoints for schedule validation and enrollment.
- `routers/optimizer.py` — endpoints for handling faculty reassignments and optimizations.
- `services/solver.py` — solver/validation logic (supabase-aware).
- `services/optimizer.py` — optimization logic (supabase-aware).

Environment
-----------

The backend expects these environment variables (recommended in a `.env` file for local dev):

- `SUPABASEURL` — your Supabase project URL (e.g. `https://xyzcompany.supabase.co`).
- `SUPABASEKEY` — API key (anon or service_role depending on operation). For DDL and direct Postgres operations use the `SERVICE_ROLE` key or provide `SUPABASEPASS` (see below).
- `SUPABASEPASS` — (optional) the Postgres password to build a direct SQLAlchemy DB URL when needed for create_all. If omitted you may still use the Supabase client for CRUD.

If you want to run `models.Base.metadata.create_all(bind=engine)` (create tables from SQLAlchemy models), `database.py` needs `SUPABASEPASS` so it can build a direct Postgres connection string (service role or DB password is required by Postgres). Otherwise use Supabase migrations from the dashboard.

APIs
----

Base URL: the FastAPI server will run (by default) on the host/port you specify when running uvicorn. The app registers two routers: `/registration` and `/optimizer`.

1) POST /registration/validate

- Purpose: Validate a student's selected list of course IDs for timeslot clashes and seat availability.
- Parameters (query/body):
  - `student_id` (int) — student to validate for
  - `course_ids` (List[int]) — list of course ids the student selected
- Dependency: `db = Depends(get_supabase)` (by default the Supabase client or SQLAlchemy session returned by `database.get_supabase()`)
- Response: JSON with shape

  {
    "valid": bool,
    "conflicts": [ {"courses": [courseA, courseB]}, ... ],
    "seat_conflicts": [{"course_id": id}, ...],
    "suggestions": { course_id: [alternative_course_id, ...], ... }
  }

2) POST /registration/enroll

- Purpose: Enroll a student into one course. Performs a final validation and creates an `enrollments` record.
- Request body: `EnrollmentCreate` (see `schemas.py`)
  - `student_id` (int)
  - `course_id` (int)
- Response: `EnrollmentOut` (Pydantic model) on success. Error conditions return 400 with details.
- Note: This endpoint currently calls `validate_schedule` internally and then `enroll_student` from `services.solver`.

3) POST /optimizer/reassign

- Purpose: Admin endpoint to compute candidate faculty replacements when a faculty is unavailable; records disruption and stores candidate solutions.
- Parameters (query/body):
  - `course_id` (int) — course affected
  - `faculty_unavailable` (int) — faculty id that's unavailable
  - `reason` (str, optional) — reason for disruption
- Response: { "candidates": [ { faculty, score, rank }, ... ], "disruption_recorded": { disruption_id, solutions_count } }

4) POST /optimizer/approve

- Purpose: Admin approves and applies a reassignment. Updates `Course.faculty_id` and marks disruptions resolved.
- Request body (JSON):
  - `course_id` (int)
  - `new_faculty_id` (int)
  - `admin_name` (str, optional)
- Response: message and result structure indicating success.

Data models (quick reference)
-----------------------------

See `models.py` / `schemas.py` for full definitions. Summary:

- Student: id, name, roll_number, email, year, branch
- Faculty: id, name, email, expertise, workload_cap, current_workload, available
- TimeSlot: id, day, start_time, end_time
- Classroom: id, room_number, capacity, building, resources
- Course: id, code, name, credits, semester, mandatory, faculty_id, timeslot_id, classroom_id, max_seats
- Enrollment: id, student_id, course_id, timestamp
- Disruption: id, course_id, faculty_unavailable, reason, timestamp, status, resolved_by
- OptimizationResult: id, disruption_id, candidate_faculty_id, score, rank, approved

Development: how to run locally
------------------------------

1) Create a virtualenv and install dependencies from `requirements.txt`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2) Add environment variables (create `.env` in `AI_backend/`):

```
SUPABASEURL=https://<your-project>.supabase.co
SUPABASEKEY=<your-supabase-key>
SUPABASEPASS=<postgres-password-or-service-role>
```

3) Run the app with uvicorn (from workspace root):

```powershell
cd AI_backend
uvicorn main:app --reload --port 8000
```

Notes & troubleshooting
-----------------------
- If you rely only on the Supabase client (no direct Postgres access), ensure your Supabase RLS policies allow the operations you need (inserts/selects). Some operations (DDL, create_all) require direct DB access via service role or DB user.
- The code often falls back to SQLAlchemy queries when a Session is provided; the routers currently use `get_supabase()` as dependency; ensure it returns the client or adjust to return a Session depending on your deployment.
- For high-volume counting operations (e.g., checking enrollment counts), consider using PostgREST "count" header or an RPC to avoid loading full row sets.

API Examples (curl)
-------------------

Validate selection:

```bash
curl -X POST "http://localhost:8000/registration/validate?student_id=1&course_ids=1&course_ids=2"
```

Enroll:

```bash
curl -X POST "http://localhost:8000/registration/enroll" -H "Content-Type: application/json" -d '{"student_id":1,"course_id":2}'
```

Request a reassignment:

```bash
curl -X POST "http://localhost:8000/optimizer/reassign" -d "course_id=5&faculty_unavailable=2&reason=illness"
```

Approve a reassignment:

```bash
curl -X POST "http://localhost:8000/optimizer/approve" -H "Content-Type: application/json" -d '{"course_id":5,"new_faculty_id":3,"admin_name":"alice"}'
```

Further work and recommendations
--------------------------------

- Add OpenAPI documentation examples and response models to each router for clarity (FastAPI already generates docs at `/docs`).
- Add unit tests for `services/solver.py` and `services/optimizer.py` covering both Supabase client and SQLAlchemy Session paths.
- Consider adding Alembic for migrations instead of relying on `create_all` in production.

If you'd like, I can:
- Run a quick smoke test against your Supabase instance (if you provide SUPABASEURL and SUPABASEKEY locally),
- Add example Postman collection or full OpenAPI examples,
- Or convert any remaining SQLAlchemy-only paths to use Supabase client calls uniformly.
