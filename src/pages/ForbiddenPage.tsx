import { Button, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

export function ForbiddenPage() {
  return (
    <Stack gap="sm" align="flex-start">
      <Title order={2}>No access</Title>
      <Text c="dimmed">Your role does not have access to this page.</Text>
      <Button component={Link} to="/" variant="light">
        Go to dashboard
      </Button>
    </Stack>
  )
}
