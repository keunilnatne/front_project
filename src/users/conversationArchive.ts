export type ConversationMessage = {
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export type Conversation = {
  id: string
  title: string
  updatedAt: string
  messages: ConversationMessage[]
  analysisStatus?: 'pending' | 'analyzing' | 'completed' | 'failed'
  styleAnalysis?: ConversationStyleAnalysis
}

export type ConversationStyleAnalysis = {
  tone: string
  writingStyle: string
  informationOrder: string
  detailLevel: string
  confidence: number
}

const CONVERSATIONS_KEY = 'ieum.conversations'

function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== 'object') return false
  const conversation = value as Partial<Conversation>

  return typeof conversation.id === 'string'
    && typeof conversation.title === 'string'
    && typeof conversation.updatedAt === 'string'
    && Array.isArray(conversation.messages)
    && conversation.messages.every((message) => (
      message
      && typeof message === 'object'
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
    ))
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
  // 백엔드 연동(대화 목록 조회): 이곳에서 현재 사용자의 전체 대화 목록 조회 API를 호출
  // 응답에는 analysisStatus와 styleAnalysis를 포함하고 최신 수정일 내림차순으로 반환
  signal?.throwIfAborted()
  return readLocalConversations().sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

export function normalizeAnalysisConfidence(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export async function deleteConversation(conversationId: string): Promise<void> {
  // 백엔드 연동(대화 삭제): 이곳에서 DELETE /api/users/me/conversations/:conversationId를 호출
  const remainingConversations = readLocalConversations().filter(({ id }) => id !== conversationId)
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(remainingConversations))
}

export async function saveConversation(conversation: Conversation): Promise<void> {
  // 백엔드 연동(대화 저장): 메시지를 주고받을 때 이 함수 대신 대화 생성/수정 API를 호출
  // 새 대화는 POST /api/users/me/conversations, 기존 대화는 PUT 또는 PATCH 요청으로 저장
  const conversations = readLocalConversations()
  const existingIndex = conversations.findIndex(({ id }) => id === conversation.id)

  if (existingIndex === -1) conversations.push(conversation)
  else conversations[existingIndex] = conversation

  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations))
}
