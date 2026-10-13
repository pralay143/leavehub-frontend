import { Button, Group, Pagination, Select, Stack, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useSearchParams } from 'react-router'

import type { StatusEnum } from '../api/generated'
import { ErrorAlert, LoadingBlock } from '../components/QueryState'
import { type LeaveRequestQuery, useLeaveRequests } from '../features/leave/api'
import { STATUS_OPTIONS, currentYear } from '../features/leave/format'
import { LeaveRequestTable } from '../features/leave/LeaveRequestTable'
import { NewLeaveRequestModal } from '../features/leave/NewLeaveRequestModal'
import { useConfirmCancel } from '../features/leave/useConfirmCancel'

const PAGE_SIZE = 20

export function MyRequestsPage() {
  const [params, setParams] = useSearchParams()
  const [newOpened, newModal] = useDisclosure()
  const confirmCancel = useConfirmCancel()

  const status = (params.get('status') as StatusEnum | null) ?? undefined
  const yearParam = params.get('year') ?? String(currentYear())
  const page = Math.max(1, Number(params.get('page')) || 1)

  const query: LeaveRequestQuery = {
    scope: 'mine',
    status,
    year: yearParam === 'all' ? undefined : Number(yearParam),
    page,
  }
  const requests = useLeaveRequests(query)

  const year = currentYear()
  const yearOptions = [
    { value: 'all', label: 'All years' },
    ...[year + 1, year, year - 1, year - 2].map((y) => ({ value: String(y), label: String(y) })),
  ]

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next, { replace: true })
  }

  const totalPages = requests.data ? Math.max(1, Math.ceil(requests.data.count / PAGE_SIZE)) : 1

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>My requests</Title>
        <Button onClick={newModal.open}>New request</Button>
      </Group>

      <Group gap="sm">
        <Select
          aria-label="Status"
          placeholder="All statuses"
          data={STATUS_OPTIONS}
          value={status ?? null}
          onChange={(value) => update({ status: value })}
          clearable
          w={180}
        />
        <Select
          aria-label="Year"
          data={yearOptions}
          value={yearParam}
          onChange={(value) => update({ year: value ?? String(year) })}
          allowDeselect={false}
          w={140}
        />
      </Group>

      {requests.isLoading ? (
        <LoadingBlock />
      ) : requests.error ? (
        <ErrorAlert error={requests.error} />
      ) : (
        <LeaveRequestTable
          requests={requests.data?.results ?? []}
          emptyText="No leave requests match these filters."
          renderActions={(request) =>
            request.can_cancel && (
              <Button size="xs" variant="subtle" color="red" onClick={() => confirmCancel(request)}>
                Cancel
              </Button>
            )
          }
        />
      )}

      {totalPages > 1 && (
        <Pagination value={page} total={totalPages} onChange={(value) => update({ page: String(value) })} />
      )}

      <NewLeaveRequestModal opened={newOpened} onClose={newModal.close} />
    </Stack>
  )
}
