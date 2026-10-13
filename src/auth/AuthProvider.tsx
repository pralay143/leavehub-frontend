import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, unwrap } from '../api/client'
import { authLoginCreate, authLogoutCreate, authMeRetrieve, type Me } from '../api/generated'
import { type AuthContextValue, AuthContext, type AuthStatus } from './context'
import {
  REFRESH_TOKEN_KEY,
  clearTokens,
  getRefreshToken,
  onSessionEnded,
  setTokens,
} from './tokens'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<Me | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (getRefreshToken() ? 'loading' : 'anonymous'))

  const endSession = useCallback(() => {
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  // Restore a stored session on page load.
  useEffect(() => {
    if (!getRefreshToken()) return
    let cancelled = false
    unwrap(authMeRetrieve())
      .then((me) => {
        if (cancelled) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) clearTokens()
        setStatus('anonymous')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // The refresh token was rejected (expired, revoked or password changed).
  useEffect(
    () =>
      onSessionEnded(() => {
        endSession()
        notifications.show({ color: 'yellow', title: 'Session ended', message: 'Please log in again.' })
      }),
    [endSession],
  )

  // Logging out in another tab removes the shared refresh token.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === REFRESH_TOKEN_KEY && event.newValue === null) {
        clearTokens()
        endSession()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [endSession])

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await unwrap(authLoginCreate({ body: { email, password } }))
      setTokens(tokens.access, tokens.refresh)
      queryClient.clear()
      const me = await unwrap(authMeRetrieve())
      setUser(me)
      setStatus('authenticated')
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    const refresh = getRefreshToken()
    clearTokens()
    endSession()
    if (refresh) {
      // Blacklist the refresh token; the local session is already gone either way.
      await authLogoutCreate({ body: { refresh } }).catch(() => undefined)
    }
  }, [endSession])

  const value = useMemo<AuthContextValue>(() => ({ status, user, login, logout }), [status, user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
