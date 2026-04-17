import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'

const ROLE_GRADIENT = {
  admin:   'from-[#1e3a8a] to-[#4c1d95]',
  teacher: 'from-[#4c1d95] to-[#1e3a8a]',
  student: 'from-[#065f46] to-[#1e3a8a]',
}

export function Sidebar() {
  const location = useLocation()
  const { profile, signOut } = useAuthContext()

  const isActive = (path) => location.pathname === path
  const gradient = ROLE_GRADIENT[profile?.role] || ROLE_GRADIENT.student
  const initial = profile?.role?.[0]?.toUpperCase() || '?'

  const adminLinks = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Data Management', path: '/admin/data' },
    { label: 'Timetables', path: '/admin/timetables' },
    { label: 'Swap Requests', path: '/admin/swaps' },
  ]

  const teacherLinks = [
    { label: 'Dashboard', path: '/teacher' },
    { label: 'Timetable', path: '/teacher/timetable' },
  ]

  const studentLinks = [
    { label: 'Dashboard', path: '/student' },
    { label: 'Timetable', path: '/student/timetable' },
  ]

  const links = profile?.role === 'admin' ? adminLinks : profile?.role === 'teacher' ? teacherLinks : studentLinks

  async function handleLogout() {
    await signOut()
  }

  return (
    <aside className={`
      hidden lg:flex
      h-screen w-60 flex-shrink-0 flex-col
      bg-gradient-to-b ${gradient} text-white
    `}>
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-0.5">
          <img src="/dai-logo.png" alt="DAI" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          <span className="font-display text-lg font-bold text-white tracking-tight">DAI-TSMS</span>
        </div>
        <p className="text-[11px] text-white/40 pl-10 leading-tight">Dept. of AI - Timetable System</p>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-semibold text-sm flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.role || 'User'}</p>
            <span className="text-xs capitalize text-white/50">Logged in</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {links.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="w-full sidebar-link text-white/60 hover:text-white hover:bg-red-500/20"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { profile, signOut } = useAuthContext()

  const isActive = (path) => location.pathname === path
  const gradient = ROLE_GRADIENT[profile?.role] || ROLE_GRADIENT.student
  const initial = profile?.role?.[0]?.toUpperCase() || '?'

  const adminLinks = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Data Management', path: '/admin/data' },
    { label: 'Timetables', path: '/admin/timetables' },
    { label: 'Swap Requests', path: '/admin/swaps' },
  ]

  const teacherLinks = [
    { label: 'Dashboard', path: '/teacher' },
    { label: 'Timetable', path: '/teacher/timetable' },
  ]

  const studentLinks = [
    { label: 'Dashboard', path: '/student' },
    { label: 'Timetable', path: '/student/timetable' },
  ]

  const links = profile?.role === 'admin' ? adminLinks : profile?.role === 'teacher' ? teacherLinks : studentLinks

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  async function handleLogout() {
    setIsOpen(false)
    await signOut()
  }

  return (
    <>
      {/* Top bar — only visible on mobile/tablet */}
      <header className={`
        lg:hidden sticky top-0 z-30
        flex items-center justify-between
        px-4 h-14
        bg-gradient-to-r ${gradient} text-white
        shadow-sm
      `}>
        <div className="flex items-center gap-2.5">
          <img src="/dai-logo.png" alt="DAI" className="w-7 h-7 rounded-md object-cover flex-shrink-0" />
          <span className="font-display text-base font-bold text-white tracking-tight">DAI-TSMS</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-white/70 hidden sm:block">{profile?.role || 'User'}</span>
          <button
            onClick={() => setIsOpen(true)}
            className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={`
        lg:hidden fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw]
        flex flex-col
        bg-gradient-to-b ${gradient} text-white
        shadow-lift
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img src="/dai-logo.png" alt="DAI" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <span className="font-display text-lg font-bold text-white">DAI-TSMS</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.role || 'User'}</p>
              <span className="text-xs capitalize text-white/50">Logged in</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {links.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsOpen(false)}
              className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6">
          <button
            onClick={handleLogout}
            className="w-full sidebar-link text-white/60 hover:text-white hover:bg-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
