import { Group, SegmentedControl, Stack, Text, Title } from '@mantine/core'

import { useCurrentUser } from '../auth/context'
import { isHR } from '../auth/roles'
import { ErrorAlert, LoadingBlock } from '../components/QueryState'
import { useLeaveRequests } from '../features/leave/api'
import { LeaveRequestTable } from '../features/leave/LeaveRequestTable'
import { ReviewButtons } from '../features/leave/ReviewButtons'
import { RequestFilters, RequestPagination } from '../features/leave/RequestListControls'
import { useRequestListParams } from '../features/leave/useRequestListParams'
import { useReview } from '../features/leave/useReview'

export function TeamPage() {
  const user = useCurrentUser()
  const list = useRequestListParams()
  const review = useReview()

  const scope = isHR(user) && list.params.get('scope') === 'all' ? 'all' : 'team'
  const requests = useLeaveRequests({ scope, status: list.status, year: list.year, page: list.page })

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Team</Title>
        <Text c="dimmed">
          {scope === 'all' ? 'Leave requests from all employees.' : 'Leave requests from your direct reports.'}
        </Text>
      </div>

      <Group gap="sm">
        {isHR(user) && (
          <SegmentedControl
            value={scope}
            onChange={(value) => list.update({ scope: value === 'all' ? 'all' : null })}
            data={[
              { value: 'team', label: 'My team' },
              { value: 'all', label: 'All employees' },
            ]}
          />
        )}
        <RequestFilters list={list} />
      </Group>

      {requests.isLoading ? (
        <LoadingBlock />
      ) : requests.error ? (
        <ErrorAlert error={requests.error} />
      ) : (
        <LeaveRequestTable
          requests={requests.data?.results ?? []}
          showEmployee
          emptyText={scope === 'all' ? 'No leave requests match these filters.' : 'No requests from your direct reports match these filters.'}
          renderActions={(request) => <ReviewButtons request={request} onReview={review.open} />}
        />
      )}

      <RequestPagination list={list} count={requests.data?.count} />
      {review.modal}
    </Stack>
  )
}
