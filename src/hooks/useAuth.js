import { useAuthContext } from '../contexts/AuthContext'

/**
 * Convenience hook for consuming AuthContext.
 * Returns { session, user, role, firstLoginPending, isActive, loading, signOut, setFirstLoginPending }
 */
export function useAuth() {
  return useAuthContext()
}

export default useAuth
