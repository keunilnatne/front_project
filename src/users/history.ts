export type HistoryItem = {
  id: string
  messageId?: string
  date: string
  recipient: string
  recipientEmail?: string | null
  purpose: string
  score: number
  status: string
  type?: '변환' | '전송' | string
  subject?: string
  content?: string
  originalSubject?: string
  originalBody?: string
  error?: string | null
  createdAt?: string
  sentAt?: string | null
}

import { authorizationHeaders } from './authStorage'

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'ieum.history'

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<HistoryItem>
  return typeof item.id === 'string'
    && typeof item.date === 'string'
    && typeof item.recipient === 'string'
    && typeof item.purpose === 'string'
    && typeof item.score === 'number'
    && typeof item.status === 'string'
}

function readLocalHistory(): HistoryItem[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(data) ? data.filter(isHistoryItem) : []
  } catch {
    return []
  }
}

function persistHistory(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export async function fetchHistory(signal?: AbortSignal, type?: string, q?: string): Promise<HistoryItem[]> {
  signal?.throwIfAborted()
  try {
    const params = new URLSearchParams()
    if (type && type !== 'all' && type !== '전체') {
      params.set('type', type === '변환 기록' || type === 'converted' ? 'converted' : 'sent')
    }
    if (q) params.set('q', q)

    const url = `${API_URL}/api/history${params.toString() ? `?${params.toString()}` : ''}`
    const response = await fetch(url, {
      signal,
      headers: authorizationHeaders(),
    })
    if (!response.ok) throw new Error('이력 조회 실패')
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const history = data.filter(isHistoryItem)
      persistHistory(history)
      return history
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return readLocalHistory()
}

export async function fetchHistoryDetail(id: string, signal?: AbortSignal): Promise<HistoryItem | null> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/history/${id}`, {
      signal,
      headers: authorizationHeaders(),
    })
    if (!response.ok) return null
    const data: unknown = await response.json()
    return isHistoryItem(data) ? data : null
  } catch {
    const local = readLocalHistory().find((item) => item.id === id)
    return local || null
  }
}

export async function createHistoryItem(item: HistoryItem): Promise<HistoryItem> {
  let saved = item
  try {
    const response = await fetch(`${API_URL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
      body: JSON.stringify(item),
    })
    if (response.ok) {
      const data: unknown = await response.json()
      if (isHistoryItem(data)) saved = data
    }
  } catch {
    // API 미연결 시 로컬 유지
  }
  persistHistory([saved, ...readLocalHistory().filter((entry) => entry.id !== saved.id)])
  return saved
}
