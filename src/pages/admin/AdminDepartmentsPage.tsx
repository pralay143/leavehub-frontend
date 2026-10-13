import { Alert, Badge, Button, Group, Modal, Stack, Switch, Table, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

import type { Department } from '../../api/generated'
import { applyApiError } from '../../components/formErrors'
import { ErrorAlert, LoadingBlock } from '../../components/QueryState'
import { useDepartments, useSaveDepartment } from '../../features/admin/api'

type Editing = { department?: Department } | null

export function AdminDepartmentsPage() {
  const departments = useDepartments()
  const [editing, setEditing] = useState<Editing>(null)

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Departments</Title>
        <Button onClick={() => setEditing({})}>New department</Button>
      </Group>

      {departments.isLoading ? (
        <LoadingBlock />
      ) : departments.error ? (
        <ErrorAlert error={departments.error} />
      ) : departments.data?.length === 0 ? (
        <Text c="dimmed">No departments yet.</Text>
      ) : (
        <Table.ScrollContainer minWidth={420}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {departments.data?.map((department) => (
                <Table.Tr key={department.id}>
                  <Table.Td>{department.name}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={department.is_active === false ? 'gray' : 'teal'}>
                      {department.is_active === false ? 'Inactive' : 'Active'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Button size="xs" variant="subtle" onClick={() => setEditing({ department })}>
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

      {editing && <DepartmentModal department={editing.department} onClose={() => setEditing(null)} />}
    </Stack>
  )
}

function DepartmentModal({ department, onClose }: { department?: Department; onClose: () => void }) {
  const save = useSaveDepartment()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm({
    initialValues: { name: department?.name ?? '', is_active: department?.is_active ?? true },
    validate: { name: (value) => (value.trim() ? null : 'Enter a name') },
  })

  const handleSubmit = form.onSubmit((values) => {
    setFormError(null)
    save.mutate(
      { id: department?.id, body: { name: values.name.trim(), is_active: values.is_active } },
      {
        onSuccess: () => {
          notifications.show({ color: 'teal', message: department ? 'Department updated.' : 'Department created.' })
          onClose()
        },
        onError: (error) => setFormError(applyApiError(error, form.setErrors, ['name', 'is_active'])),
      },
    )
  })

  return (
    <Modal opened onClose={onClose} title={department ? 'Edit department' : 'New department'}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          {formError && (
            <Alert color="red" variant="light">
              {formError}
            </Alert>
          )}
          <TextInput label="Name" required data-autofocus {...form.getInputProps('name')} />
          {department && (
            <Switch
              label="Active"
              description="Inactive departments cannot be assigned to users."
              {...form.getInputProps('is_active', { type: 'checkbox' })}
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
