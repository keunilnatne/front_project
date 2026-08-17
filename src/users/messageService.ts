import type { Recipient } from './recipients'

const API_URL = import.meta.env.VITE_API_URL || ''

function getAuthToken(): string | null {
  return (
    localStorage.getItem('ieum.token') ||
    localStorage.getItem('ieum.accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  )
}

function authorizationHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type MessagePayload = {
  recipients: Recipient[]
  subject: string
  body: string
}

export type OptimizedMessage = {
  subject: string
  body: string
  score?: number
  explanation?: string
}

export async function optimizeMessage(payload: MessagePayload): Promise<OptimizedMessage> {
  const response = await fetch(`${API_URL}/api/messages/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('AI 메시지 최적화에 실패했습니다.')
  const data: unknown = await response.json()
  if (!data || typeof data !== 'object') throw new Error('AI 응답 형식이 올바르지 않습니다.')

  // 단일 또는 다중 수신자 응답 포맷 지원
  const resObj = data as any
  const firstResult = Array.isArray(resObj.results) ? resObj.results[0] : resObj

  const finalSubject = firstResult?.optimizedSubject || resObj.subject || payload.subject
  const finalBody = firstResult?.optimizedBody || resObj.body || payload.body

  return {
    subject: finalSubject,
    body: finalBody,
    score: typeof firstResult?.qualityScore === 'number' ? firstResult.qualityScore : resObj.score,
    explanation: firstResult?.explanation || resObj.explanation,
  }
}

export async function sendMessage(payload: MessagePayload & {
  originalSubject?: string
  originalBody?: string
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('메시지 전송에 실패했습니다.')
}
