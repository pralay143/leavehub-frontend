import { API_BASE_URL } from '../api/config'

/**
 * Token storage and refresh.
 *
 * - The access token lives only in memory.
 * - The refresh token is kept in localStorage so a session survives reloads.
 * - The backend rotates refresh tokens and blacklists the old one, so a
 *   refresh token works once. All callers therefore share a single in-flight
 *   refresh; two parallel refreshes with the same token would log the user out.
 */

export const REFRESH_TOKEN_KEY = 'leavehub.refreshToken'

let accessToken: string | null = null
let refreshInFlight: Promise<string | null> | null = null
const sessionEndedListeners = new Set<() => void>()

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setTokens(access: string, refresh?: string): void {
  accessToken = access
  if (refresh) {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    } catch {
      // Storage unavailable (e.g. private mode): the session lasts until reload.
    }
  }
}

export function clearTokens(): void {
  accessToken = null
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** Called when the session can no longer be refreshed. Returns an unsubscribe function. */
export function onSessionEnded(listener: () => void): () => void {
  sessionEndedListeners.add(listener)
  return () => sessionEndedListeners.delete(listener)
}

class NetworkError extends Error {}

type TokenPair = { access: string; refresh: string }

async function requestRefresh(refresh: string): Promise<TokenPair | null> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
  } catch {
    throw new NetworkError('Could not reach the server.')
  }
  if (!response.ok) return null
  return (await response.json()) as TokenPair
}

async function performRefresh(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) {
    accessToken = null
    return null
  }

  try {
    let tokens = await requestRefresh(refresh)
    if (!tokens) {
      // Another tab may have rotated the token while this one was waiting.
      const latest = getRefreshToken()
      if (latest && latest !== refresh) tokens = await requestRefresh(latest)
    }
    if (!tokens) {
      clearTokens()
      sessionEndedListeners.forEach((listener) => listener())
      return null
    }
    setTokens(tokens.access, tokens.refresh)
    return tokens.access
  } catch (error) {
    // A network failure is not a rejected token: keep the session for a retry.
    if (error instanceof NetworkError) return null
    throw error
  }
}

/** Get a new access token, sharing one refresh between all concurrent callers. */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/** The current access token, refreshing first if there is a stored session but no token yet. */
export async function getOrRefreshAccessToken(): Promise<string | undefined> {
  if (accessToken) return accessToken
  if (!getRefreshToken()) return undefined
  return (await refreshAccessToken()) ?? undefined
}
