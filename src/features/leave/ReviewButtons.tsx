import { Button, type ButtonProps } from '@mantine/core'

import type { LeaveRequest } from '../../api/generated'
import type { ReviewDecision } from './ReviewModal'

type Props = {
  request: LeaveRequest
  onReview: (request: LeaveRequest, decision: ReviewDecision) => void
  size?: ButtonProps['size']
}

/** Approve/Reject buttons, shown only when the API says the current user may use them. */
export function ReviewButtons({ request, onReview, size = 'xs' }: Props) {
  return (
    <>
      {request.can_approve && (
        <Button size={size} color="teal" variant="light" onClick={() => onReview(request, 'approve')}>
          Approve
        </Button>
      )}
      {request.can_reject && (
        <Button size={size} color="red" variant="subtle" onClick={() => onReview(request, 'reject')}>
          Reject
        </Button>
      )}
    </>
  )
}
