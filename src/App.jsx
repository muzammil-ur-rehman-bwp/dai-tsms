import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/auth/LoginPage'
import ChangePasswordPage from './pages/auth/ChangePasswordPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import DataManagementPage from './pages/admin/DataManagementPage'
import TimetableManagementPage from './pages/admin/TimetableManagementPage'
import TimetableSchedulingPage from './pages/admin/TimetableSchedulingPage'
import SwapRequestsPage from './pages/admin/SwapRequestsPage'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherTimetablePage from './pages/teacher/TeacherTimetablePage'

// Student pages
import StudentDashboard from './pages/student/StudentDashboard'
import StudentTimetablePage from './pages/student/StudentTimetablePage'

// Entity pages
import AcademicYearsPage from './pages/admin/entity/AcademicYearsPage'
import AcademicSemestersPage from './pages/admin/entity/AcademicSemestersPage'
import AcademicPeriodsPage from './pages/admin/entity/AcademicPeriodsPage'
import DisciplinesPage from './pages/admin/entity/DisciplinesPage'
import ProgramsPage from './pages/admin/entity/ProgramsPage'
import SemesterNumbersPage from './pages/admin/entity/SemesterNumbersPage'
import SectionNumbersPage from './pages/admin/entity/SectionNumbersPage'
import DegreeLevelsPage from './pages/admin/entity/DegreeLevelsPage'
import CampusesPage from './pages/admin/entity/CampusesPage'
import SectionsPage from './pages/admin/entity/SectionsPage'
import TeachersPage from './pages/admin/entity/TeachersPage'
import StudentsPage from './pages/admin/entity/StudentsPage'
import CoursesPage from './pages/admin/entity/CoursesPage'
import RoomsPage from './pages/admin/entity/RoomsPage'
import SlotsPage from './pages/admin/entity/SlotsPage'
import SlotDurationsPage from './pages/admin/entity/SlotDurationsPage'

// Placeholder pages for teacher/student (filled in later tasks)
// (removed — real pages imported above)

const ENTITY_PAGE_MAP = {
  'academic-years': AcademicYearsPage,
  'academic-semesters': AcademicSemestersPage,
  'academic-periods': AcademicPeriodsPage,
  'disciplines': DisciplinesPage,
  'programs': ProgramsPage,
  'semester-numbers': SemesterNumbersPage,
  'section-numbers': SectionNumbersPage,
  'degree-levels': DegreeLevelsPage,
  'campuses': CampusesPage,
  'sections': SectionsPage,
  'teachers': TeachersPage,
  'students': StudentsPage,
  'courses': CoursesPage,
  'rooms': RoomsPage,
  'slots': SlotsPage,
  'slot-durations': SlotDurationsPage,
}

function EntityRouter() {
  const { entity } = useParams()
  const Page = ENTITY_PAGE_MAP[entity]
  if (!Page) return <div className="p-4 text-gray-500">Entity "{entity}" not found.</div>
  return <Page />
}

/** Redirects authenticated users to their role dashboard, or to /login if not authenticated */
function RoleRedirect() {
  const { session, role, loading } = useAuth()

  console.log('[RoleRedirect] Render:', { loading, session: !!session, role })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading…</span>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (role === 'admin') return <Navigate to="/admin" replace />
  if (role === 'teacher') return <Navigate to="/teacher" replace />
  if (role === 'student') return <Navigate to="/student" replace />

  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* First-login password change — requires session but no role check */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="data" element={<DataManagementPage />} />
        <Route path="data/:entity" element={<EntityRouter />} />
        <Route path="timetables" element={<TimetableManagementPage />} />
        <Route path="timetables/:id" element={<TimetableSchedulingPage />} />
        <Route path="swaps" element={<SwapRequestsPage />} />
      </Route>

      {/* Teacher routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute requiredRole="teacher">
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="timetable" element={<TeacherTimetablePage />} />
      </Route>

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="student">
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="timetable" element={<StudentTimetablePage />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  console.log('[App] Rendering')
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
