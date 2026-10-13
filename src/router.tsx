import { createBrowserRouter } from 'react-router'

import { RequireAuth, RequireRole } from './auth/guards'
import { isApprover, isHR } from './auth/roles'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <PlaceholderPage title="Dashboard" /> },
          { path: 'requests', element: <PlaceholderPage title="My requests" /> },
          { path: 'requests/:id', element: <PlaceholderPage title="Leave request" /> },
          {
            element: <RequireRole allow={isApprover} />,
            children: [
              { path: 'review', element: <PlaceholderPage title="Review" /> },
              { path: 'team', element: <PlaceholderPage title="Team" /> },
            ],
          },
          {
            path: 'admin',
            element: <RequireRole allow={isHR} />,
            children: [
              { path: 'users', element: <PlaceholderPage title="Users" /> },
              { path: 'departments', element: <PlaceholderPage title="Departments" /> },
              { path: 'leave-types', element: <PlaceholderPage title="Leave types" /> },
              { path: 'balances', element: <PlaceholderPage title="Balances" /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
