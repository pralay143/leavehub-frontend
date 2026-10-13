import { Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Link } from 'react-router'

import { ErrorAlert, LoadingBlock } from '../components/QueryState'
import { useCurrentUser } from '../auth/context'
import { isApprover } from '../auth/roles'
import { useLeaveRequests, useMyBalances } from '../features/leave/api'
import { BalanceCards } from '../features/leave/BalanceCards'
import { currentYear, today } from '../features/leave/format'
import { LeaveRequestTable } from '../features/leave/LeaveRequestTable'
import { NewLeaveRequestModal } from '../features/leave/NewLeaveRequestModal'

export function DashboardPage() {
  const user = useCurrentUser()
  const year = currentYear()
  const [newOpened, newModal] = useDisclosure()

  const balances = useMyBalances(year, user.id)
  const mine = useLeaveRequests({ scope: 'mine' })
  const review = useLeaveRequests({ scope: 'review' }, { enabled: isApprover(user) })

  // Upcoming = pending or approved leave that has not ended yet, soonest first.
  const now = today()
  const upcoming = (mine.data?.results ?? [])
    .filter((r) => (r.status === 'PENDING' || r.status === 'APPROVED') && r.end_date >= now)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 5)

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={2}>Welcome, {user.first_name || user.full_name}</Title>
          <Text c="dimmed">Your leave for {year}</Text>
        </div>
        <Button onClick={newModal.open}>New request</Button>
      </Group>

      {isApprover(user) && review.data && (
        <Card withBorder padding="md">
          <Group justify="space-between">
            <Text>
              <Text span fw={700}>
                {review.data.count}
              </Text>{' '}
              {review.data.count === 1 ? 'request is' : 'requests are'} waiting for your review.
            </Text>
            <Button component={Link} to="/review" variant="light" size="xs">
              Open review inbox
            </Button>
          </Group>
        </Card>
      )}

      <Stack gap="sm">
        <Title order={4}>Balances</Title>
        {balances.isLoading ? (
          <LoadingBlock />
        ) : balances.error ? (
          <ErrorAlert error={balances.error} />
        ) : (
          <BalanceCards balances={balances.data ?? []} />
        )}
      </Stack>

      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={4}>Upcoming leave</Title>
          <Button component={Link} to="/requests" variant="subtle" size="xs">
            All my requests
          </Button>
        </Group>
        {mine.isLoading ? (
          <LoadingBlock />
        ) : mine.error ? (
          <ErrorAlert error={mine.error} />
        ) : (
          <LeaveRequestTable requests={upcoming} emptyText="No upcoming leave." />
        )}
      </Stack>

      <NewLeaveRequestModal opened={newOpened} onClose={newModal.close} />
    </Stack>
  )
}
