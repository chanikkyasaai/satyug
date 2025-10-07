import { useAuth } from "../auth/AuthContext";
import { useRef, useState } from "react";
import { RegistrationAPI } from "../../api/endpoints";
// excel export will be loaded dynamically to avoid type resolution issues

export default function StudentDashboard() {
  const { userEmail, logout } = useAuth();
  const timetableRef = useRef<HTMLDivElement | null>(null);
  const [validating, setValidating] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [lastValidation, setLastValidation] = useState<any | null>(null);

  type CourseType = "core" | "lab" | "elective";
  type Day = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  type Course = {
    course: string;
    code: string;
    room: string;
    instructor: string;
    type: CourseType;
  };
  type Slot = {
    time: string;
    days: Record<Day, Course | null>;
  };

  // Sample timetable data
  const timetableData: Slot[] = [
    {
      time: "9:00 - 10:30",
      days: {
        monday: {
          course: "Advanced Algorithms",
          code: "CS-401",
          room: "A-102",
          instructor: "Dr. Smith",
          type: "core",
        },
        tuesday: null,
        wednesday: {
          course: "Advanced Algorithms",
          code: "CS-401",
          room: "A-102",
          instructor: "Dr. Smith",
          type: "core",
        },
        thursday: null,
        friday: {
          course: "Advanced Algorithms",
          code: "CS-401",
          room: "A-102",
          instructor: "Dr. Smith",
          type: "core",
        },
      },
    },
    {
      time: "11:00 - 12:30",
      days: {
        monday: null,
        tuesday: {
          course: "Data Structures Lab",
          code: "CS-301",
          room: "Lab B-205",
          instructor: "Prof. Johnson",
          type: "lab",
        },
        wednesday: null,
        thursday: {
          course: "Data Structures Lab",
          code: "CS-301",
          room: "Lab B-205",
          instructor: "Prof. Johnson",
          type: "lab",
        },
        friday: null,
      },
    },
    {
      time: "2:00 - 3:30",
      days: {
        monday: {
          course: "Software Engineering",
          code: "CS-501",
          room: "C-301",
          instructor: "Dr. Williams",
          type: "elective",
        },
        tuesday: null,
        wednesday: {
          course: "Software Engineering",
          code: "CS-501",
          room: "C-301",
          instructor: "Dr. Williams",
          type: "elective",
        },
        thursday: null,
        friday: null,
      },
    },
    {
      time: "4:00 - 5:30",
      days: {
        monday: null,
        tuesday: {
          course: "Database Systems",
          code: "CS-401",
          room: "D-201",
          instructor: "Dr. Brown",
          type: "core",
        },
        wednesday: null,
        thursday: {
          course: "Database Systems",
          code: "CS-401",
          room: "D-201",
          instructor: "Dr. Brown",
          type: "core",
        },
        friday: null,
      },
    },
  ];

  const getCourseColor = (type: CourseType) => {
    const colors: Record<CourseType, string> = {
      core: "bg-blue-50 border border-blue-200",
      lab: "bg-green-50 border border-green-200",
      elective: "bg-purple-50 border border-purple-200",
    };
    return colors[type] ?? "bg-gray-50 border border-gray-200";
  };

  const getTextColor = (type: CourseType) => {
    const colors: Record<CourseType, { title: string; detail: string }> = {
      core: { title: "text-blue-900", detail: "text-blue-600" },
      lab: { title: "text-green-900", detail: "text-green-600" },
      elective: { title: "text-purple-900", detail: "text-purple-600" },
    };
    return colors[type] ?? { title: "text-gray-900", detail: "text-gray-600" };
  };

  const downloadPDF = () => {
    if (!timetableRef.current) return;
    const content = timetableRef.current.outerHTML;
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8" />
    <title>Student Timetable</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding: 24px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #e5e7eb; padding: 12px; vertical-align: top; }
      th { background: #f3f4f6; text-align: left; font-weight: 600; }
      .rounded-2xl { border-radius: 1rem; }
    </style>
    </head><body onload="window.print(); window.onafterprint = function(){ window.close(); }">
    <h2 style="margin:0 0 16px 0;">Student Timetable</h2>
    ${content}
    </body></html>`);
    win.document.close();
  };

  const downloadExcel = async () => {
    const ExcelJS: any = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timetable");

    worksheet.addRow(["Student Timetable - Spring 2024"]);
    worksheet.addRow([""]);
    worksheet.addRow([
      "Time/Day",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ]);

    timetableData.forEach((slot) => {
      const row: string[] = [slot.time];
      (
        ["monday", "tuesday", "wednesday", "thursday", "friday"] as Day[]
      ).forEach((day) => {
        const course = slot.days[day];
        if (course) {
          row.push(
            `${course.course}\n${course.code} - ${course.room}\n${course.instructor}`
          );
        } else {
          row.push("-");
        }
      });
      worksheet.addRow(row);
    });

    worksheet.columns = [
      { width: 14 },
      { width: 28 },
      { width: 28 },
      { width: 28 },
      { width: 28 },
      { width: 28 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-timetable.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const days: Day[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  async function validateSelection() {
    setValidating(true);
    try {
      // demo: validate courses [1,2] for student id 1
      const res = await RegistrationAPI.validate(1, [1, 2]);
      setLastValidation(res);
      alert("Validation complete: " + (res?.valid ? "valid" : "issues found"));
    } catch (e: any) {
      alert(e?.message || "Validation failed");
    } finally {
      setValidating(false);
    }
  }

  async function enrollInCourse() {
    setEnrolling(true);
    try {
      // demo: enroll student 1 to course 1
      const res = await RegistrationAPI.enroll({ student_id: 1, course_id: 1 });
      alert("Enrolled successfully: " + JSON.stringify(res));
    } catch (e: any) {
      alert(e?.message || "Enroll failed");
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                  Student Dashboard
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-medium">{userEmail}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-900 to-blue-900 text-white font-medium hover:from-gray-800 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Student
          </h2>
          <p className="text-gray-600">
            View your timetable and academic information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timetable Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Timetable Card */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Personal Timetable
                    </h3>
                    <p className="text-gray-600">
                      Spring 2024 • 18 Credits Registered
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={validateSelection}
                    className="px-4 py-2 rounded-lg border border-blue-300 bg-white text-blue-700 font-medium hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
                    disabled={validating}
                  >
                    Validate
                  </button>
                  <button
                    onClick={enrollInCourse}
                    className="px-4 py-2 rounded-lg border border-emerald-300 bg-white text-emerald-700 font-medium hover:bg-emerald-50 transition-all duration-200 flex items-center gap-2"
                    disabled={enrolling}
                  >
                    Enroll
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    PDF
                  </button>
                  <button
                    onClick={downloadExcel}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Excel
                  </button>
                </div>
              </div>

              {/* Timetable View */}
              <div ref={timetableRef} className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-150">
                        Time/Day
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-150">
                        Monday
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-150">
                        Tuesday
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-150">
                        Wednesday
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-150">
                        Thursday
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-gray-700 border border-gray-300 bg-gray-150">
                        Friday
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetableData.map((slot, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium text-gray-900 border border-gray-300 bg-gray-50 whitespace-nowrap">
                          {slot.time}
                        </td>
                        {days.map((day) => {
                          const course = slot.days[day];
                          const colors = getTextColor(
                            course?.type as CourseType
                          );

                          return (
                            <td
                              key={day}
                              className="p-3 border border-gray-300 align-top min-w-[200px]"
                            >
                              {course ? (
                                <div
                                  className={`${getCourseColor(
                                    course.type
                                  )} rounded-lg p-3 h-full`}
                                >
                                  <p
                                    className={`font-medium ${colors.title} mb-1`}
                                  >
                                    {course.course}
                                  </p>
                                  <p
                                    className={`text-xs ${colors.detail} mb-1`}
                                  >
                                    {course.code} • {course.room}
                                  </p>
                                  <p className={`text-xs ${colors.detail}`}>
                                    {course.instructor}
                                  </p>
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center py-4">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Core Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Labs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span>Electives</span>
                  </div>
                </div>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
                  View Full Schedule
                </button>
              </div>
            </div>

            {/* Removed decorative academic summary */}
          </div>

          {/* Removed sidebar with decorative cards */}
          <div className="space-y-6"></div>
        </div>
      </main>
    </div>
  );
}
