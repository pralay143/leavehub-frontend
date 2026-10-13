import { useSearchParams } from 'react-router'

import type { StatusEnum } from '../../api/generated'
import { currentYear } from './format'

export const PAGE_SIZE = 20

/** Status, year and page filters for a request list, kept in the URL. */
export function useRequestListParams() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as StatusEnum | null) ?? undefined
  const yearParam = params.get('year') ?? String(currentYear())
  const page = Math.max(1, Number(params.get('page')) || 1)

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next, { replace: true })
  }

  return {
    params,
    status,
    yearParam,
    year: yearParam === 'all' ? undefined : Number(yearParam),
    page,
    update,
  }
}

export type RequestListParams = ReturnType<typeof useRequestListParams>
