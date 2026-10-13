import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '../../api/client'
import {
  type LeaveRequestCreate,
  type LeaveRequestsListData,
  leaveBalancesList,
  leaveRequestsApproveCreate,
  leaveRequestsCancelCreate,
  leaveRequestsCreate,
  leaveRequestsList,
  leaveRequestsRejectCreate,
  leaveRequestsRetrieve,
  leaveTypesList,
} from '../../api/generated'

export type LeaveRequestQuery = NonNullable<LeaveRequestsListData['query']>

export const leaveKeys = {
  types: ['leave-types'] as const,
  balancesAll: ['leave-balances'] as const,
  balances: (year: number) => ['leave-balances', { year }] as const,
  requestsAll: ['leave-requests'] as const,
  requests: (query: LeaveRequestQuery) => ['leave-requests', query] as const,
  request: (id: number) => ['leave-requests', 'detail', id] as const,
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveKeys.types,
    queryFn: () => unwrap(leaveTypesList()),
    staleTime: 5 * 60_000,
  })
}

/** The current user's balances for a year (HR users only see their own here too). */
export function useMyBalances(year: number, employeeId: number) {
  return useQuery({
    queryKey: [...leaveKeys.balances(year), employeeId],
    queryFn: () => unwrap(leaveBalancesList({ query: { year, employee: employeeId } })),
    select: (page) => page.results.filter((balance) => balance.employee.id === employeeId),
  })
}

export function useLeaveRequests(query: LeaveRequestQuery, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: leaveKeys.requests(query),
    queryFn: () => unwrap(leaveRequestsList({ query })),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

export function useLeaveRequest(id: number) {
  return useQuery({
    queryKey: leaveKeys.request(id),
    queryFn: () => unwrap(leaveRequestsRetrieve({ path: { id } })),
    enabled: Number.isInteger(id) && id > 0,
    retry: false,
  })
}

/** Refresh everything that a change to a leave request can affect. */
export function useInvalidateLeaveData() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: leaveKeys.requestsAll }),
      queryClient.invalidateQueries({ queryKey: leaveKeys.balancesAll }),
    ])
}

export function useCreateLeaveRequest() {
  const invalidate = useInvalidateLeaveData()
  return useMutation({
    mutationFn: (body: LeaveRequestCreate) => unwrap(leaveRequestsCreate({ body })),
    onSuccess: invalidate,
  })
}

export function useCancelLeaveRequest() {
  const invalidate = useInvalidateLeaveData()
  return useMutation({
    mutationFn: (id: number) => unwrap(leaveRequestsCancelCreate({ path: { id } })),
    onSuccess: invalidate,
  })
}

export type ReviewInput = { id: number; comment: string }

export function useApproveLeaveRequest() {
  const invalidate = useInvalidateLeaveData()
  return useMutation({
    mutationFn: ({ id, comment }: ReviewInput) =>
      unwrap(leaveRequestsApproveCreate({ path: { id }, body: { comment } })),
    onSuccess: invalidate,
  })
}

export function useRejectLeaveRequest() {
  const invalidate = useInvalidateLeaveData()
  return useMutation({
    mutationFn: ({ id, comment }: ReviewInput) =>
      unwrap(leaveRequestsRejectCreate({ path: { id }, body: { comment } })),
    onSuccess: invalidate,
  })
}
