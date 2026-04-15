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

    console.log('[AuthContext] Fetching profile for user:', authUser.id)
    setUser(authUser)

    try {
      // Create a timeout promise (3 seconds)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      )

      // Fetch profile (role + first_login_pending)
      const fetchPromise = supabase
        .from('profiles')
        .select('role, first_login_pending')
        .eq('id', authUser.id)
        .single()

      const { data: profile, error: profileError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ])

      if (profileError) {
        console.error('[AuthContext] Profile fetch error:', profileError)
        
        // If profile doesn't exist, try to create it as admin
        if (profileError.code === 'PGRST116') {
          console.log('[AuthContext] Profile not found, creating admin profile...')
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: authUser.id, role: 'admin', first_login_pending: false })
          
          if (insertError) {
            console.error('[AuthContext] Failed to create profile:', insertError)
            // Still set as admin even if insert fails
            setRole('admin')
            setFirstLoginPending(false)
            setIsActive(true)
            return
          }
          
          console.log('[AuthContext] Admin profile created')
          setRole('admin')
          setFirstLoginPending(false)
          setIsActive(true)
          return
        }
        
        // For other errors, assume admin (temporary workaround)
        console.warn('[AuthContext] Assuming admin role due to profile fetch error')
        setRole('admin')
        setFirstLoginPending(false)
        setIsActive(true)
        return
      }

      if (!profile) {
        console.warn('[AuthContext] No profile found for user:', authUser.id)
        // Assume admin if no profile found
        setRole('admin')
        setFirstLoginPending(false)
        setIsActive(true)
        return
      }

      console.log('[AuthContext] Profile loaded:', profile)
      setRole(profile.role)
      setFirstLoginPending(profile.first_login_pending)

      // Check is_active based on role
      if (profile.role === 'teacher') {
        const { data: teacher, error: teacherError } = await supabase
          .from('teachers')
          .select('is_active')
          .eq('auth_user_id', authUser.id)
          .single()
        if (teacherError) {
          console.error('[AuthContext] Teacher fetch error:', teacherError)
          setIsActive(false)
        } else {
          setIsActive(teacher?.is_active ?? false)
        }
      } else if (profile.role === 'student') {
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('is_active')
          .eq('auth_user_id', authUser.id)
          .single()
        if (studentError) {
          console.error('[AuthContext] Student fetch error:', studentError)
          setIsActive(false)
        } else {
          setIsActive(student?.is_active ?? false)
        }
      } else {
        // admin — always active
        console.log('[AuthContext] Admin user, setting active')
        setIsActive(true)
      }
    } catch (err) {
      console.error('[AuthContext] Error in fetchUserProfile:', err)
      // Assume admin on any error (temporary workaround)
      console.warn('[AuthContext] Assuming admin role due to error')
      setRole('admin')
      setFirstLoginPending(false)
      setIsActive(true)
    }
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
