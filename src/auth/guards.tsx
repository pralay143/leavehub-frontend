import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'

import type { Me } from '../api/generated'
import { ForbiddenPage } from '../pages/ForbiddenPage'
import { useAuth } from './context'

export function FullPageLoader() {
  return (
    <Center h="100vh">
      <Loader />
    </Center>
  )
}

/** Renders child routes only for a logged-in user; otherwise redirects to /login. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageLoader />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/**
 * Renders child routes only when `allow(user)` is true. This only hides pages:
 * the backend enforces every permission itself.
 */
export function RequireRole({ allow }: { allow: (user: Me) => boolean }) {
  const { user } = useAuth()
  if (!user || !allow(user)) return <ForbiddenPage />
  return <Outlet />
}
