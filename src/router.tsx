import { createBrowserRouter } from 'react-router'

import { RequireAuth, RequireRole } from './auth/guards'
import { isApprover, isHR } from './auth/roles'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            lazy: () => import('./pages/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
          },
          {
            path: 'requests',
            lazy: () => import('./pages/MyRequestsPage').then((m) => ({ Component: m.MyRequestsPage })),
          },
          {
            path: 'requests/:id',
            lazy: () => import('./pages/RequestDetailPage').then((m) => ({ Component: m.RequestDetailPage })),
          },
          {
            element: <RequireRole allow={isApprover} />,
            children: [
              {
                path: 'review',
                lazy: () => import('./pages/ReviewPage').then((m) => ({ Component: m.ReviewPage })),
              },
              {
                path: 'team',
                lazy: () => import('./pages/TeamPage').then((m) => ({ Component: m.TeamPage })),
              },
            ],
          },
          {
            path: 'admin',
            element: <RequireRole allow={isHR} />,
            children: [
              {
                path: 'users',
                lazy: () => import('./pages/admin/AdminUsersPage').then((m) => ({ Component: m.AdminUsersPage })),
              },
              {
                path: 'departments',
                lazy: () =>
                  import('./pages/admin/AdminDepartmentsPage').then((m) => ({ Component: m.AdminDepartmentsPage })),
              },
              {
                path: 'leave-types',
                lazy: () =>
                  import('./pages/admin/AdminLeaveTypesPage').then((m) => ({ Component: m.AdminLeaveTypesPage })),
              },
              {
                path: 'balances',
                lazy: () => import('./pages/admin/AdminBalancesPage').then((m) => ({ Component: m.AdminBalancesPage })),
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
