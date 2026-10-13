import { Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'

import { errorMessage } from '../../api/client'
import type { LeaveRequest } from '../../api/generated'
import { useCancelLeaveRequest } from './api'
import { formatDateRange } from './format'

/** Returns a function that asks for confirmation and then cancels a request. */
export function useConfirmCancel() {
  const cancel = useCancelLeaveRequest()

  return (request: LeaveRequest) =>
    modals.openConfirmModal({
      title: 'Cancel leave request?',
      children: (
        <Text size="sm">
          {request.leave_type.name}, {formatDateRange(request.start_date, request.end_date, request.half_day)}.
          {request.status === 'APPROVED' && ' The days will be returned to your balance.'}
        </Text>
      ),
      labels: { confirm: 'Cancel request', cancel: 'Keep it' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        cancel.mutate(request.id, {
          onSuccess: () => notifications.show({ color: 'teal', message: 'Leave request cancelled.' }),
          onError: (error) =>
            notifications.show({ color: 'red', title: 'Could not cancel', message: errorMessage(error) }),
        }),
    })
}
