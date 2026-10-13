import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '../../api/client'
import {
  type DepartmentWritable,
  type LeaveBalancesListData,
  type LeaveTypeWritable,
  type PatchedDepartmentWritable,
  type PatchedLeaveTypeWritable,
  type PatchedUserWritable,
  type UserWritable,
  type UsersListData,
  departmentsCreate,
  departmentsList,
  departmentsPartialUpdate,
  leaveBalancesAllocateCreate,
  leaveBalancesList,
  leaveBalancesPartialUpdate,
  leaveTypesCreate,
  leaveTypesPartialUpdate,
  usersCreate,
  usersList,
  usersPartialUpdate,
} from '../../api/generated'
import { leaveKeys } from '../leave/api'

export type UserQuery = NonNullable<UsersListData['query']>
export type BalanceQuery = NonNullable<LeaveBalancesListData['query']>

export const adminKeys = {
  departments: ['departments'] as const,
  usersAll: ['users'] as const,
  users: (query: UserQuery) => ['users', query] as const,
}

// --- Departments ------------------------------------------------------------

export function useDepartments() {
  return useQuery({ queryKey: adminKeys.departments, queryFn: () => unwrap(departmentsList()) })
}

function useInvalidate(queryKey: readonly unknown[]) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey })
}

export function useSaveDepartment() {
  const invalidate = useInvalidate(adminKeys.departments)
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: PatchedDepartmentWritable }) =>
      id
        ? unwrap(departmentsPartialUpdate({ path: { id }, body }))
        : unwrap(departmentsCreate({ body: body as DepartmentWritable })),
    onSuccess: invalidate,
  })
}

// --- Leave types --------------------------------------------------------------

export function useSaveLeaveType() {
  const invalidate = useInvalidate(leaveKeys.types)
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: PatchedLeaveTypeWritable }) =>
      id
        ? unwrap(leaveTypesPartialUpdate({ path: { id }, body }))
        : unwrap(leaveTypesCreate({ body: body as LeaveTypeWritable })),
    onSuccess: invalidate,
  })
}

// --- Users --------------------------------------------------------------------

export function useUsers(query: UserQuery) {
  return useQuery({
    queryKey: adminKeys.users(query),
    queryFn: () => unwrap(usersList({ query })),
    placeholderData: keepPreviousData,
  })
}

/** Up to 100 users for dropdowns (the API's maximum page size). */
export function useUserOptions(query: UserQuery = {}) {
  return useUsers({ ...query, page_size: 100 })
}

export function useSaveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: PatchedUserWritable }) =>
      id ? unwrap(usersPartialUpdate({ path: { id }, body })) : unwrap(usersCreate({ body: body as UserWritable })),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.usersAll }),
        // Role, manager or activity changes affect who sees and reviews requests.
        queryClient.invalidateQueries({ queryKey: leaveKeys.requestsAll }),
      ]),
  })
}

// --- Balances -----------------------------------------------------------------

export function useAdminBalances(query: BalanceQuery) {
  return useQuery({
    queryKey: [...leaveKeys.balancesAll, 'admin', query],
    queryFn: () => unwrap(leaveBalancesList({ query })),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateAllocation() {
  const invalidate = useInvalidate(leaveKeys.balancesAll)
  return useMutation({
    mutationFn: ({ id, allocated }: { id: number; allocated: string }) =>
      unwrap(leaveBalancesPartialUpdate({ path: { id }, body: { allocated } })),
    onSuccess: invalidate,
  })
}

export function useAllocateYear() {
  const invalidate = useInvalidate(leaveKeys.balancesAll)
  return useMutation({
    mutationFn: ({ year, dryRun }: { year: number; dryRun: boolean }) =>
      unwrap(leaveBalancesAllocateCreate({ body: { year, dry_run: dryRun } })),
    onSuccess: (_result, { dryRun }) => (dryRun ? undefined : invalidate()),
  })
}
