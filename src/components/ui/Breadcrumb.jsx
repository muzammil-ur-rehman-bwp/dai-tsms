import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

/**
 * Breadcrumb — navigation component showing current page hierarchy
 * Automatically generates breadcrumbs from the current URL path
 */
export function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  // Map of path segments to display names
  const pathNameMap = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
    data: 'Data Management',
    timetables: 'Timetables',
    swaps: 'Swap Requests',
    timetable: 'Timetable',
    'change-password': 'Change Password',
  }

  // Don't show breadcrumb on home pages
  if (pathnames.length <= 1) {
    return null
  }

  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
    const isLast = index === pathnames.length - 1
    const displayName = pathNameMap[name] || name.charAt(0).toUpperCase() + name.slice(1)

    return { name: displayName, path: routeTo, isLast }
  })

  return (
    <nav className="flex items-center gap-1 mb-6 text-sm" aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center gap-1 text-ink-muted hover:text-ink transition-colors"
        title="Home"
      >
        <Home size={16} />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          <ChevronRight size={16} className="text-ink-faint" />
          {crumb.isLast ? (
            <span className="text-ink font-medium">{crumb.name}</span>
          ) : (
            <Link
              to={crumb.path}
              className="text-ink-muted hover:text-ink transition-colors"
            >
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
