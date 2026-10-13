import { client } from './generated/client.gen'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// The generated client defaults to the schema's server URL; use the configured one.
client.setConfig({ baseUrl: API_BASE_URL })

/** An error response from the API, with the parsed body when there is one. */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(messageFromBody(body) ?? `Request failed (${status || 'network error'})`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  /** Field errors from a 400 response, e.g. { email: ['...'] }. */
  get fieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {}
    if (this.body && typeof this.body === 'object') {
      for (const [field, value] of Object.entries(this.body)) {
        if (field === 'detail' || field === 'code' || field === 'messages') continue
        errors[field] = Array.isArray(value) ? value.join(' ') : String(value)
      }
    }
    return errors
  }
}

function messageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const record = body as Record<string, unknown>
  if (typeof record.detail === 'string') return record.detail
  const nonField = record.non_field_errors
  if (Array.isArray(nonField) && nonField.length > 0) return nonField.join(' ')
  return undefined
}

type ApiResult<T> = { data?: T; error?: unknown; response?: Response }

/** Await a generated SDK call and return its data, throwing ApiError on failure. */
export async function unwrap<T>(request: Promise<ApiResult<T>>): Promise<T> {
  const { data, error, response } = await request
  if (error !== undefined || !response || !response.ok) {
    throw new ApiError(response?.status ?? 0, error)
  }
  return data as T
}

/** A user-facing message for any error thrown while calling the API. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fields = Object.values(error.fieldErrors)
    return messageFromBody(error.body) ?? (fields.length > 0 ? fields.join(' ') : error.message)
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
