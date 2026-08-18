import { type AttachmentItem } from '../components/AttachmentPicker'

export type DraftItem = {
  id: string
  recipients?: Array<{
    id: string
    name: string
    position?: string
    role?: string
    company?: string
    email?: string
  }>
  subject: string
  body: string
  attachments?: AttachmentItem[]
  createdAt: string
  updatedAt?: string
}

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'message-drafts'

function getAuthToken(): string | null {
  return (
    localStorage.getItem('ieum.token') ||
    localStorage.getItem('ieum.accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  )
}

function authorizationHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function readLocalDrafts(): DraftItem[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function persistLocalDrafts(drafts: DraftItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export async function fetchDrafts(signal?: AbortSignal): Promise<DraftItem[]> {
  signal?.throwIfAborted()
  try {
    const token = getAuthToken()
    if (token) {
      const response = await fetch(`${API_URL}/api/messages/drafts`, {
        signal,
        headers: authorizationHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          // Merge local attachments if server doesn't store full base64
          const locals = readLocalDrafts()
          const merged = data.map((d: DraftItem) => {
            const local = locals.find((l) => l.id === d.id)
            return {
              ...d,
              attachments: d.attachments || local?.attachments || [],
            }
          })
          persistLocalDrafts(merged)
          return merged
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return readLocalDrafts()
}

export async function saveDraftToServer(draft: {
  id?: string
  subject: string
  body: string
  recipients?: any[]
  attachments?: AttachmentItem[]
}): Promise<DraftItem> {
  const fallbackDraft: DraftItem = {
    id: draft.id || Date.now().toString(),
    subject: draft.subject,
    body: draft.body,
    recipients: draft.recipients || [],
    attachments: draft.attachments || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  try {
    const token = getAuthToken()
    if (token) {
      const response = await fetch(`${API_URL}/api/messages/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeaders(),
        },
        body: JSON.stringify(draft),
      })
      if (response.ok) {
        const saved = await response.json()
        const fullSaved: DraftItem = {
          ...saved,
          attachments: draft.attachments || [],
        }
        const current = readLocalDrafts().filter((d) => d.id !== fullSaved.id)
        persistLocalDrafts([fullSaved, ...current])
        return fullSaved
      }
    }
  } catch {
    // offline fallback
  }

  const current = readLocalDrafts().filter((d) => d.id !== fallbackDraft.id)
  persistLocalDrafts([fallbackDraft, ...current])
  return fallbackDraft
}

export async function deleteDraftFromServer(id: string): Promise<void> {
  try {
    const token = getAuthToken()
    if (token) {
      await fetch(`${API_URL}/api/messages/drafts/${id}`, {
        method: 'DELETE',
        headers: authorizationHeaders(),
      })
    }
  } catch {
    // ignore
  }
  const current = readLocalDrafts().filter((d) => d.id !== id)
  persistLocalDrafts(current)
}
