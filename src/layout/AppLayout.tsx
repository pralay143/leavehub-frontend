import { AppShell, Badge, Burger, Button, Group, NavLink, Stack, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Outlet } from 'react-router'

import type { Me } from '../api/generated'
import { useAuth, useCurrentUser } from '../auth/context'
import { ROLE_LABELS, isApprover, isHR } from '../auth/roles'

type NavItem = { to: string; label: string; visible?: (user: Me) => boolean }
type NavSection = { label?: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/', label: 'Dashboard' },
      { to: '/requests', label: 'My requests' },
    ],
  },
  {
    label: 'Approvals',
    items: [
      { to: '/review', label: 'Review', visible: isApprover },
      { to: '/team', label: 'Team', visible: isApprover },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users', visible: isHR },
      { to: '/admin/departments', label: 'Departments', visible: isHR },
      { to: '/admin/leave-types', label: 'Leave types', visible: isHR },
      { to: '/admin/holidays', label: 'Holidays', visible: isHR },
      { to: '/admin/balances', label: 'Balances', visible: isHR },
    ],
  },
]

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure()
  const user = useCurrentUser()
  const { logout } = useAuth()

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.visible || item.visible(user)),
  })).filter((section) => section.items.length > 0)

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
            <Title order={4}>LeaveHub</Title>
          </Group>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" fw={500} visibleFrom="xs" truncate maw={220}>
              {user.full_name}
            </Text>
            <Badge variant="light">{ROLE_LABELS[user.role]}</Badge>
            {user.is_superuser && (
              <Badge variant="light" color="grape">
                Admin
              </Badge>
            )}
            <Button variant="subtle" size="xs" onClick={() => void logout()}>
              Log out
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <Stack gap="md">
          {sections.map((section, index) => (
            <div key={section.label ?? index}>
              {section.label && (
                <Text size="xs" fw={600} c="dimmed" tt="uppercase" px="sm" mb={4}>
                  {section.label}
                </Text>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  component={RouterNavLink}
                  to={item.to}
                  end={item.to === '/'}
                  label={item.label}
                  onClick={close}
                />
              ))}
            </div>
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
