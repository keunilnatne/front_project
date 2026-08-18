export type NotificationItem = {
  id: string
  type: 'mail' | 'learning' | 'system'
  title: string
  description: string
  createdAt: string
  read: boolean
}

const STORAGE_KEY = 'ieum-notifications'

export function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0
  const parsed = Date.parse(dateStr)
  if (!isNaN(parsed)) return parsed
  const clean = dateStr.replace(/\./g, '-').trim()
  const p2 = Date.parse(clean)
  return isNaN(p2) ? 0 : p2
}

function read(): NotificationItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt))
  } catch {
    return []
  }
}

export function getNotifications(): NotificationItem[] {
  return read()
}

export function addNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) {
  const next: NotificationItem = {
    ...item,
    id: `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    read: false,
  }
  const current = read().filter((n) => n.id !== next.id)
  const merged = [next, ...current].sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)).slice(0, 50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  window.dispatchEvent(new Event('notifications-updated'))
  return next
}

export function addNotificationIfAbsent(item: NotificationItem) {
  const current = read()
  if (current.some((n) => n.id === item.id)) return
  const merged = [item, ...current].sort((a, b) => parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)).slice(0, 50)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  window.dispatchEvent(new Event('notifications-updated'))
}

export function markNotificationsRead() {
  const current = read()
  const updated = current.map((item) => ({ ...item, read: true }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('notifications-updated'))
}
