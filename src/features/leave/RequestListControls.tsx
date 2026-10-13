import { Group, Pagination, Select } from '@mantine/core'

import { STATUS_OPTIONS, currentYear } from './format'
import { PAGE_SIZE, type RequestListParams } from './useRequestListParams'

export function RequestFilters({ list }: { list: RequestListParams }) {
  const year = currentYear()
  const yearOptions = [
    { value: 'all', label: 'All years' },
    ...[year + 1, year, year - 1, year - 2].map((y) => ({ value: String(y), label: String(y) })),
  ]

  return (
    <Group gap="sm">
      <Select
        aria-label="Status"
        placeholder="All statuses"
        data={STATUS_OPTIONS}
        value={list.status ?? null}
        onChange={(value) => list.update({ status: value })}
        clearable
        w={180}
      />
      <Select
        aria-label="Year"
        data={yearOptions}
        value={list.yearParam}
        onChange={(value) => list.update({ year: value ?? String(year) })}
        allowDeselect={false}
        w={140}
      />
    </Group>
  )
}

export function RequestPagination({ list, count }: { list: RequestListParams; count: number | undefined }) {
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1
  if (totalPages <= 1) return null
  return <Pagination value={list.page} total={totalPages} onChange={(value) => list.update({ page: String(value) })} />
}
