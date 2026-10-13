import { Group, Table, Text } from '@mantine/core'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

import type { LeaveRequest } from '../../api/generated'
import { StatusBadge } from './StatusBadge'
import { formatDate, formatDateRange, formatDays } from './format'

type Props = {
  requests: LeaveRequest[]
  showEmployee?: boolean
  /** Buttons for a row; clicks inside them do not open the request. */
  renderActions?: (request: LeaveRequest) => ReactNode
  emptyText?: string
}

export function LeaveRequestTable({ requests, showEmployee = false, renderActions, emptyText = 'No leave requests.' }: Props) {
  const navigate = useNavigate()

  if (requests.length === 0) {
    return (
      <Text c="dimmed" py="md">
        {emptyText}
      </Text>
    )
  }

  return (
    <Table.ScrollContainer minWidth={640}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            {showEmployee && <Table.Th>Employee</Table.Th>}
            <Table.Th>Type</Table.Th>
            <Table.Th>Dates</Table.Th>
            <Table.Th>Days</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Submitted</Table.Th>
            {renderActions && <Table.Th />}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {requests.map((request) => (
            <Table.Tr
              key={request.id}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/requests/${request.id}`)}
            >
              {showEmployee && <Table.Td>{request.employee.full_name}</Table.Td>}
              <Table.Td>{request.leave_type.name}</Table.Td>
              <Table.Td>{formatDateRange(request.start_date, request.end_date, request.half_day)}</Table.Td>
              <Table.Td>{formatDays(request.days)}</Table.Td>
              <Table.Td>
                <StatusBadge status={request.status} />
              </Table.Td>
              <Table.Td>{formatDate(request.created_at)}</Table.Td>
              {renderActions && (
                <Table.Td onClick={(event) => event.stopPropagation()}>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    {renderActions(request)}
                  </Group>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
