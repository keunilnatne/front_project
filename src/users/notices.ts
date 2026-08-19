export type NoticeItem = {
  id: string
  title: string
  subtitle?: string
  content: string
  tag?: string
  createdAt: string
}

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

export function saveNotice(notice: Omit<NoticeItem, 'id' | 'createdAt'>): NoticeItem {
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

export function deleteNotice(id: string): void {
  const list = getNotices().filter((n) => n.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.length > 0 ? list : defaultNotices))
}
