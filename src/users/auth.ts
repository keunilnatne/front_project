import { setAuthToken } from './authStorage'

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
  try {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, email: normalizeEmail(input.email) }),
    })
    if (!response.ok) {
      if (response.status === 400 || response.status === 409) {
        const data = await response.json().catch(() => null) as { message?: string; error?: { message?: string } } | null
        const msg = data?.message || data?.error?.message
        if (msg && (msg.includes('가입된') || msg.includes('존재') || msg.includes('already'))) {
          throw new Error('이미 등록된 이메일 계정입니다. 해당 계정으로 로그인해 주세요.')
        }
        throw new Error(msg || '이미 가입된 이메일이거나 입력 정보가 올바르지 않습니다.')
      }
      throw await responseError(response, '회원가입에 실패했습니다.')
    }

    const data = await response.json() as AuthResponse
    const token = data.accessToken || data.token
    if (!token) throw new Error('회원가입 응답에 인증 토큰이 없습니다.')
    setAuthToken(token)
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('서버와 통신할 수 없습니다. 네트워크 연결을 확인해 주세요.', { cause: error })
    }
    throw error
  }
}

export async function authenticateAccount(email: string, password: string): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  })
  if (response.status === 401) return false
  if (!response.ok) throw await responseError(response, '로그인 처리 중 문제가 발생했습니다.')

  const data = await response.json() as AuthResponse
  const token = data.accessToken || data.token
  if (!token) throw new Error('로그인 응답에 인증 토큰이 없습니다.')

  setAuthToken(token)
  return true
}
