import { Alert, Badge, Button, Group, Modal, NumberInput, Stack, Switch, Table, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

import type { LeaveType } from '../../api/generated'
import { applyApiError } from '../../components/formErrors'
import { ErrorAlert, LoadingBlock } from '../../components/QueryState'
import { useSaveLeaveType } from '../../features/admin/api'
import { useLeaveTypes } from '../../features/leave/api'
import { formatDays } from '../../features/leave/format'

type Editing = { leaveType?: LeaveType } | null

function YesNo({ value, yes, no }: { value: boolean | undefined; yes: string; no: string }) {
  return (
    <Badge variant="light" color={value === false ? 'gray' : 'teal'}>
      {value === false ? no : yes}
    </Badge>
  )
}

export function AdminLeaveTypesPage() {
  const leaveTypes = useLeaveTypes()
  const [editing, setEditing] = useState<Editing>(null)

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Leave types</Title>
        <Button onClick={() => setEditing({})}>New leave type</Button>
      </Group>

      {leaveTypes.isLoading ? (
        <LoadingBlock />
      ) : leaveTypes.error ? (
        <ErrorAlert error={leaveTypes.error} />
      ) : (
        <Table.ScrollContainer minWidth={720}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Code</Table.Th>
                <Table.Th>Days per year</Table.Th>
                <Table.Th>Paid</Table.Th>
                <Table.Th>Balance</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {leaveTypes.data?.map((leaveType) => (
                <Table.Tr key={leaveType.id}>
                  <Table.Td>{leaveType.name}</Table.Td>
                  <Table.Td>
                    <code>{leaveType.code}</code>
                  </Table.Td>
                  <Table.Td>
                    {leaveType.requires_balance === false ? '—' : formatDays(leaveType.default_annual_days ?? 0)}
                  </Table.Td>
                  <Table.Td>
                    <YesNo value={leaveType.is_paid} yes="Paid" no="Unpaid" />
                  </Table.Td>
                  <Table.Td>
                    <YesNo value={leaveType.requires_balance} yes="Uses balance" no="No limit" />
                  </Table.Td>
                  <Table.Td>
                    <YesNo value={leaveType.is_active} yes="Active" no="Inactive" />
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Button size="xs" variant="subtle" onClick={() => setEditing({ leaveType })}>
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

      {editing && <LeaveTypeModal leaveType={editing.leaveType} onClose={() => setEditing(null)} />}
    </Stack>
  )
}

const FIELDS = ['name', 'code', 'default_annual_days', 'is_paid', 'requires_balance', 'is_active'] as const

function LeaveTypeModal({ leaveType, onClose }: { leaveType?: LeaveType; onClose: () => void }) {
  const save = useSaveLeaveType()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm({
    initialValues: {
      name: leaveType?.name ?? '',
      code: leaveType?.code ?? '',
      default_annual_days: Number(leaveType?.default_annual_days ?? 0),
      is_paid: leaveType?.is_paid ?? true,
      requires_balance: leaveType?.requires_balance ?? true,
      is_active: leaveType?.is_active ?? true,
    },
    validate: {
      name: (value) => (value.trim() ? null : 'Enter a name'),
      code: (value) =>
        /^[A-Z][A-Z0-9_]*$/.test(value) ? null : 'Uppercase letters, digits and underscores, starting with a letter',
      default_annual_days: (value) => (value >= 0 ? null : 'Cannot be negative'),
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    setFormError(null)
    const body = {
      name: values.name.trim(),
      default_annual_days: String(values.default_annual_days),
      is_paid: values.is_paid,
      requires_balance: values.requires_balance,
      is_active: values.is_active,
      // The code cannot change after creation.
      ...(leaveType ? {} : { code: values.code }),
    }
    save.mutate(
      { id: leaveType?.id, body },
      {
        onSuccess: () => {
          notifications.show({ color: 'teal', message: leaveType ? 'Leave type updated.' : 'Leave type created.' })
          onClose()
        },
        onError: (error) => setFormError(applyApiError(error, form.setErrors, FIELDS)),
      },
    )
  })

  return (
    <Modal opened onClose={onClose} title={leaveType ? 'Edit leave type' : 'New leave type'}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          {formError && (
            <Alert color="red" variant="light">
              {formError}
            </Alert>
          )}
          <TextInput label="Name" required data-autofocus {...form.getInputProps('name')} />
          <TextInput
            label="Code"
            required
            disabled={Boolean(leaveType)}
            description={leaveType ? 'The code cannot be changed after creation.' : 'For example COMP_OFF'}
            {...form.getInputProps('code')}
            onChange={(event) => form.setFieldValue('code', event.currentTarget.value.toUpperCase())}
          />
          <NumberInput
            label="Default days per year"
            description="Used when yearly balances are allocated."
            min={0}
            step={0.5}
            decimalScale={1}
            disabled={!form.values.requires_balance}
            {...form.getInputProps('default_annual_days')}
          />
          <Switch label="Uses a balance" description="Off means requests are not limited." {...form.getInputProps('requires_balance', { type: 'checkbox' })} />
          <Switch label="Paid" {...form.getInputProps('is_paid', { type: 'checkbox' })} />
          {leaveType && <Switch label="Active" {...form.getInputProps('is_active', { type: 'checkbox' })} />}
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
