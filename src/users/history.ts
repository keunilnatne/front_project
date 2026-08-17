export type HistoryItem = {
  id: string
  date: string
  recipient: string
  purpose: string
  score: number
  status: string
  type: string
  createdAt: string
  content?: string
}

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'ieum.history'

function isHistoryItem(value: unknown): value is HistoryItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<HistoryItem>
  return typeof item.id === 'string' && typeof item.date === 'string'
    && typeof item.recipient === 'string' && typeof item.purpose === 'string'
    && typeof item.score === 'number' && typeof item.status === 'string'
    && typeof item.type === 'string' && typeof item.createdAt === 'string'
    && (item.content === undefined || typeof item.content === 'string')
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

export async function fetchHistory(signal?: AbortSignal): Promise<HistoryItem[]> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/history`, { signal })
    if (!response.ok) throw new Error()
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

export async function createHistoryItem(item: HistoryItem): Promise<HistoryItem> {
  let saved = item
  try {
    const response = await fetch(`${API_URL}/api/history`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
    })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (isHistoryItem(data)) saved = data
  } catch {
    // API가 없는 환경에서는 로컬 기록을 유지한다.
  }
  persistHistory([saved, ...readLocalHistory().filter((entry) => entry.id !== saved.id)])
  return saved
}
