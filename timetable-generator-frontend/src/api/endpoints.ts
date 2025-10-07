import { api } from "./client";
import type {
  StudentCreate,
  StudentOut,
  FacultyCreate,
  FacultyOut,
  CourseCreate,
  CourseOut,
  ClassroomCreate,
  ClassroomOut,
  TimeSlotCreate,
  TimeSlotOut,
  EnrollmentCreate,
  EnrollmentOut,
  DisruptionCreate,
  DisruptionOut,
  OptimizationResultCreate,
  OptimizationResultOut,
} from "../types/backend";

// Students
export const StudentsAPI = {
  list: () => api.get<StudentOut[]>("/api/students"),
  create: (payload: StudentCreate) => api.post<StudentOut>("/api/students", payload),
  get: (id: number) => api.get<StudentOut>(`/api/students/${id}`),
  update: (id: number, payload: StudentCreate) => api.put<StudentOut>(`/api/students/${id}`, payload),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/students/${id}`),
};

// Faculty
export const FacultyAPI = {
  list: () => api.get<FacultyOut[]>("/api/faculty"),
  create: (payload: FacultyCreate) => api.post<FacultyOut>("/api/faculty", payload),
  get: (id: number) => api.get<FacultyOut>(`/api/faculty/${id}`),
  update: (id: number, payload: FacultyCreate) => api.put<FacultyOut>(`/api/faculty/${id}`, payload),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/faculty/${id}`),
};

// Registration
export const RegistrationAPI = {
  validate: (student_id: number, course_ids: number[]) =>
    api.post<any>(`/registration/validate?student_id=${student_id}`, course_ids),
  enroll: (payload: { student_id: number; course_id: number }) =>
    api.post<any>("/registration/enroll", payload),
};

// Optimizer
export const OptimizerAPI = {
  reassign: (course_id: number, faculty_unavailable: number, reason?: string) =>
    api.post<any>(`/optimizer/reassign?course_id=${course_id}&faculty_unavailable=${faculty_unavailable}&reason=${encodeURIComponent(reason || "")}`),
  approve: (course_id: number, new_faculty_id: number, admin_name?: string) =>
    api.post<any>("/optimizer/approve", { course_id, new_faculty_id, admin_name }),
};

// Courses
export const CoursesAPI = {
  list: () => api.get<CourseOut[]>("/api/courses"),
  create: (payload: CourseCreate) => api.post<CourseOut>("/api/courses", payload),
  get: (id: number) => api.get<CourseOut>(`/api/courses/${id}`),
  update: (id: number, payload: CourseCreate) => api.put<CourseOut>(`/api/courses/${id}`, payload),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/courses/${id}`),
};

// Classrooms
export const ClassroomsAPI = {
  list: () => api.get<ClassroomOut[]>("/api/classrooms"),
  create: (payload: ClassroomCreate) => api.post<ClassroomOut>("/api/classrooms", payload),
  get: (id: number) => api.get<ClassroomOut>(`/api/classrooms/${id}`),
  update: (id: number, payload: ClassroomCreate) => api.put<ClassroomOut>(`/api/classrooms/${id}`, payload),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/classrooms/${id}`),
};

// TimeSlots
export const TimeSlotsAPI = {
  list: () => api.get<TimeSlotOut[]>("/api/timeslots"),
  create: (payload: TimeSlotCreate) => api.post<TimeSlotOut>("/api/timeslots", payload),
  get: (id: number) => api.get<TimeSlotOut>(`/api/timeslots/${id}`),
  update: (id: number, payload: TimeSlotCreate) => api.put<TimeSlotOut>(`/api/timeslots/${id}`, payload),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/timeslots/${id}`),
};

// Enrollments
export const EnrollmentsAPI = {
  list: () => api.get<EnrollmentOut[]>("/api/enrollments"),
  create: (payload: EnrollmentCreate) => api.post<EnrollmentOut>("/api/enrollments", payload),
  get: (id: number) => api.get<EnrollmentOut>(`/api/enrollments/${id}`),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/enrollments/${id}`),
};

// Disruptions
export const DisruptionsAPI = {
  list: () => api.get<DisruptionOut[]>("/api/disruptions"),
  create: (payload: DisruptionCreate) => api.post<DisruptionOut>("/api/disruptions", payload),
  get: (id: number) => api.get<DisruptionOut>(`/api/disruptions/${id}`),
  update: (id: number, payload: DisruptionCreate) => api.put<DisruptionOut>(`/api/disruptions/${id}`, payload),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/disruptions/${id}`),
};

// Optimization Results
export const OptimizationResultsAPI = {
  list: () => api.get<OptimizationResultOut[]>("/api/optimization_results"),
  create: (payload: OptimizationResultCreate) => api.post<OptimizationResultOut>("/api/optimization_results", payload),
  get: (id: number) => api.get<OptimizationResultOut>(`/api/optimization_results/${id}`),
  update: (id: number, payload: OptimizationResultCreate) => api.put<OptimizationResultOut>(`/api/optimization_results/${id}`, payload),
  delete: (id: number) => api.delete<{ deleted: boolean }>(`/api/optimization_results/${id}`),
};


