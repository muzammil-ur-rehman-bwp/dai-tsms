import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const { user, role, setFirstLoginPending } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setLoading(false)
      setError(updateError.message || 'Failed to update password. Please try again.')
      return
    }

    // Set first_login_pending = false in profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ first_login_pending: false })
      .eq('id', user.id)

    if (profileError) {
      setLoading(false)
      setError('Password updated but failed to update profile. Please contact the administrator.')
      return
    }

    // Update local state
    setFirstLoginPending(false)
    setLoading(false)

    // Redirect to role dashboard
    navigate(`/${role}`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-warning-100 mb-4">
              <svg className="w-7 h-7 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
            <p className="text-sm text-gray-500 mt-1">
              You must change your password before continuing.
            </p>
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
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="At least 8 characters"
                aria-label="New password"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Repeat your new password"
                aria-label="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              aria-label="Set new password"
            >
              {loading ? 'Updating…' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
