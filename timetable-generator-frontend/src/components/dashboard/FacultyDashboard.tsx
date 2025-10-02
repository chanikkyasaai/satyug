import { useAuth } from "../auth/AuthContext";

export default function FacultyDashboard() {
  const { userEmail, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                  Faculty Dashboard
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
            Welcome back, Professor
          </h2>
          <p className="text-gray-600">
            Manage your teaching schedule and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Courses & Timings - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assigned Courses Card */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
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
                    Assigned Courses & Timings
                  </h3>
                  <p className="text-gray-600">
                    Your current teaching schedule and assigned classes
                  </p>
                </div>
              </div>

              {/* Schedule List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-12 bg-blue-500 rounded-full"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Advanced Algorithms
                      </h4>
                      <p className="text-sm text-gray-600">
                        CS-401 • Room A-102 • 3 Credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      9:00 AM - 10:30 AM
                    </p>
                    <p className="text-sm text-gray-600">Mon, Wed, Fri</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-12 bg-green-500 rounded-full"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Data Structures
                      </h4>
                      <p className="text-sm text-gray-600">
                        CS-301 • Lab B-205 • 4 Credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      11:00 AM - 12:30 PM
                    </p>
                    <p className="text-sm text-gray-600">Tue, Thu</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-12 bg-purple-500 rounded-full"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Software Engineering
                      </h4>
                      <p className="text-sm text-gray-600">
                        CS-501 • Room C-301 • 3 Credits
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      2:00 PM - 3:30 PM
                    </p>
                    <p className="text-sm text-gray-600">Mon, Wed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Workload Summary Card */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Workload Summary
                  </h3>
                  <p className="text-gray-600">
                    Overview of your teaching responsibilities
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Total Courses
                      </span>
                      <span className="text-lg font-bold text-gray-900">4</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Weekly Hours
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        18h
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Total Credits
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        14
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: "70%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Students
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        142
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Workload Status</p>
                    <p className="text-sm text-gray-600">
                      Your current workload is within recommended limits
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Optimal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Availability & Quick Actions */}
          <div className="space-y-6">
            {/* Submit Availability Card */}
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">
                  Submit Availability
                </h3>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                Set your preferred teaching slots and unavailable times
              </p>

              <div className="space-y-3 mb-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="font-medium text-gray-900">
                    Current Preference
                  </p>
                  <p className="text-sm text-gray-600">
                    Morning slots (9AM-12PM)
                  </p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                  <p className="font-medium text-gray-900">Unavailable</p>
                  <p className="text-sm text-gray-600">Friday afternoons</p>
                </div>
              </div>

              <button className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg">
                Update Availability
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </button>
            </div>

            {/* Preferred Slots Card */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
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
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Preferred Slots</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Morning Sessions
                      </p>
                      <p className="text-sm text-gray-600">
                        9:00 AM - 12:00 PM
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      Preferred
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Early Afternoon
                      </p>
                      <p className="text-sm text-gray-600">1:00 PM - 3:00 PM</p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      Available
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Late Afternoon
                      </p>
                      <p className="text-sm text-gray-600">3:00 PM - 5:00 PM</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                      Limited
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full mt-4 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200">
                Manage Preferences
                <svg
                  className="w-4 h-4 ml-2"
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
              </button>
            </div>

            {/* Quick Actions */}
            <div className="group p-6 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
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
                  <p className="font-medium text-gray-900">
                    Request Schedule Change
                  </p>
                  <p className="text-sm text-gray-600">
                    Modify assigned timings
                  </p>
                </button>

                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors duration-200">
                  <p className="font-medium text-gray-900">Download Schedule</p>
                  <p className="text-sm text-gray-600">Export to calendar</p>
                </button>

                <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors duration-200">
                  <p className="font-medium text-gray-900">
                    View Academic Calendar
                  </p>
                  <p className="text-sm text-gray-600">Important dates</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
