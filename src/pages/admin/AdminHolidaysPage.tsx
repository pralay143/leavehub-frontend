import { Alert, Button, Group, Modal, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import { useState } from 'react'

import { errorMessage } from '../../api/client'
import type { PublicHoliday } from '../../api/generated'
import { applyApiError } from '../../components/formErrors'
import { ErrorAlert, LoadingBlock } from '../../components/QueryState'
import { useDeleteHoliday, useSaveHoliday } from '../../features/admin/api'
import { useHolidays } from '../../features/leave/api'
import { currentYear, formatDate } from '../../features/leave/format'

type Editing = { holiday?: PublicHoliday } | null

export function AdminHolidaysPage() {
  const thisYear = currentYear()
  const [year, setYear] = useState(String(thisYear))
  const [editing, setEditing] = useState<Editing>(null)
  const holidays = useHolidays(Number(year))
  const remove = useDeleteHoliday()

  const yearOptions = [thisYear + 1, thisYear, thisYear - 1].map((y) => ({ value: String(y), label: String(y) }))

  const confirmDelete = (holiday: PublicHoliday) =>
    modals.openConfirmModal({
      title: 'Delete public holiday?',
      children: (
        <Text size="sm">
          {holiday.name}, {formatDate(holiday.date)}. Requests already submitted keep their day count.
        </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Keep it' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        remove.mutate(holiday.id, {
          onSuccess: () => notifications.show({ color: 'teal', message: 'Holiday deleted.' }),
          onError: (error) => notifications.show({ color: 'red', title: 'Could not delete', message: errorMessage(error) }),
        }),
    })

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Public holidays</Title>
          <Text c="dimmed" size="sm">
            Holidays are not counted as leave days. Requests submitted before a change keep their day count.
          </Text>
        </div>
        <Button onClick={() => setEditing({})}>Add holiday</Button>
      </Group>

      <Select aria-label="Year" data={yearOptions} value={year} onChange={(v) => setYear(v ?? String(thisYear))} allowDeselect={false} w={110} />

      {holidays.isLoading ? (
        <LoadingBlock />
      ) : holidays.error ? (
        <ErrorAlert error={holidays.error} />
      ) : holidays.data?.length === 0 ? (
        <Text c="dimmed">No public holidays for {year} yet.</Text>
      ) : (
        <Table.ScrollContainer minWidth={480}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Date</Table.Th>
                <Table.Th>Day</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {holidays.data?.map((holiday) => (
                <Table.Tr key={holiday.id}>
                  <Table.Td>{formatDate(holiday.date)}</Table.Td>
                  <Table.Td>{dayjs(holiday.date).format('dddd')}</Table.Td>
                  <Table.Td>{holiday.name}</Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap="xs" wrap="nowrap">
                      <Button size="xs" variant="subtle" onClick={() => setEditing({ holiday })}>
                        Edit
                      </Button>
                      <Button size="xs" variant="subtle" color="red" onClick={() => confirmDelete(holiday)}>
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {editing && <HolidayModal holiday={editing.holiday} onClose={() => setEditing(null)} />}
    </Stack>
  )
}

function HolidayModal({ holiday, onClose }: { holiday?: PublicHoliday; onClose: () => void }) {
  const save = useSaveHoliday()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<{ date: string | null; name: string }>({
    initialValues: { date: holiday?.date ?? null, name: holiday?.name ?? '' },
    validate: {
      date: (value) => (value ? null : 'Choose a date'),
      name: (value) => (value.trim() ? null : 'Enter a name'),
    },
  })

  const handleSubmit = form.onSubmit((values) => {
    setFormError(null)
    save.mutate(
      { id: holiday?.id, body: { date: values.date!, name: values.name.trim() } },
      {
        onSuccess: () => {
          notifications.show({ color: 'teal', message: holiday ? 'Holiday updated.' : 'Holiday added.' })
          onClose()
        },
        onError: (error) => setFormError(applyApiError(error, form.setErrors, ['date', 'name'])),
      },
    )
  })

  return (
    <Modal opened onClose={onClose} title={holiday ? 'Edit public holiday' : 'Add public holiday'}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          {formError && (
            <Alert color="red" variant="light">
              {formError}
            </Alert>
          )}
          <DatePickerInput label="Date" placeholder="Pick a date" valueFormat="D MMM YYYY (dddd)" required {...form.getInputProps('date')} />
          <TextInput label="Name" placeholder="e.g. Diwali" required {...form.getInputProps('name')} />
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
