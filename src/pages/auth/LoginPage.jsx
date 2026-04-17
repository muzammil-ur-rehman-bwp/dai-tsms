import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'
import { Footer } from '../../components/layout/Footer'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    // Check is_active status from role-specific tables (teacher/student)
    if (profile.role === 'teacher') {
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('is_active')
        .eq('auth_user_id', authUser.id)
        .single()
      
      if (teacherError && teacherError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is ok for admin
        console.error('Teacher lookup error:', teacherError)
      }
      
      if (teacher && !teacher.is_active) {
        await supabase.auth.signOut()
        setLoading(false)
        setError('Your account has been deactivated. Please contact the administrator.')
        return
      }
    } else if (profile.role === 'student') {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('is_active')
        .eq('auth_user_id', authUser.id)
        .single()
      
      if (studentError && studentError.code !== 'PGRST116') {
        console.error('Student lookup error:', studentError)
      }
      
      if (student && !student.is_active) {
        await supabase.auth.signOut()
        setLoading(false)
        setError('Your account has been deactivated. Please contact the administrator.')
        return
      }
    }

    // Wait a tick for AuthContext to update, then redirect
    // This ensures the session state is properly set before navigation
    setTimeout(() => {
      setLoading(false)
      
      // Redirect based on first_login_pending or role
      if (profile.first_login_pending) {
        navigate('/change-password', { replace: true })
      } else {
        navigate(`/${profile.role}`, { replace: true })
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-secondary-dark flex flex-col items-center justify-center p-4">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5"
           style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 w-full max-w-md flex-1 flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/dai-logo.png" alt="DAI Logo" className="w-20 h-20 rounded-2xl object-cover" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-1">DAI-TSMS</h1>
          <p className="text-white/60 text-sm">Department of Artificial Intelligence - Timetable Scheduling & Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl3 p-5 sm:p-8 shadow-lift w-full">
          <h2 className="font-display text-2xl text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div>
              <label className="form-label text-white/80">Email Address</label>
              <input
                className="form-input bg-white/10 border-white/20 text-white placeholder-white/30 focus:border-white/60"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="form-label text-white/80">Password</label>
              <div className="relative">
                <input
                  className="form-input bg-white/10 border-white/20 text-white placeholder-white/30 focus:border-white/60 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-danger/20 border border-danger/30 text-sm text-white">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn bg-white text-primary font-semibold hover:bg-white/90 w-full justify-center mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <div className="relative z-10 w-full">
        <Footer light />
      </div>
    </div>
  )
}
