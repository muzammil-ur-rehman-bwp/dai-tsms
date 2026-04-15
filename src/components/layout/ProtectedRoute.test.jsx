import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Mock useAuth
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
  default: vi.fn(),
}))

import { useAuth } from '../../hooks/useAuth'

function renderWithRouter(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while auth is loading', () => {
    useAuth.mockReturnValue({ loading: true, session: null, role: null, firstLoginPending: false, isActive: true, signOut: vi.fn() })
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    )
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated user to /login', () => {
    useAuth.mockReturnValue({ loading: false, session: null, role: null, firstLoginPending: false, isActive: true, signOut: vi.fn() })
    renderWithRouter(
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders children for authenticated user with correct role', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: {} }, role: 'admin', firstLoginPending: false, isActive: true, signOut: vi.fn() })
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/" element={<div>Admin Content</div>} />
        </Route>
      </Routes>
    )
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('redirects authenticated user with wrong role to their own dashboard', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: {} }, role: 'teacher', firstLoginPending: false, isActive: true, signOut: vi.fn() })
    renderWithRouter(
      <Routes>
        <Route path="/teacher" element={<div>Teacher Dashboard</div>} />
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/" element={<div>Admin Content</div>} />
        </Route>
      </Routes>
    )
    expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('redirects to /change-password when firstLoginPending is true', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: {} }, role: 'teacher', firstLoginPending: true, isActive: true, signOut: vi.fn() })
    renderWithRouter(
      <Routes>
        <Route path="/change-password" element={<div>Change Password</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    )
    expect(screen.getByText('Change Password')).toBeInTheDocument()
  })

  it('shows deactivated message when isActive is false', () => {
    useAuth.mockReturnValue({ loading: false, session: { user: {} }, role: 'teacher', firstLoginPending: false, isActive: false, signOut: vi.fn() })
    renderWithRouter(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    )
    expect(screen.getByText('Account Deactivated')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})
