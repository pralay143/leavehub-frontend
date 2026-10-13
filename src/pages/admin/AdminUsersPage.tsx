import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Pagination,
  PasswordInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

import type { RoleEnum, User } from '../../api/generated'
import { useCurrentUser } from '../../auth/context'
import { ROLE_LABELS } from '../../auth/roles'
import { applyApiError } from '../../components/formErrors'
import { ErrorAlert, LoadingBlock } from '../../components/QueryState'
import { type UserQuery, useDepartments, useSaveUser, useUserOptions, useUsers } from '../../features/admin/api'

const PAGE_SIZE = 20
const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as RoleEnum[]).map((role) => ({ value: role, label: ROLE_LABELS[role] }))

type Editing = { user?: User } | null

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300)
  const [role, setRole] = useState<RoleEnum | null>(null)
  const [department, setDepartment] = useState<string | null>(null)
  const [active, setActive] = useState('active')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Editing>(null)

  const query: UserQuery = {
    page,
    search: debouncedSearch || undefined,
    role: role ?? undefined,
    department: department ? Number(department) : undefined,
    is_active: active === 'all' ? undefined : active === 'active',
  }
  const users = useUsers(query)
  const departments = useDepartments()
  const everyone = useUserOptions()

  const departmentName = new Map((departments.data ?? []).map((d) => [d.id, d.name]))
  const userName = new Map((everyone.data?.results ?? []).map((u) => [u.id, u.full_name]))
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }
  const totalPages = users.data ? Math.max(1, Math.ceil(users.data.count / PAGE_SIZE)) : 1

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Users</Title>
        <Button onClick={() => setEditing({})}>New user</Button>
      </Group>

      <Group gap="sm">
        <TextInput
          placeholder="Search name or email"
          value={search}
          onChange={(event) => resetPage(setSearch)(event.currentTarget.value)}
          w={240}
        />
        <Select placeholder="All roles" data={ROLE_OPTIONS} value={role} onChange={resetPage((v) => setRole(v as RoleEnum | null))} clearable w={150} />
        <Select
          placeholder="All departments"
          data={(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name }))}
          value={department}
          onChange={resetPage(setDepartment)}
          clearable
          w={190}
        />
        <SegmentedControl
          value={active}
          onChange={resetPage(setActive)}
          data={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'all', label: 'All' },
          ]}
        />
      </Group>

      {users.isLoading ? (
        <LoadingBlock />
      ) : users.error ? (
        <ErrorAlert error={users.error} />
      ) : users.data?.results.length === 0 ? (
        <Text c="dimmed">No users match these filters.</Text>
      ) : (
        <Table.ScrollContainer minWidth={760}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Role</Table.Th>
                <Table.Th>Manager</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.data?.results.map((user) => (
                <Table.Tr key={user.id}>
                  <Table.Td>
                    {user.full_name}
                    {user.is_superuser && (
                      <Badge ml="xs" size="xs" variant="light" color="grape">
                        Admin
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>{user.email}</Table.Td>
                  <Table.Td>{user.role ? ROLE_LABELS[user.role] : '—'}</Table.Td>
                  <Table.Td>{user.manager ? (userName.get(user.manager) ?? `#${user.manager}`) : '—'}</Table.Td>
                  <Table.Td>{user.department ? (departmentName.get(user.department) ?? '—') : '—'}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={user.is_active === false ? 'gray' : 'teal'}>
                      {user.is_active === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Button size="xs" variant="subtle" onClick={() => setEditing({ user })}>
                        Edit
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {totalPages > 1 && <Pagination value={page} total={totalPages} onChange={setPage} />}

      {editing && <UserModal user={editing.user} onClose={() => setEditing(null)} />}
    </Stack>
  )
}

const FIELDS = ['email', 'username', 'first_name', 'last_name', 'role', 'manager', 'department', 'is_active', 'password'] as const

function UserModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const currentUser = useCurrentUser()
  const save = useSaveUser()
  const departments = useDepartments()
  const approvers = useUserOptions({ is_active: true })
  const [formError, setFormError] = useState<string | null>(null)
  const isSelf = user?.id === currentUser.id

  const form = useForm({
    initialValues: {
      email: user?.email ?? '',
      username: user?.username ?? '',
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      role: (user?.role ?? 'EMPLOYEE') as RoleEnum,
      manager: user?.manager ? String(user.manager) : null,
      department: user?.department ? String(user.department) : null,
      is_active: user?.is_active ?? true,
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value.trim()) ? null : 'Enter a valid email address'),
      username: (value) => (value.trim() ? null : 'Enter a username'),
      password: (value) => (user || value ? null : 'Set an initial password'),
    },
  })

  // Managers must be active Manager or HR users, and never the user themselves.
  const managerOptions = (approvers.data?.results ?? [])
    .filter((u) => (u.role === 'MANAGER' || u.role === 'HR') && u.id !== user?.id)
    .map((u) => ({ value: String(u.id), label: `${u.full_name} (${ROLE_LABELS[u.role ?? 'EMPLOYEE']})` }))
  // Active departments, plus the user's current one even if it was deactivated.
  const departmentOptions = (departments.data ?? [])
    .filter((d) => d.is_active !== false || d.id === user?.department)
    .map((d) => ({ value: String(d.id), label: d.is_active === false ? `${d.name} (inactive)` : d.name }))

  const handleSubmit = form.onSubmit((values) => {
    setFormError(null)
    const body = {
      email: values.email.trim(),
      username: values.username.trim(),
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      role: values.role,
      manager: values.manager ? Number(values.manager) : null,
      department: values.department ? Number(values.department) : null,
      ...(user ? { is_active: values.is_active } : { password: values.password }),
    }
    save.mutate(
      { id: user?.id, body },
      {
        onSuccess: () => {
          notifications.show({ color: 'teal', message: user ? 'User updated.' : 'User created.' })
          onClose()
        },
        onError: (error) => setFormError(applyApiError(error, form.setErrors, FIELDS)),
      },
    )
  })

  return (
    <Modal opened onClose={onClose} title={user ? `Edit ${user.full_name}` : 'New user'} size="lg">
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          {formError && (
            <Alert color="red" variant="light">
              {formError}
            </Alert>
          )}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Email" type="email" required data-autofocus {...form.getInputProps('email')} />
            <TextInput label="Username" required {...form.getInputProps('username')} />
            <TextInput label="First name" {...form.getInputProps('first_name')} />
            <TextInput label="Last name" {...form.getInputProps('last_name')} />
            <Select
              label="Role"
              data={ROLE_OPTIONS}
              allowDeselect={false}
              disabled={isSelf}
              description={isSelf ? 'You cannot change your own role.' : undefined}
              {...form.getInputProps('role')}
            />
            <Select
              label="Manager"
              placeholder="No manager"
              description="Approves this user's leave."
              data={managerOptions}
              searchable
              clearable
              {...form.getInputProps('manager')}
            />
            <Select
              label="Department"
              placeholder="No department"
              data={departmentOptions}
              searchable
              clearable
              {...form.getInputProps('department')}
            />
          </SimpleGrid>
          {user ? (
            <Switch
              label="Active"
              description={isSelf ? 'You cannot deactivate yourself.' : 'Inactive users cannot log in or request leave.'}
              disabled={isSelf}
              {...form.getInputProps('is_active', { type: 'checkbox' })}
            />
          ) : (
            <PasswordInput
              label="Initial password"
              description="Share it with the user. It must meet the password rules."
              required
              autoComplete="new-password"
              {...form.getInputProps('password')}
            />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
