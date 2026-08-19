import { authorizationHeaders } from './authStorage'

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

export const defaultNotices: NoticeItem[] = [
  {
    id: 'notice-default-1',
    title: '더 편리해진 이음을 만나보세요',
    subtitle: '성능 개선과 새로운 기능으로 더 나은 경험을 제공합니다.',
    tag: 'new',
    content: `• 실시간 비즈니스 메시지 AI 최적화 지원
• 조직 맞춤형 Company DNA 자동 분석 탑재
• 수신자별 맞춤형 문체 및 어조 조율 강화
• Gmail 실시간 수신함 연동 및 스마트 AI 일정 추출`,
    createdAt: new Date().toISOString(),
  },
]

export async function fetchNotices(): Promise<NoticeItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/notices`, {
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(),
      },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        return data
      }
    }
  } catch {
    // network / offline fallback
  }

  return getNotices()
}

export function getNotices(): NoticeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultNotices))
      return defaultNotices
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultNotices
  } catch {
    return defaultNotices
  }
}

export async function saveNotice(notice: Omit<NoticeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<NoticeItem> {
  try {
    const res = await fetch(`${API_URL}/api/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(),
      },
      body: JSON.stringify(notice),
    })
    if (res.ok) {
      const created = await res.json()
      const current = getNotices().filter((n) => n.id !== created.id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...current]))
      return created
    }
  } catch {
    // offline fallback
  }

  const list = getNotices()
  const newItem: NoticeItem = {
    id: `notice-${Date.now()}`,
    ...notice,
    createdAt: new Date().toISOString(),
  }
  const next = [newItem, ...list]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return newItem
}

export async function deleteNotice(id: string | number): Promise<void> {
  try {
    await fetch(`${API_URL}/api/notices/${id}`, {
      method: 'DELETE',
      headers: {
        ...authorizationHeaders(),
      },
    })
  } catch {
    // ignore
  }

  const list = getNotices().filter((n) => String(n.id) !== String(id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.length > 0 ? list : defaultNotices))
}
