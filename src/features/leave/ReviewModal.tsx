import { Alert, Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'

import { errorMessage } from '../../api/client'
import type { LeaveRequest } from '../../api/generated'
import { useApproveLeaveRequest, useRejectLeaveRequest } from './api'
import { formatDateRange, formatDays } from './format'

export type ReviewDecision = 'approve' | 'reject'

type Props = {
  request: LeaveRequest | null
  decision: ReviewDecision
  onClose: () => void
}

/** Approve (optional comment) or reject (comment required) a leave request. */
export function ReviewModal({ request, decision, onClose }: Props) {
  const approve = useApproveLeaveRequest()
  const reject = useRejectLeaveRequest()
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isReject = decision === 'reject'
  const mutation = isReject ? reject : approve

  const close = () => {
    setComment('')
    setCommentError(null)
    setError(null)
    onClose()
  }

  const submit = () => {
    if (!request) return
    if (isReject && !comment.trim()) {
      setCommentError('A comment is required when rejecting.')
      return
    }
    setError(null)
    mutation.mutate(
      { id: request.id, comment: comment.trim() },
      {
        onSuccess: () => {
          notifications.show({
            color: isReject ? 'red' : 'teal',
            message: `${isReject ? 'Rejected' : 'Approved'} ${request.employee.full_name}'s request.`,
          })
          close()
        },
        onError: (err) => setError(errorMessage(err)),
      },
    )
  }

  return (
    <Modal opened={request !== null} onClose={close} title={isReject ? 'Reject leave request' : 'Approve leave request'}>
      {request && (
        <Stack>
          <Text size="sm">
            <Text span fw={600}>
              {request.employee.full_name}
            </Text>
            {' · '}
            {request.leave_type.name}, {formatDateRange(request.start_date, request.end_date, request.half_day)} (
            {formatDays(request.days)})
          </Text>
          {request.reason && (
            <Text size="sm" c="dimmed">
              Reason: {request.reason}
            </Text>
          )}
          {error && (
            <Alert color="red" variant="light">
              {error}
            </Alert>
          )}
          <Textarea
            label="Comment"
            placeholder={isReject ? 'Required: tell the employee why' : 'Optional'}
            required={isReject}
            autosize
            minRows={2}
            maxLength={2000}
            value={comment}
            error={commentError}
            onChange={(event) => {
              setComment(event.currentTarget.value)
              setCommentError(null)
            }}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button color={isReject ? 'red' : 'teal'} loading={mutation.isPending} onClick={submit}>
              {isReject ? 'Reject' : 'Approve'}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
