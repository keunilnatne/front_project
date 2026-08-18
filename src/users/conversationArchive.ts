export type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export type Conversation = {
  id: string
  title: string
  subject?: string
  body?: string
  recipientName?: string
  recipientEmail?: string
  updatedAt: string
  messages: ConversationMessage[]
  analysisStatus?: 'pending' | 'analyzing' | 'completed' | 'failed'
  styleAnalysis?: ConversationStyleAnalysis
}

import { authorizationHeaders } from './authStorage'

export type ConversationStyleAnalysis = {
  tone: string
  writingStyle: string
  informationOrder: string
  detailLevel: string
  confidence: number
}

const API_URL = import.meta.env.VITE_API_URL || ''
const CONVERSATIONS_KEY = 'ieum.conversations'

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false
  const conversation = value as Partial<Conversation>

  return typeof conversation.id === 'string'
    && typeof conversation.title === 'string'
    && typeof conversation.updatedAt === 'string'
    && Array.isArray(conversation.messages)
}

function readLocalConversations(): Conversation[] {
  try {
    const savedData: unknown = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]')
    return Array.isArray(savedData) ? savedData.filter(isConversation) : []
  } catch {
    return []
  }
}

export async function fetchConversations(signal?: AbortSignal): Promise<Conversation[]> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/conversations`, {
      signal,
      headers: authorizationHeaders(),
    })
    if (response.ok) {
      const data: unknown = await response.json()
      if (Array.isArray(data)) {
        const items = data.filter(isConversation)
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(items))
        return items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return readLocalConversations().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

export function normalizeAnalysisConfidence(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: authorizationHeaders(),
    })
  } catch {
    // ignore
  }
  const remainingConversations = readLocalConversations().filter(({ id }) => id !== conversationId)
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(remainingConversations))
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const conversations = readLocalConversations()
  const existingIndex = conversations.findIndex(({ id }) => id === conversation.id)

  if (existingIndex === -1) conversations.push(conversation)
  else conversations[existingIndex] = conversation

  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
}
