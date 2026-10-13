import dayjs from 'dayjs'

import type { StatusEnum } from '../../api/generated'

export const STATUS_META: Record<StatusEnum, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'yellow' },
  APPROVED: { label: 'Approved', color: 'teal' },
  REJECTED: { label: 'Rejected', color: 'red' },
  CANCELLED: { label: 'Cancelled', color: 'gray' },
}

export const STATUS_OPTIONS = (Object.keys(STATUS_META) as StatusEnum[]).map((status) => ({
  value: status,
  label: STATUS_META[status].label,
}))

export function formatDate(value: string): string {
  return dayjs(value).format('D MMM YYYY')
}

export function formatDateTime(value: string): string {
  return dayjs(value).format('D MMM YYYY, HH:mm')
}

export function formatDateRange(start: string, end: string, halfDay = false): string {
  if (start === end) return `${formatDate(start)}${halfDay ? ' (half day)' : ''}`
  const sameYear = dayjs(start).year() === dayjs(end).year()
  return `${dayjs(start).format(sameYear ? 'D MMM' : 'D MMM YYYY')} – ${formatDate(end)}`
}

/** "1 day", "0.5 days", "3 days" from an API decimal string or number. */
export function formatDays(days: string | number): string {
  const value = Number(days)
  const text = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${text} ${value === 1 ? 'day' : 'days'}`
}

/** Working days (Monday to Friday) in a range, matching the backend's count. */
export function countWorkingDays(start: string, end: string, halfDay = false): number {
  const first = dayjs(start)
  const last = dayjs(end)
  if (last.isBefore(first)) return 0
  const isWeekday = (day: dayjs.Dayjs) => day.day() !== 0 && day.day() !== 6
  if (halfDay) return isWeekday(first) ? 0.5 : 0
  let count = 0
  for (let day = first; !day.isAfter(last); day = day.add(1, 'day')) {
    if (isWeekday(day)) count += 1
  }
  return count
}

export function currentYear(): number {
  return dayjs().year()
}

export function today(): string {
  return dayjs().format('YYYY-MM-DD')
}
