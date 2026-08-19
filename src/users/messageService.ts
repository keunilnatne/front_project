import type { Recipient } from './recipients'
import { authorizationHeaders } from './authStorage'

const API_URL = import.meta.env.VITE_API_URL || ''

export type MessageAttachment = {
  id?: string
  name: string
  size: number
  type: string
  data: string
}

export type MessagePayload = {
  recipients: Recipient[]
  subject: string
  body: string
  attachments?: MessageAttachment[]
}

export type OptimizedMessage = {
  messageId?: number
  messageResultId?: number
  subject: string
  body: string
  score?: number
  explanation?: string
}

type OptimizeResultResponse = {
  id?: number
  messageResultId?: number
  optimizedSubject?: string
  optimizedBody?: string
  subject?: string
  body?: string
  qualityScore?: number
  explanation?: string
}

type OptimizeApiResponse = OptimizeResultResponse & {
  messageId?: number
  score?: number
  results?: OptimizeResultResponse[]
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as { message?: string; error?: { message?: string } } | null
    throw new Error(errorData?.message || errorData?.error?.message || 'AI 메시지 최적화에 실패했습니다.')
  }
  const data: unknown = await response.json()
  if (!data || typeof data !== 'object') throw new Error('AI 응답 형식이 올바르지 않습니다.')

  const resObj = data as OptimizeApiResponse
  const firstResult = Array.isArray(resObj.results) ? resObj.results[0] : resObj

  const finalSubject = firstResult?.optimizedSubject || firstResult?.subject || resObj.subject || payload.subject
  const finalBody = firstResult?.optimizedBody || firstResult?.body || resObj.body || payload.body

  return {
    messageId: typeof resObj.messageId === 'number' ? resObj.messageId : undefined,
    messageResultId: typeof (firstResult?.id ?? resObj.messageResultId) === 'number' ? (firstResult?.id ?? resObj.messageResultId) : undefined,
    subject: finalSubject,
    body: finalBody,
    score: typeof firstResult?.qualityScore === 'number' ? firstResult.qualityScore : resObj.score,
    explanation: firstResult?.explanation || resObj.explanation,
  }
}

export async function sendMessage(payload: MessagePayload & {
  originalSubject?: string
  originalBody?: string
  messageId?: number
  messageResultId?: number
}): Promise<unknown> {
  const response = await fetch(`${API_URL}/api/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null) as {
      message?: string
      error?: { code?: string; message?: string }
      code?: string
    } | null

    const code = errorData?.code || errorData?.error?.code
    if (code === 'GMAIL_NOT_CONNECTED') {
      throw new Error('Gmail 계정이 연동되지 않았습니다. [설정] 메뉴 또는 구글 로그인으로 계정을 연동해주세요.')
    }
    throw new Error(errorData?.message || errorData?.error?.message || '메시지 전송에 실패했습니다.')
  }

  return response.json().catch(() => ({ success: true }))
}
