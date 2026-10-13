import { ApiError, errorMessage } from '../api/client'

/**
 * Put an API error on a form: field errors go to the matching fields
 * (`fieldMap` renames API fields to form fields), and anything else is
 * returned as a message to show above the form.
 */
export function applyApiError(
  error: unknown,
  setErrors: (errors: Record<string, string>) => void,
  formFields: readonly string[],
  fieldMap: Record<string, string> = {},
): string | null {
  if (!(error instanceof ApiError)) return errorMessage(error)

  const fieldErrors: Record<string, string> = {}
  const unmatched: string[] = []
  for (const [apiField, message] of Object.entries(error.fieldErrors)) {
    const field = fieldMap[apiField] ?? apiField
    if (formFields.includes(field)) fieldErrors[field] = message
    else unmatched.push(message)
  }
  setErrors(fieldErrors)

  const detail = (error.body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (unmatched.length > 0) return unmatched.join(' ')
  return Object.keys(fieldErrors).length > 0 ? null : error.message
}
