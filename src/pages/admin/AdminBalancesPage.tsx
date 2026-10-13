import {
  Alert,
  Button,
  Group,
  Modal,
  NumberInput,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'

import { errorMessage } from '../../api/client'
import type { AllocationResult, LeaveBalance } from '../../api/generated'
import { ErrorAlert, LoadingBlock } from '../../components/QueryState'
import { useAdminBalances, useAllocateYear, useUpdateAllocation, useUserOptions } from '../../features/admin/api'
import { useLeaveTypes } from '../../features/leave/api'
import { currentYear } from '../../features/leave/format'

const PAGE_SIZE = 20

export function AdminBalancesPage() {
  const thisYear = currentYear()
  const [year, setYear] = useState(String(thisYear))
  const [employee, setEmployee] = useState<string | null>(null)
  const [leaveType, setLeaveType] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<LeaveBalance | null>(null)
  const [allocating, setAllocating] = useState(false)

  const balances = useAdminBalances({
    year: Number(year),
    employee: employee ? Number(employee) : undefined,
    leave_type: leaveType ? Number(leaveType) : undefined,
    page,
  })
  const users = useUserOptions()
  const leaveTypes = useLeaveTypes()

  const yearOptions = [thisYear + 1, thisYear, thisYear - 1, thisYear - 2].map((y) => ({ value: String(y), label: String(y) }))
  const totalPages = balances.data ? Math.max(1, Math.ceil(balances.data.count / PAGE_SIZE)) : 1
  const withPageReset = (setter: (value: string | null) => void) => (value: string | null) => {
    setter(value)
    setPage(1)
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Balances</Title>
        <Button onClick={() => setAllocating(true)}>Allocate year</Button>
      </Group>

      <Group gap="sm">
        <Select aria-label="Year" data={yearOptions} value={year} onChange={withPageReset((v) => setYear(v ?? String(thisYear)))} allowDeselect={false} w={110} />
        <Select
          placeholder="All employees"
          data={(users.data?.results ?? []).map((u) => ({ value: String(u.id), label: `${u.full_name} (${u.email})` }))}
          value={employee}
          onChange={withPageReset(setEmployee)}
          searchable
          clearable
          w={280}
        />
        <Select
          placeholder="All leave types"
          data={(leaveTypes.data ?? []).filter((t) => t.requires_balance !== false).map((t) => ({ value: String(t.id), label: t.name }))}
          value={leaveType}
          onChange={withPageReset(setLeaveType)}
          clearable
          w={180}
        />
      </Group>

      {balances.isLoading ? (
        <LoadingBlock />
      ) : balances.error ? (
        <ErrorAlert error={balances.error} />
      ) : balances.data?.results.length === 0 ? (
        <Text c="dimmed">No balances for these filters. Use “Allocate year” to create them.</Text>
      ) : (
        <Table.ScrollContainer minWidth={720}>
          <Table highlightOnHover verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Employee</Table.Th>
                <Table.Th>Leave type</Table.Th>
                <Table.Th ta="right">Allocated</Table.Th>
                <Table.Th ta="right">Used</Table.Th>
                <Table.Th ta="right">Pending</Table.Th>
                <Table.Th ta="right">Available</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {balances.data?.results.map((balance) => (
                <Table.Tr key={balance.id}>
                  <Table.Td>{balance.employee.full_name}</Table.Td>
                  <Table.Td>{balance.leave_type.name}</Table.Td>
                  <Table.Td ta="right">{Number(balance.allocated)}</Table.Td>
                  <Table.Td ta="right">{Number(balance.used)}</Table.Td>
                  <Table.Td ta="right">{Number(balance.pending)}</Table.Td>
                  <Table.Td ta="right" fw={600}>
                    {Number(balance.available)}
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Button size="xs" variant="subtle" onClick={() => setEditing(balance)}>
                        Edit
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      {totalPages > 1 && <Pagination value={page} total={totalPages} onChange={setPage} />}

      {editing && <AllocationModal balance={editing} onClose={() => setEditing(null)} />}
      {allocating && <AllocateYearModal defaultYear={thisYear} onClose={() => setAllocating(false)} />}
    </Stack>
  )
}

function AllocationModal({ balance, onClose }: { balance: LeaveBalance; onClose: () => void }) {
  const update = useUpdateAllocation()
  const used = Number(balance.used)
  const [allocated, setAllocated] = useState<number | string>(Number(balance.allocated))
  const [error, setError] = useState<string | null>(null)

  const value = Number(allocated)
  const invalid = allocated === '' || Number.isNaN(value) ? 'Enter a number' : value < used ? `Cannot be less than days already used (${used})` : null

  const submit = () => {
    if (invalid) return
    setError(null)
    update.mutate(
      { id: balance.id, allocated: String(value) },
      {
        onSuccess: () => {
          notifications.show({ color: 'teal', message: 'Allocation updated.' })
          onClose()
        },
        onError: (err) => setError(errorMessage(err)),
      },
    )
  }

  return (
    <Modal opened onClose={onClose} title="Edit allocation">
      <Stack>
        <Text size="sm">
          {balance.employee.full_name} · {balance.leave_type.name} · {balance.year}
        </Text>
        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}
        <NumberInput
          label="Allocated days"
          description={`Used ${used}, pending ${Number(balance.pending)}.`}
          min={0}
          step={0.5}
          decimalScale={1}
          value={allocated}
          onChange={setAllocated}
          error={invalid}
          data-autofocus
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={update.isPending} disabled={Boolean(invalid)}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function AllocateYearModal({ defaultYear, onClose }: { defaultYear: number; onClose: () => void }) {
  const [year, setYear] = useState<number | string>(defaultYear)
  const preview = useAllocateYear()
  const allocate = useAllocateYear()
  const [result, setResult] = useState<AllocationResult | null>(null)
  const yearNumber = Number(year)
  const validYear = Number.isInteger(yearNumber) && yearNumber >= 2000 && yearNumber <= 2100
  const { mutate: runPreview, reset: resetPreview } = preview

  // Dry run whenever the year changes, so HR sees what will happen before confirming.
  useEffect(() => {
    if (validYear) runPreview({ year: yearNumber, dryRun: true })
    else resetPreview()
  }, [validYear, yearNumber, runPreview, resetPreview])

  const confirm = () =>
    allocate.mutate(
      { year: yearNumber, dryRun: false },
      {
        onSuccess: (data) => {
          setResult(data)
          notifications.show({ color: 'teal', message: `Created ${data.created} balance(s) for ${data.year}.` })
        },
      },
    )

  const plan = preview.data
  return (
    <Modal opened onClose={onClose} title="Allocate yearly balances">
      <Stack>
        <Text size="sm" c="dimmed">
          Creates missing balances for every active user and every active leave type that uses a balance, using each
          type's default days. Existing balances are never changed.
        </Text>
        <NumberInput
          label="Year"
          min={2000}
          max={2100}
          value={year}
          onChange={(value) => {
            setYear(value)
            setResult(null)
          }}
          allowDecimal={false}
        />
        {preview.isPending && <Text size="sm">Checking…</Text>}
        {preview.error && (
          <Alert color="red" variant="light">
            {errorMessage(preview.error)}
          </Alert>
        )}
        {allocate.error && (
          <Alert color="red" variant="light">
            {errorMessage(allocate.error)}
          </Alert>
        )}
        {result ? (
          <Alert color="teal" variant="light">
            Created {result.created} balance(s) for {result.year}.
          </Alert>
        ) : (
          plan && (
            <Alert color={plan.to_create > 0 ? 'blue' : 'gray'} variant="light">
              {plan.to_create > 0
                ? `${plan.to_create} balance(s) will be created for ${plan.year}`
                : `Nothing to create: all balances for ${plan.year} already exist`}{' '}
              ({plan.active_users} active user(s) × {plan.leave_types} leave type(s); {plan.already_existed} already
              exist).
            </Alert>
          )
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={confirm} loading={allocate.isPending} disabled={!plan || plan.to_create === 0 || preview.isPending}>
              Allocate
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}
