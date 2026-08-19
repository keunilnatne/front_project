import { authorizationHeaders } from '../users/authStorage'

export type RecipientAIProfile = {
  tags: string[]
  terms: string[]
  rules: string[]
  tone?: string
  style?: string
  emoji?: string
}

export type MessageAIContext = {
  tags: string[]
  terms: string[]
  rules: string[]
}

const API_URL = import.meta.env.VITE_API_URL || ''

async function postAI<T>(path: string, payload: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
      body: JSON.stringify(payload),
    })
    if (!response.ok) return null
    const data: unknown = await response.json()
    return data && typeof data === 'object' ? data as T : null
  } catch {
    return null
  }
}

export async function analyzeRecipient(recipient: unknown): Promise<RecipientAIProfile | null> {
  return postAI<RecipientAIProfile>('/api/ai/recipients/analyze', { recipient })
}

export async function analyzeMessageMetadata(payload: unknown): Promise<{
  priority?: string
  tags?: string[]
  terms?: string[]
  rules?: string[]
  sourceLanguage?: string
  targetLanguage?: string
} | null> {
  return postAI('/api/ai/messages/metadata', payload)
}
