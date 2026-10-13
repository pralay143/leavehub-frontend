import { Alert, Button, Checkbox, Group, Modal, Select, Stack, Text, Textarea } from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import { useState } from 'react'

import { ApiError, errorMessage } from '../../api/client'
import { useCurrentUser } from '../../auth/context'
import { useCreateLeaveRequest, useLeaveTypes, useMyBalances } from './api'
import { countWorkingDays, currentYear, formatDays } from './format'

type FormValues = {
  leaveType: string | null
  dates: DatesRangeValue<string>
  halfDay: boolean
  reason: string
}

export function NewLeaveRequestModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const user = useCurrentUser()
  const create = useCreateLeaveRequest()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    initialValues: { leaveType: null, dates: [null, null], halfDay: false, reason: '' },
    validate: {
      leaveType: (value) => (value ? null : 'Choose a leave type'),
      dates: ([start, end]) => (start && end ? null : 'Choose the first and last day'),
    },
  })

  const [start, end] = form.values.dates
  const sameDay = Boolean(start && end && start === end)
  const year = start ? dayjs(start).year() : currentYear()

  const leaveTypes = useLeaveTypes()
  const balances = useMyBalances(year, user.id)
  const availableByType = new Map((balances.data ?? []).map((b) => [b.leave_type.id, Number(b.available)]))

  const typeOptions = (leaveTypes.data ?? [])
    .filter((type) => type.is_active !== false)
    .map((type) => {
      const available = availableByType.get(type.id)
      const hint =
        type.requires_balance === false
          ? 'no balance needed'
          : available === undefined
            ? `no ${year} balance`
            : `${formatDays(available)} available`
      return { value: String(type.id), label: `${type.name} (${hint})` }
    })

  const days = start && end ? countWorkingDays(start, end, form.values.halfDay && sameDay) : null
  const spansYears = Boolean(start && end && dayjs(start).year() !== dayjs(end).year())

  const close = () => {
    form.reset()
    setFormError(null)
    onClose()
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setFormError(null)
    const [startDate, endDate] = values.dates
    try {
      await create.mutateAsync({
        leave_type: Number(values.leaveType),
        start_date: startDate!,
        end_date: endDate!,
        half_day: values.halfDay && startDate === endDate,
        reason: values.reason.trim(),
      })
      notifications.show({ color: 'teal', message: 'Leave request submitted.' })
      close()
    } catch (error) {
      if (error instanceof ApiError) {
        const fields = error.fieldErrors
        form.setErrors({
          leaveType: fields.leave_type,
          dates: fields.start_date ?? fields.end_date ?? fields.half_day,
          reason: fields.reason,
        })
        if (Object.keys(fields).length > 0 && !(error.body as { detail?: string })?.detail) return
      }
      setFormError(errorMessage(error))
    }
  })

  return (
    <Modal opened={opened} onClose={close} title="New leave request" size="md">
      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          {formError && (
            <Alert color="red" variant="light">
              {formError}
            </Alert>
          )}
          <Select
            label="Leave type"
            placeholder="Choose a leave type"
            data={typeOptions}
            disabled={leaveTypes.isLoading}
            {...form.getInputProps('leaveType')}
          />
          <DatePickerInput
            type="range"
            allowSingleDateInRange
            label="Dates"
            placeholder="First and last day"
            valueFormat="D MMM YYYY"
            clearable
            {...form.getInputProps('dates')}
            onChange={(value) => {
              form.setFieldValue('dates', value)
              if (!value[0] || value[0] !== value[1]) form.setFieldValue('halfDay', false)
            }}
          />
          <Checkbox
            label="Half day"
            description={sameDay ? undefined : 'Only for a single-day request'}
            disabled={!sameDay}
            {...form.getInputProps('halfDay', { type: 'checkbox' })}
          />
          {days !== null &&
            (spansYears ? (
              <Text size="sm" c="red">
                A request cannot span two years. Submit a separate request for each year.
              </Text>
            ) : days === 0 ? (
              <Text size="sm" c="red">
                The selected dates contain no working days.
              </Text>
            ) : (
              <Text size="sm" c="dimmed">
                {formatDays(days)} (weekdays only)
              </Text>
            ))}
          <Textarea label="Reason" placeholder="Optional" autosize minRows={2} maxLength={2000} {...form.getInputProps('reason')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Submit request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
