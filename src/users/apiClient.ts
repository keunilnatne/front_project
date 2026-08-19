import { handle401Unauthorized } from './authStorage'

export type ApiStatusDetail = {
  state: 'ok' | 'error'
  message?: string
  usingCachedData?: boolean
}

function emit(detail: ApiStatusDetail) {
  window.dispatchEvent(new CustomEvent<ApiStatusDetail>('ieum-api-status', { detail }))
}

export function reportApiFailure(message: string, usingCachedData = false) {
  emit({ state: 'error', message, usingCachedData })
}

export async function apiError(response: Response, fallback: string): Promise<Error> {
  const data = await response.json().catch(() => null) as {
    message?: string
    error?: { message?: string }
  } | null
  const message = data?.message || data?.error?.message || fallback
  if (response.status === 401) handle401Unauthorized()
  reportApiFailure(message)
  return new Error(message)
}

export async function requireOk(response: Response, fallback: string): Promise<Response> {
  if (!response.ok) throw await apiError(response, fallback)
  return response
}
