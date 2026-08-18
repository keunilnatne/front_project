export type NotificationItem = {
  id: string
  type: 'mail' | 'learning' | 'system'
  title: string
  description: string
  createdAt: string
  read: boolean
}

const STORAGE_KEY = 'ieum-notifications'

function read(): NotificationItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...read()].slice(0, 50)))
  window.dispatchEvent(new Event('notifications-updated'))
  return next
}

export function addNotificationIfAbsent(item: NotificationItem) {
  const current = read()
  if (current.some((n) => n.id === item.id)) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...current].slice(0, 50)))
  window.dispatchEvent(new Event('notifications-updated'))
}

export function markNotificationsRead() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(read().map((item) => ({ ...item, read: true }))))
  window.dispatchEvent(new Event('notifications-updated'))
}
