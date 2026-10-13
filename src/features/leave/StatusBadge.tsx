import { Badge } from '@mantine/core'

import type { StatusEnum } from '../../api/generated'
import { STATUS_META } from './format'

export function StatusBadge({ status }: { status: StatusEnum }) {
  const meta = STATUS_META[status]
  return (
    <Badge color={meta.color} variant="light">
      {meta.label}
    </Badge>
  )
}
