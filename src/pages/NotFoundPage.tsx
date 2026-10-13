import { Button, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <Stack gap="sm" align="flex-start">
      <Title order={2}>Page not found</Title>
      <Text c="dimmed">The page you are looking for does not exist.</Text>
      <Button component={Link} to="/" variant="light">
        Go to dashboard
      </Button>
    </Stack>
  )
}
