import { authorizationHeaders } from './authStorage'
import { reportApiFailure, requireOk } from './apiClient'
import { readUserStorage, writeUserStorage } from './storage'

export type NoticeItem = {
  id: string | number
  title: string
  subtitle?: string | null
  content: string
  tag?: string | null
  createdAt: string
  updatedAt?: string
}

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'ieum.notices'

export async function fetchNotices(): Promise<NoticeItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/notices`, {
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(),
      },
    })
    await requireOk(res, '새로운 소식을 불러오지 못했습니다.')
    const data = await res.json()
    if (Array.isArray(data)) {
      writeUserStorage(STORAGE_KEY, JSON.stringify(data))
      return data
    }
    throw new Error('서버가 올바르지 않은 새로운 소식 목록을 반환했습니다.')
  } catch (error) {
    reportApiFailure(error instanceof Error ? error.message : '새로운 소식을 불러오지 못했습니다.', true)
  }

  return getNotices()
}

export function getNotices(): NoticeItem[] {
  try {
    const raw = readUserStorage(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((notice) => String(notice?.id || '') !== 'notice-default-1')
      : []
  } catch {
    return []
  }
}

export async function saveNotice(notice: Omit<NoticeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<NoticeItem> {
  const res = await fetch(`${API_URL}/api/notices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify(notice),
  })
  await requireOk(res, '새로운 소식을 등록하지 못했습니다.')
  const created = await res.json()
  const current = getNotices().filter((n) => n.id !== created.id)
  writeUserStorage(STORAGE_KEY, JSON.stringify([created, ...current]))
  return created
}

export async function deleteNotice(id: string | number): Promise<void> {
  const response = await fetch(`${API_URL}/api/notices/${id}`, {
    method: 'DELETE',
    headers: {
      ...authorizationHeaders(),
    },
  })
  await requireOk(response, '새로운 소식을 삭제하지 못했습니다.')

  const list = getNotices().filter((n) => String(n.id) !== String(id))
  writeUserStorage(STORAGE_KEY, JSON.stringify(list))
}
