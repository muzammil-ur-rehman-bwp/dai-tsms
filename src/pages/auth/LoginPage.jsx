import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setLoading(false)
      setError('Invalid email or password. Please try again.')
      return
    }

    // Auth state change in AuthContext will handle profile fetch + redirect
    // But we need to check is_active here before navigating
    const authUser = data.user
    if (!authUser) {
      setLoading(false)
      setError('Login failed. Please try again.')
      return
    }

    // Fetch profile to determine role and first_login_pending
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, first_login_pending')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('Account configuration error. Please contact the administrator.')
      return
    }

    // Check is_active for teacher/student
    if (profile.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('is_active')
        .eq('auth_user_id', authUser.id)
        .single()
      if (!teacher?.is_active) {
        await supabase.auth.signOut()
        setLoading(false)
        setError('Your account has been deactivated. Please contact the administrator.')
        return
      }
    } else if (profile.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('is_active')
        .eq('auth_user_id', authUser.id)
        .single()
      if (!student?.is_active) {
        await supabase.auth.signOut()
        setLoading(false)
        setError('Your account has been deactivated. Please contact the administrator.')
        return
      }
    }

    setLoading(false)

    // Redirect based on first_login_pending or role
    if (profile.first_login_pending) {
      navigate('/change-password', { replace: true })
    } else {
      navigate(`/${profile.role}`, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">DAI-TSMS</h1>
            <p className="text-sm text-gray-500 mt-1">Department of Artificial Intelligence</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger text-sm" role="alert">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="you@example.com"
                aria-label="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
                aria-label="Password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              aria-label="Sign in"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
