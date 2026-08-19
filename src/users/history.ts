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
import { reportApiFailure, requireOk } from './apiClient'
import { readUserStorage, writeUserStorage } from './storage'

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
    const data: unknown = JSON.parse(readUserStorage(STORAGE_KEY) || '[]')
    return Array.isArray(data) ? data.filter(isHistoryItem) : []
  } catch {
    return []
  }
}

function persistHistory(items: HistoryItem[]) {
  writeUserStorage(STORAGE_KEY, JSON.stringify(items))
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
    await requireOk(response, '이력을 불러오지 못했습니다.')
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const history = data.filter(isHistoryItem)
      persistHistory(history)
      return history
    }
    throw new Error('서버가 올바르지 않은 이력 목록을 반환했습니다.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : '이력을 불러오지 못했습니다.', true)
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
    await requireOk(response, '이력 상세를 불러오지 못했습니다.')
    const data: unknown = await response.json()
    if (!isHistoryItem(data)) throw new Error('서버가 올바르지 않은 이력 상세를 반환했습니다.')
    return data
  } catch (error) {
    reportApiFailure(error instanceof Error ? error.message : '이력 상세를 불러오지 못했습니다.', true)
    const local = readLocalHistory().find((item) => item.id === id)
    return local || null
  }
}

export async function createHistoryItem(item: HistoryItem): Promise<HistoryItem> {
  const response = await fetch(`${API_URL}/api/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
    body: JSON.stringify(item),
  })
  await requireOk(response, '이력을 저장하지 못했습니다.')
  const data: unknown = await response.json()
  if (!isHistoryItem(data)) throw new Error('서버가 올바르지 않은 이력 데이터를 반환했습니다.')
  persistHistory([data, ...readLocalHistory().filter((entry) => entry.id !== data.id)])
  return data
}

export async function deleteHistoryItem(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/history/${id}`, {
      method: 'DELETE',
      headers: authorizationHeaders(),
    })
    await requireOk(response, '이력을 삭제하지 못했습니다.')
    persistHistory(readLocalHistory().filter((entry) => entry.id !== id))
    return true
  } catch (error) {
    reportApiFailure(error instanceof Error ? error.message : '이력을 삭제하지 못했습니다.')
    throw error
  }
}
