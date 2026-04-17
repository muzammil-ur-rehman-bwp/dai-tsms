import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'

/**
 * ProtectedRoute — wraps routes that require authentication and optionally a specific role.
 *
 * Logic:
 *  - loading → show spinner
 *  - !session → redirect to /login
 *  - firstLoginPending && not on /change-password → redirect to /change-password
 *  - !isActive → show deactivated message + sign out
 *  - requiredRole && role !== requiredRole → redirect to /{role}
 *  - else → render <Outlet /> (or children)
 *
 * @param {string} [requiredRole] - 'admin' | 'teacher' | 'student'
 * @param {React.ReactNode} [children] - optional children (used when not using Outlet)
 */
export default function ProtectedRoute({ requiredRole, children }) {
  const { session, role, firstLoginPending, isActive, loading, signOut } = useAuth()
  const location = useLocation()

  console.log('[ProtectedRoute] Render:', { loading, session: !!session, role, firstLoginPending, isActive, path: location.pathname })

  if (loading) {
    console.log('[ProtectedRoute] Showing loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <span className="text-sm text-gray-500">Loading…</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (firstLoginPending && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-danger-50 mb-4">
            <svg className="w-7 h-7 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account Deactivated</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your account has been deactivated. Please contact the administrator for assistance.
          </p>
          <button
            onClick={signOut}
            className="px-6 py-2.5 bg-danger text-white text-sm font-semibold rounded-lg hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 transition-colors"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to the user's own dashboard
    return <Navigate to={`/${role}`} replace />
  }

  // Render children (when used as wrapper) or Outlet (when used as layout route)
  return children ? children : <Outlet />
}
