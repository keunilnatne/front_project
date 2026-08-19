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

import { getAuthToken, authorizationHeaders } from './authStorage'
import { reportApiFailure, requireOk } from './apiClient'
import { readUserStorage, writeUserStorage } from './storage'

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'message-drafts'

function readLocalDrafts(): DraftItem[] {
  try {
    const data = JSON.parse(readUserStorage(STORAGE_KEY) || '[]')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function persistLocalDrafts(drafts: DraftItem[]) {
  writeUserStorage(STORAGE_KEY, JSON.stringify(drafts))
}

export async function fetchDrafts(signal?: AbortSignal): Promise<DraftItem[]> {
  signal?.throwIfAborted()
  try {
    const token = getAuthToken()
    if (!token) throw new Error('로그인 정보가 없습니다.')
    const response = await fetch(`${API_URL}/api/messages/drafts`, {
      signal,
      headers: authorizationHeaders(),
    })
    await requireOk(response, '임시저장 목록을 불러오지 못했습니다.')
    const data = await response.json()
    if (Array.isArray(data)) {
      // 첨부파일 원본은 서버에 저장하지 않으므로 동일 사용자의 로컬 첨부만 병합한다.
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
    throw new Error('서버가 올바르지 않은 임시저장 목록을 반환했습니다.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : '임시저장 목록을 불러오지 못했습니다.', true)
  }
  return readLocalDrafts()
}

export async function saveDraftToServer(draft: {
  id?: string
  subject: string
  body: string
  recipients?: DraftItem['recipients']
  attachments?: AttachmentItem[]
}): Promise<DraftItem> {
  if (!getAuthToken()) throw new Error('로그인 정보가 없습니다. 다시 로그인해 주세요.')
  const response = await fetch(`${API_URL}/api/messages/drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify(draft),
  })
  await requireOk(response, '임시저장에 실패했습니다.')
  const saved = await response.json()
  const fullSaved: DraftItem = {
    ...saved,
    attachments: draft.attachments || [],
  }
  const current = readLocalDrafts().filter((d) => d.id !== fullSaved.id)
  persistLocalDrafts([fullSaved, ...current])
  return fullSaved
}

export async function deleteDraftFromServer(id: string): Promise<void> {
  if (!getAuthToken()) throw new Error('로그인 정보가 없습니다. 다시 로그인해 주세요.')
  const response = await fetch(`${API_URL}/api/messages/drafts/${id}`, {
    method: 'DELETE',
    headers: authorizationHeaders(),
  })
  await requireOk(response, '임시저장을 삭제하지 못했습니다.')
  const current = readLocalDrafts().filter((d) => d.id !== id)
  persistLocalDrafts(current)
}
