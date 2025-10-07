// Types mirroring backend Pydantic schemas

export type ID = number;

export interface StudentBase {
  name: string;
  roll_number: string;
  email: string;
  year: number;
  branch: string;
}

export interface StudentCreate extends StudentBase {}

export interface StudentOut extends StudentBase {
  id: ID;
}

export interface FacultyBase {
  name: string;
  email: string;
  expertise: string;
  workload_cap: number;
  available: boolean;
}

export interface FacultyCreate extends FacultyBase {}

export interface FacultyOut extends FacultyBase {
  id: ID;
  current_workload: number;
}

export interface TimeSlotBase {
  day: string;
  start_time: string;
  end_time: string;
}

export interface TimeSlotCreate extends TimeSlotBase {}
export interface TimeSlotOut extends TimeSlotBase { id: ID }

export interface ClassroomBase {
  room_number: string;
  capacity: number;
  building: string;
  resources?: string | null;
}

export interface ClassroomCreate extends ClassroomBase {}
export interface ClassroomOut extends ClassroomBase { id: ID }

export interface CourseBase {
  code: string;
  name: string;
  credits: number;
  semester: number;
  mandatory: boolean;
  faculty_id: ID;
  timeslot_id: ID;
  classroom_id: ID;
  max_seats: number;
}

export interface CourseCreate extends CourseBase {}
export interface CourseOut extends CourseBase { id: ID }

export interface EnrollmentBase {
  student_id: ID;
  course_id: ID;
}

export interface EnrollmentCreate extends EnrollmentBase {}
export interface EnrollmentOut extends EnrollmentBase { id: ID; timestamp: string }

export interface DisruptionBase {
  course_id: ID;
  faculty_unavailable: ID;
  reason: string;
}

export interface DisruptionCreate extends DisruptionBase {}
export interface DisruptionOut extends DisruptionBase {
  id: ID;
  timestamp: string;
  status: string;
  resolved_by?: string | null;
}

export interface OptimizationResultBase {
  disruption_id: ID;
  candidate_faculty_id: ID;
  score: number;
  rank: string;
  approved: boolean;
}

export interface OptimizationResultCreate extends OptimizationResultBase {}
export interface OptimizationResultOut extends OptimizationResultBase { id: ID }


