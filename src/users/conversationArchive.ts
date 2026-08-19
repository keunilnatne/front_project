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
import { reportApiFailure, requireOk } from './apiClient'
import { readUserStorage, writeUserStorage } from './storage'

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
    const savedData: unknown = JSON.parse(readUserStorage(CONVERSATIONS_KEY) || '[]')
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
    await requireOk(response, '대화 목록을 불러오지 못했습니다.')
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const items = data.filter(isConversation)
      writeUserStorage(CONVERSATIONS_KEY, JSON.stringify(items))
      return items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    }
    throw new Error('서버가 올바르지 않은 대화 목록을 반환했습니다.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : '대화 목록을 불러오지 못했습니다.', true)
  }
  return readLocalConversations().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

export function normalizeAnalysisConfidence(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: authorizationHeaders(),
  })
  await requireOk(response, '대화를 삭제하지 못했습니다.')
  const remainingConversations = readLocalConversations().filter(({ id }) => id !== conversationId)
  writeUserStorage(CONVERSATIONS_KEY, JSON.stringify(remainingConversations))
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  const conversations = readLocalConversations()
  const existingIndex = conversations.findIndex(({ id }) => id === conversation.id)

  if (existingIndex === -1) conversations.push(conversation)
  else conversations[existingIndex] = conversation

  writeUserStorage(CONVERSATIONS_KEY, JSON.stringify(conversations))
}
