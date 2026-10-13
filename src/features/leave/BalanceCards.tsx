import { Card, Group, Progress, SimpleGrid, Text } from '@mantine/core'

import type { LeaveBalance } from '../../api/generated'
import { formatDays } from './format'

export function BalanceCards({ balances }: { balances: LeaveBalance[] }) {
  if (balances.length === 0) {
    return <Text c="dimmed">No leave balances have been allocated for this year yet. Contact HR.</Text>
  }

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }}>
      {balances.map((balance) => {
        const allocated = Number(balance.allocated)
        const used = Number(balance.used)
        const pending = Number(balance.pending)
        const percent = (value: number) => (allocated > 0 ? (value / allocated) * 100 : 0)
        return (
          <Card key={balance.id} withBorder padding="lg">
            <Text size="sm" c="dimmed" fw={500}>
              {balance.leave_type.name}
            </Text>
            <Text fz={32} fw={700} lh={1.2} mt={4}>
              {Number(balance.available)}
              <Text span size="sm" c="dimmed" fw={400}>
                {' '}
                of {allocated} available
              </Text>
            </Text>
            <Progress.Root size="sm" mt="md">
              <Progress.Section value={percent(used)} color="teal" />
              <Progress.Section value={percent(pending)} color="yellow" />
            </Progress.Root>
            <Group justify="space-between" mt="xs">
              <Text size="xs" c="dimmed">
                Used {formatDays(used)}
              </Text>
              <Text size="xs" c="dimmed">
                Pending {formatDays(pending)}
              </Text>
            </Group>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}
