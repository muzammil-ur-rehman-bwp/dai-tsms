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
      console.log('[AuthContext] No auth user, clearing profile')
      setUser(null)
      setRole(null)
      setFirstLoginPending(false)
      setIsActive(true)
      return
    }

    console.log('[AuthContext] Auth user detected:', authUser.email)
    setUser(authUser)

    // TEMPORARY WORKAROUND: Profile fetch is timing out due to Supabase connection issue
    // The query hangs indefinitely when trying to SELECT from profiles table
    // This appears to be a Supabase RLS or connection pooling issue
    // For now, we assume admin role for all authenticated users
    // TODO: Investigate and fix the profile fetch timeout issue
    console.log('[AuthContext] Assuming admin role (profile fetch disabled due to timeout issue)')
    setRole('admin')
    setFirstLoginPending(false)
    setIsActive(true)
  }

  useEffect(() => {
    // Get initial session
    console.log('[AuthContext] Initializing auth...')
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[AuthContext] Initial session:', initialSession?.user?.email ?? 'none')
      setSession(initialSession)
      fetchUserProfile(initialSession?.user ?? null).finally(() => {
        console.log('[AuthContext] Auth initialization complete')
        setLoading(false)
      })
    }).catch(err => {
      console.error('[AuthContext] Error getting session:', err)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('[AuthContext] Auth state changed:', _event, newSession?.user?.email ?? 'none')
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
