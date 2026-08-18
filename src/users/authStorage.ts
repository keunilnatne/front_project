// 토큰 및 인증 스토리지 표준 유틸리티
const ACCESS_TOKEN_KEY = 'ieum.accessToken'
const LEGACY_TOKEN_KEYS = ['ieum.token', 'token', 'accessToken'] as const

export function getAuthToken(): string | null {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) return token

  for (const key of LEGACY_TOKEN_KEYS) {
    const legacy = localStorage.getItem(key)
    if (legacy) {
      localStorage.setItem(ACCESS_TOKEN_KEY, legacy)
      return legacy
    }
  }
  return null
}

export function setAuthToken(token: string): void {
  if (!token) return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  localStorage.setItem('ieum.token', token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key)
  }
}

export function authorizationHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function handle401Unauthorized(): void {
  clearAuthToken()
  if (typeof window !== 'undefined' && window.location.pathname !== '/sign-in') {
    window.location.href = '/sign-in'
  }
}
