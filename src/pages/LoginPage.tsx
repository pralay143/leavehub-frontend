import { Alert, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useState } from 'react'
import { type Location, Navigate, useLocation, useNavigate } from 'react-router'

import { errorMessage } from '../api/client'
import { FullPageLoader } from '../auth/guards'
import { useAuth } from '../auth/context'

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: Location } | null)?.from
  const redirectTo = from ? `${from.pathname}${from.search}` : '/'

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value.trim()) ? null : 'Enter a valid email address'),
      password: (value) => (value ? null : 'Enter your password'),
    },
  })

  if (status === 'loading') return <FullPageLoader />
  if (status === 'authenticated') return <Navigate to={redirectTo} replace />

  const handleSubmit = form.onSubmit(async ({ email, password }) => {
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" w="100%" maw={400}>
        <form onSubmit={handleSubmit} noValidate>
          <Stack>
            <div>
              <Title order={2}>LeaveHub</Title>
              <Text c="dimmed" size="sm">
                Log in with your work email.
              </Text>
            </div>
            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}
            <TextInput
              label="Email"
              type="email"
              autoComplete="username"
              autoFocus
              {...form.getInputProps('email')}
            />
            <PasswordInput label="Password" autoComplete="current-password" {...form.getInputProps('password')} />
            <Button type="submit" loading={submitting} fullWidth>
              Log in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  )
}
