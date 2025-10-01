import { useAuth } from './auth/AuthContext'
import AdminDashboard from './dashboard/AdminDashboard'
import FacultyDashboard from './dashboard/FacultyDashboard'
import StudentDashboard from './dashboard/StudentDashboard'

export default function DashboardRouter() {
  const { role } = useAuth()

  if (role === 'admin') return <AdminDashboard />
  if (role === 'faculty') return <FacultyDashboard />
  return <StudentDashboard />
} 