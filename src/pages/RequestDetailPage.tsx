import { Anchor, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import { ApiError } from '../api/client'
import { ErrorAlert, LoadingBlock } from '../components/QueryState'
import { useLeaveRequest } from '../features/leave/api'
import { formatDateRange, formatDateTime, formatDays } from '../features/leave/format'
import { StatusBadge } from '../features/leave/StatusBadge'
import { ReviewButtons } from '../features/leave/ReviewButtons'
import { useConfirmCancel } from '../features/leave/useConfirmCancel'
import { useReview } from '../features/leave/useReview'
import { NotFoundPage } from './NotFoundPage'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Text size="xs" c="dimmed" fw={500} tt="uppercase">
        {label}
      </Text>
      <Text component="div">{children}</Text>
    </div>
  )
}

export function RequestDetailPage() {
  const id = Number(useParams().id)
  const request = useLeaveRequest(id)
  const confirmCancel = useConfirmCancel()
  const review = useReview()
  const navigate = useNavigate()
  const location = useLocation()
  // Go back when the page was reached from inside the app; otherwise to the dashboard.
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  if (!Number.isInteger(id) || id <= 0) return <NotFoundPage />
  if (request.isLoading) return <LoadingBlock />
  if (request.error instanceof ApiError && request.error.status === 404) return <NotFoundPage />
  if (request.error || !request.data) return <ErrorAlert error={request.error} />

  const leave = request.data
  return (
    <Stack gap="lg" maw={720}>
      <Anchor component="button" type="button" size="sm" onClick={goBack} style={{ alignSelf: 'flex-start' }}>
        ← Back
      </Anchor>
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{leave.leave_type.name}</Title>
          <Text c="dimmed">{formatDateRange(leave.start_date, leave.end_date, leave.half_day)}</Text>
        </div>
        <StatusBadge status={leave.status} />
      </Group>

      <Paper withBorder p="lg">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <Field label="Employee">{leave.employee.full_name}</Field>
          <Field label="Days">{formatDays(leave.days)}</Field>
          <Field label="Submitted">{formatDateTime(leave.created_at)}</Field>
          <Field label="Reason">{leave.reason || '—'}</Field>
          {leave.reviewed_by && (
            <>
              <Field label={leave.status === 'REJECTED' ? 'Rejected by' : 'Reviewed by'}>
                {leave.reviewed_by.full_name}
                {leave.reviewed_at && (
                  <Text span c="dimmed" size="sm">
                    {' '}
                    · {formatDateTime(leave.reviewed_at)}
                  </Text>
                )}
              </Field>
              <Field label="Review comment">{leave.review_comment || '—'}</Field>
            </>
          )}
        </SimpleGrid>
      </Paper>

      {(leave.can_cancel || leave.can_approve || leave.can_reject) && (
        <Group>
          <ReviewButtons request={leave} onReview={review.open} size="sm" />
          {leave.can_cancel && (
            <Button color="red" variant="light" onClick={() => confirmCancel(leave)}>
              Cancel request
            </Button>
          )}
        </Group>
      )}
      {review.modal}
    </Stack>
  )
}
