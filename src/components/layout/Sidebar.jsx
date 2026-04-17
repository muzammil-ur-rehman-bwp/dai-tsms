import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuthContext } from '../../contexts/AuthContext'

export function Sidebar() {
  const location = useLocation()
  const { profile } = useAuthContext()

  const isActive = (path) => location.pathname === path

  const adminLinks = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Settings', path: '/admin/settings' },
  ]

  const teacherLinks = [
    { label: 'Dashboard', path: '/teacher/dashboard' },
    { label: 'Students', path: '/teacher/students' },
  ]

  const studentLinks = [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Exams', path: '/student/exams' },
  ]

  const links = profile?.role === 'admin' ? adminLinks : profile?.role === 'teacher' ? teacherLinks : studentLinks

  return (
    <aside className="hidden sm:flex w-64 bg-gradient-to-b from-primary to-primary-dark text-white flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-display font-bold">DAI-TSMS</h1>
        <p className="text-xs text-white/70 mt-1">{profile?.role || 'User'}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
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

      <div className="p-4 border-t border-white/10">
        <button className="w-full btn btn-outline text-white border-white/30 hover:bg-white/10">
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { profile } = useAuthContext()

  const isActive = (path) => location.pathname === path

  const adminLinks = [
    { label: 'Dashboard', path: '/admin/dashboard' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Settings', path: '/admin/settings' },
  ]

  const teacherLinks = [
    { label: 'Dashboard', path: '/teacher/dashboard' },
    { label: 'Students', path: '/teacher/students' },
  ]

  const studentLinks = [
    { label: 'Dashboard', path: '/student/dashboard' },
    { label: 'Exams', path: '/student/exams' },
  ]

  const links = profile?.role === 'admin' ? adminLinks : profile?.role === 'teacher' ? teacherLinks : studentLinks

  return (
    <div className="sm:hidden bg-primary text-white p-4 flex items-center justify-between">
      <h1 className="text-xl font-display font-bold">DAI-TSMS</h1>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-primary border-b border-white/10 p-4 space-y-2">
          {links.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setIsOpen(false)}
              className={`sidebar-link block ${isActive(path) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
          <button className="w-full btn btn-outline text-white border-white/30 hover:bg-white/10 mt-4">
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
