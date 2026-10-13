import { Button, Group, Stack, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import { ErrorAlert, LoadingBlock } from '../components/QueryState'
import { useLeaveRequests } from '../features/leave/api'
import { LeaveRequestTable } from '../features/leave/LeaveRequestTable'
import { NewLeaveRequestModal } from '../features/leave/NewLeaveRequestModal'
import { RequestFilters, RequestPagination } from '../features/leave/RequestListControls'
import { useRequestListParams } from '../features/leave/useRequestListParams'
import { useConfirmCancel } from '../features/leave/useConfirmCancel'

export function MyRequestsPage() {
  const list = useRequestListParams()
  const [newOpened, newModal] = useDisclosure()
  const confirmCancel = useConfirmCancel()

  const requests = useLeaveRequests({ scope: 'mine', status: list.status, year: list.year, page: list.page })

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>My requests</Title>
        <Button onClick={newModal.open}>New request</Button>
      </Group>

      <RequestFilters list={list} />

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

      <RequestPagination list={list} count={requests.data?.count} />

      <NewLeaveRequestModal opened={newOpened} onClose={newModal.close} />
    </Stack>
  )
}
