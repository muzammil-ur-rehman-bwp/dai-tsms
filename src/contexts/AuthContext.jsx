import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [firstLoginPending, setFirstLoginPending] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)

  async function fetchUserProfile(authUser) {
    if (!authUser) {
      setUser(null)
      setRole(null)
      setFirstLoginPending(false)
      setIsActive(true)
      return
    }

    setUser(authUser)

    // Fetch profile (role + first_login_pending)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, first_login_pending')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      setRole(null)
      setFirstLoginPending(false)
      setIsActive(false)
      return
    }

    setRole(profile.role)
    setFirstLoginPending(profile.first_login_pending)

    // Check is_active based on role
    if (profile.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('is_active')
        .eq('auth_user_id', authUser.id)
        .single()
      setIsActive(teacher?.is_active ?? false)
    } else if (profile.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('is_active')
        .eq('auth_user_id', authUser.id)
        .single()
      setIsActive(student?.is_active ?? false)
    } else {
      // admin — always active
      setIsActive(true)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      fetchUserProfile(initialSession?.user ?? null).finally(() => setLoading(false))
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setLoading(true)
        await fetchUserProfile(newSession?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    user,
    role,
    firstLoginPending,
    isActive,
    loading,
    signOut,
    setFirstLoginPending,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

export default AuthContext
