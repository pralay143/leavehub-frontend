import { createContext, useContext } from 'react'

import type { Me } from '../api/generated'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  status: AuthStatus
  user: Me | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.')
  return value
}

/** The logged-in user. Only use inside routes guarded by <RequireAuth>. */
export function useCurrentUser(): Me {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser requires an authenticated user.')
  return user
}
