import { createBrowserRouter } from 'react-router'

import { AppLayout } from './layout/AppLayout'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export const router = createBrowserRouter([
  { path: '/login', element: <PlaceholderPage title="Log in" /> },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <PlaceholderPage title="Dashboard" /> },
      { path: 'requests', element: <PlaceholderPage title="My requests" /> },
      { path: 'requests/:id', element: <PlaceholderPage title="Leave request" /> },
      { path: 'review', element: <PlaceholderPage title="Review" /> },
      { path: 'team', element: <PlaceholderPage title="Team" /> },
      { path: 'admin/users', element: <PlaceholderPage title="Users" /> },
      { path: 'admin/departments', element: <PlaceholderPage title="Departments" /> },
      { path: 'admin/leave-types', element: <PlaceholderPage title="Leave types" /> },
      { path: 'admin/balances', element: <PlaceholderPage title="Balances" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
