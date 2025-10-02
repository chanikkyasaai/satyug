import { useAuth } from "../auth/AuthContext";
import { useRef } from "react";
// excel export will be loaded dynamically to avoid type resolution issues

export default function StudentDashboard() {
  const { userEmail, logout } = useAuth();
  const timetableRef = useRef<HTMLDivElement | null>(null);

  type CourseType = 'core' | 'lab' | 'elective'
  type Day = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'
  type Course = {
    course: string
    code: string
    room: string
    instructor: string
    type: CourseType
  }
  type Slot = {
    time: string
    days: Record<Day, Course | null>
  }

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
    const ExcelJS: any = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Timetable");

    worksheet.addRow(["Student Timetable - Spring 2024"]);
    worksheet.addRow([""]);
    worksheet.addRow(["Time/Day", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

    timetableData.forEach((slot) => {
      const row: string[] = [slot.time];
      (['monday','tuesday','wednesday','thursday','friday'] as Day[]).forEach((day) => {
        const course = slot.days[day];
        if (course) {
          row.push(`${course.course}\n${course.code} - ${course.room}\n${course.instructor}`);
        } else {
          row.push('-');
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
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-timetable.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const days: Day[] = ['monday','tuesday','wednesday','thursday','friday']

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
                          const colors = getTextColor(course?.type as CourseType);

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

            {/* Academic Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Current Credits
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">18</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Enrolled Courses
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">6</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Next Class
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      2:00 PM
                    </p>
                    <p className="text-xs text-gray-600">
                      Software Engineering
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Notifications & Quick Actions */}
          <div className="space-y-6">
            {/* Notifications Card */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">
                    Updates about your schedule
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Class Rescheduled
                      </p>
                      <p className="text-sm text-gray-600">
                        Data Structures Lab moved to Thu 1:00 PM
                      </p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900">Room Change</p>
                      <p className="text-sm text-gray-600">
                        Advanced Algorithms now in Room A-105
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        New Timetable Available
                      </p>
                      <p className="text-sm text-gray-600">
                        Spring 2024 timetable has been updated
                      </p>
                      <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full mt-4 text-center text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
                View All Notifications
              </button>
            </div>

            {/* Quick Actions */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              </div>

              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200">
                  <p className="font-medium text-gray-900">Manage Electives</p>
                  <p className="text-sm text-gray-600">
                    Add/drop courses for next term
                  </p>
                </button>

                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200">
                  <p className="font-medium text-gray-900">Academic Calendar</p>
                  <p className="text-sm text-gray-600">View important dates</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200">
                  <p className="font-medium text-gray-900">Course Materials</p>
                  <p className="text-sm text-gray-600">
                    Access lecture slides & resources
                  </p>
                </button>
              </div>
            </div>

            {/* Sync Status */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sync Status</h3>
                  <p className="text-sm text-gray-600">
                    Last updated: Today, 9:30 AM
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="font-medium text-green-800">
                  All systems synced
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
