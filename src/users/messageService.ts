import type { Recipient } from './recipients'

const API_URL = import.meta.env.VITE_API_URL || ''

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('AI 메시지 최적화에 실패했습니다.')
  const data: unknown = await response.json()
  if (!data || typeof data !== 'object') throw new Error('AI 응답 형식이 올바르지 않습니다.')
  const result = data as Partial<OptimizedMessage>
  if (typeof result.subject !== 'string' || typeof result.body !== 'string') {
    throw new Error('AI 응답에 최적화된 메시지가 없습니다.')
  }
  return {
    subject: result.subject,
    body: result.body,
    score: typeof result.score === 'number' ? result.score : undefined,
    explanation: typeof result.explanation === 'string' ? result.explanation : undefined,
  }
}

export async function sendMessage(payload: MessagePayload & {
  originalSubject?: string
  originalBody?: string
}): Promise<void> {
  const response = await fetch(`${API_URL}/api/messages/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('메시지 전송에 실패했습니다.')
}
