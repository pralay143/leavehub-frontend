import { useState } from 'react'

import type { LeaveRequest } from '../../api/generated'
import { type ReviewDecision, ReviewModal } from './ReviewModal'

/** State for the approve/reject modal: call `open`, and render `modal` once on the page. */
export function useReview() {
  const [state, setState] = useState<{ request: LeaveRequest; decision: ReviewDecision } | null>(null)

  return {
    open: (request: LeaveRequest, decision: ReviewDecision) => setState({ request, decision }),
    modal: (
      <ReviewModal
        request={state?.request ?? null}
        decision={state?.decision ?? 'approve'}
        onClose={() => setState(null)}
      />
    ),
  }
}
