export type RegisterInput = {
  name: string
  email: string
  password: string
}

type AuthResponse = {
  accessToken?: string
  token?: string
}

const API_URL = import.meta.env.VITE_API_URL || ''

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function responseError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null) as {
    message?: string
    error?: { message?: string }
  } | null
  return new Error(data?.message || data?.error?.message || fallback)
}

export async function registerAccount(input: RegisterInput): Promise<void> {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, email: normalizeEmail(input.email) }),
  })
  if (!response.ok) throw await responseError(response, '회원가입에 실패했습니다.')
}

export async function authenticateAccount(email: string, password: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  })
  if (!response.ok) return false

  const data = await response.json() as AuthResponse
  const token = data.accessToken || data.token
  if (!token) throw new Error('로그인 응답에 인증 토큰이 없습니다.')

  localStorage.setItem('ieum.accessToken', token)
  localStorage.setItem('ieum.token', token)
  return true
}
