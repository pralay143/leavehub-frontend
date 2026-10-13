import { Stack, Text, Title } from '@mantine/core'

/** Temporary page for routes whose features are built in later steps. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Stack gap="xs">
      <Title order={2}>{title}</Title>
      <Text c="dimmed">Coming soon.</Text>
    </Stack>
  )
}
