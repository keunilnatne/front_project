export type HistoryItem = {
  id: string
  date: string
  recipient: string
  purpose: string
  score: number
  status: string
  type?: '변환' | '전송' | string
  createdAt?: string
  content?: string
}

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

function writeLocalHistory(data: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export async function fetchHistory(signal?: AbortSignal): Promise<HistoryItem[]> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/history`, { signal })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const history = data.filter(isHistoryItem)
      writeLocalHistory(history)
      return history
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return readLocalHistory()
}

export async function createHistoryItem(item: HistoryItem): Promise<HistoryItem> {
  try {
    const response = await fetch(`${API_URL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (isHistoryItem(data)) {
      writeLocalHistory([data, ...readLocalHistory().filter((entry) => entry.id !== data.id)])
      return data
    }
  } catch {
    // API 연결 전에는 동일한 데이터 모델을 localStorage에 보존한다.
  }

  writeLocalHistory([item, ...readLocalHistory().filter((entry) => entry.id !== item.id)])
  return item
}