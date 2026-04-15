import { useAuth } from '../../hooks/useAuth'

const ROLE_BADGE = {
  admin: { label: 'Admin', className: 'bg-primary-100 text-primary' },
  teacher: { label: 'Teacher', className: 'bg-secondary-100 text-secondary' },
  student: { label: 'Student', className: 'bg-accent-100 text-accent' },
}

export default function Topbar({ onMenuToggle }) {
  const { user, role, signOut } = useAuth()
  const badge = ROLE_BADGE[role] ?? { label: role, className: 'bg-gray-100 text-gray-600' }
  const displayName = user?.user_metadata?.name ?? user?.email ?? 'User'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* Left: hamburger (mobile) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Toggle sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Right: user info + logout */}
      <div className="flex items-center gap-3 ml-auto">
        <span className="hidden sm:block text-sm font-medium text-gray-700 truncate max-w-[160px]">
          {displayName}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 text-sm text-gray-600 hover:text-danger hover:bg-danger-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-danger"
          aria-label="Sign out"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
