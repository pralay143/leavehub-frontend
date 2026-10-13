import { Stack, Text, Title } from '@mantine/core'

import { ErrorAlert, LoadingBlock } from '../components/QueryState'
import { useLeaveRequests } from '../features/leave/api'
import { LeaveRequestTable } from '../features/leave/LeaveRequestTable'
import { RequestPagination } from '../features/leave/RequestListControls'
import { useRequestListParams } from '../features/leave/useRequestListParams'
import { ReviewButtons } from '../features/leave/ReviewButtons'
import { useReview } from '../features/leave/useReview'

export function ReviewPage() {
  const list = useRequestListParams()
  const review = useReview()
  const requests = useLeaveRequests({ scope: 'review', page: list.page })

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Review</Title>
        <Text c="dimmed">Pending leave requests waiting for your decision.</Text>
      </div>

      {requests.isLoading ? (
        <LoadingBlock />
      ) : requests.error ? (
        <ErrorAlert error={requests.error} />
      ) : (
        <LeaveRequestTable
          requests={requests.data?.results ?? []}
          showEmployee
          emptyText="Nothing to review. You're all caught up."
          renderActions={(request) => <ReviewButtons request={request} onReview={review.open} />}
        />
      )}

      <RequestPagination list={list} count={requests.data?.count} />
      {review.modal}
    </Stack>
  )
}
