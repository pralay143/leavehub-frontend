import { Alert, Center, Loader } from '@mantine/core'

import { errorMessage } from '../api/client'

export function LoadingBlock() {
  return (
    <Center py="xl">
      <Loader size="sm" />
    </Center>
  )
}

export function ErrorAlert({ error, title = 'Could not load data' }: { error: unknown; title?: string }) {
  return (
    <Alert color="red" variant="light" title={title}>
      {errorMessage(error)}
    </Alert>
  )
}
