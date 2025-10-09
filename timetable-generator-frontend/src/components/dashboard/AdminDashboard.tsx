import { useAuth } from "../auth/AuthContext";
import { useState } from "react";
import StudentManagement from "../management/StudentManagement";
import FacultyManagement from "../management/FacultyManagement";
import CourseManagement from "../management/CourseManagement";
import InfrastructureManagement from "../management/InfrastructureManagement";
import TimeslotManagement from "../management/TimeslotManagement";
import ClassroomManagement from "../management/ClassroomManagement";
import { OptimizerAPI } from "../../api/endpoints";
import ChatWidget from "../ChatWidget";

export default function AdminDashboard() {
  const { userEmail, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "students" | "faculty" | "courses" | "infra" | "timeslots" | "classrooms"
  >("students");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                  Admin Dashboard
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
            Welcome back, Admin
          </h2>
          <p className="text-gray-600">
            Manage your institution's resources and settings
          </p>
        </div>

        {/* Removed placeholder Overview cards */}

        {/* Removed placeholder System Status cards */}

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={async () => {
                try {
                  // Example: trigger reassign for course 1 with unavailable faculty 1
                  await OptimizerAPI.reassign(1, 1, "manual trigger");
                  alert("Reassignment candidates generated (see backend store)");
                } catch (e: any) {
                  alert(e?.message || "Failed to trigger reassign");
                }
              }}
              className="group p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Generate Timetable
                  </p>
                  <p className="text-sm text-gray-600">Create new schedule</p>
                </div>
              </div>
            </button>

            <button
              // onClick={async () => {
              //   try {
              //     // Example: approve course 1 to new faculty 2
              //     await OptimizerAPI.approve(1, 2, "admin");
              //     alert("Reassignment approved and applied");
              //   } catch (e: any) {
              //     alert(e?.message || "Failed to approve reassignment");
              //   }
              // }}
              className="group p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Add Course</p>
                  <p className="text-sm text-gray-600">Create new course</p>
                </div>
              </div>
            </button>

            <button className="group p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    Edit Faculty Workload
                  </p>
                  <p className="text-sm text-gray-600">Manage assignments</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Removed decorative feature cards */}

        {/* Management Section */}
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Data Management
          </h3>
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeTab === "students"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab("faculty")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeTab === "faculty"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeTab === "courses"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab("classrooms")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeTab === "classrooms"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Classrooms
            </button>
            <button
              onClick={() => setActiveTab("timeslots")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeTab === "timeslots"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Timeslots
            </button>
            <button
              onClick={() => setActiveTab("infra")}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeTab === "infra"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Infrastructure
            </button>
          </div>
          <div className="space-y-6">
            {activeTab === "students" && <StudentManagement />}
            {activeTab === "faculty" && <FacultyManagement />}
            {activeTab === "courses" && <CourseManagement />}
            {activeTab === "infra" && <InfrastructureManagement />}
            {activeTab === "timeslots" && <TimeslotManagement />}
            {activeTab === "classrooms" && <ClassroomManagement />}
          </div>
        </div>
      </main>
      <ChatWidget userId={1} role="admin" />
    </div>
  );
}
