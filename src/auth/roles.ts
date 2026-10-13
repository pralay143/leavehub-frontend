import type { Me, RoleEnum } from '../api/generated'

/** HR staff: the HR role or a superuser (mirrors the backend's is_hr). */
export function isHR(user: Me): boolean {
  return user.is_superuser || user.role === 'HR'
}

/** Users who can review leave: managers and HR staff. */
export function isApprover(user: Me): boolean {
  return isHR(user) || user.role === 'MANAGER'
}

export const ROLE_LABELS: Record<RoleEnum, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  HR: 'HR',
}
