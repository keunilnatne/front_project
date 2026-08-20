import { getAuthToken, authorizationHeaders } from './authStorage'
import { readUserStorage, writeUserStorage } from './storage'
import { requireOk } from './apiClient'

const API_URL = import.meta.env.VITE_API_URL || ''

export type InboxAttachment = {
  id: string
  name: string
  filename?: string
  mimeType: string
  size: number
  attachmentId?: string
  messageId: string
}

export type InboxMessage = {
  id: string
  threadId?: string
  subject: string
  from: string
  fromName: string
  fromEmail: string
  date: string
  snippet: string
  body?: string
  htmlBody?: string
  attachments?: InboxAttachment[]
}

export type GmailStatus = {
  connected: boolean
  email: string | null
}

export function deduplicateInboxMessages(messages: InboxMessage[]): InboxMessage[] {
  const seen = new Set<string>()
  return messages.filter((message) => {
    const messageId = String(message.id || '').trim()
    if (!messageId || seen.has(messageId)) return false
    seen.add(messageId)
    return true
  })
}

function parseSender(fromStr: string): { name: string; email: string } {
  if (!fromStr) return { name: '알 수 없음', email: '' }
  const match = fromStr.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/)
  if (match) {
    const name = match[1]?.trim() || match[2]?.split('@')[0] || fromStr
    const email = match[2]?.trim() || ''
    return { name, email }
  }
  return { name: fromStr.split('@')[0] || fromStr, email: fromStr.includes('@') ? fromStr : '' }
}

export async function getGmailStatus(): Promise<GmailStatus> {
  const response = await fetch(`${API_URL}/api/gmail/status`, {
    headers: authorizationHeaders(),
    cache: 'no-store',
  })
  await requireOk(response, 'Gmail 연결 상태를 확인하지 못했습니다.')

  const data = await response.json() as Partial<GmailStatus>
  return {
    connected: data.connected === true,
    email: data.email || null,
  }
}

const INBOX_CACHE_KEY = 'ieum.inboxCache'

export function getCachedInboxMessages(): InboxMessage[] {
  try {
    const raw = readUserStorage(INBOX_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? deduplicateInboxMessages(parsed as InboxMessage[]) : []
  } catch {
    return []
  }
}

export function saveCachedInboxMessages(messages: InboxMessage[]): void {
  try {
    writeUserStorage(INBOX_CACHE_KEY, JSON.stringify(deduplicateInboxMessages(messages)))
  } catch {
    // ignore
  }
}

export async function fetchInboxMessages(q?: string): Promise<InboxMessage[]> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  params.set('maxResults', '50')

  const url = `${API_URL}/api/gmail/messages${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url, {
    headers: authorizationHeaders(),
  })

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('GMAIL_NOT_CONNECTED')
    }
    await requireOk(response, '받은 메일 목록을 불러오는 데 실패했습니다.')
  }

  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('서버가 올바르지 않은 받은 메일 목록을 반환했습니다.')

  const list = deduplicateInboxMessages(data.map((rawItem: unknown) => {
    const item = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>
    const from = String(item.from || '')
    const { name, email } = parseSender(from)
    return {
      id: String(item.id || ''),
      threadId: item.threadId ? String(item.threadId) : undefined,
      subject: String(item.subject || '(제목 없음)'),
      from,
      fromName: name,
      fromEmail: email,
      date: String(item.date || ''),
      snippet: String(item.snippet || ''),
      body: String(item.body || ''),
      attachments: Array.isArray(item.attachments) ? item.attachments as InboxAttachment[] : [],
    }
  }))

  if (!q && list.length > 0) {
    saveCachedInboxMessages(list)
  }

  return list
}

export async function fetchInboxMessageDetail(messageId: string): Promise<InboxMessage> {
  const response = await fetch(`${API_URL}/api/gmail/messages/${messageId}`, {
    headers: authorizationHeaders(),
  })

  await requireOk(response, '메일 상세 내용을 불러오지 못했습니다.')

  const rawItem: unknown = await response.json()
  const item = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>
  const from = String(item.from || '')
  const { name, email } = parseSender(from)

  return {
    id: String(item.id),
    threadId: item.threadId ? String(item.threadId) : undefined,
    subject: String(item.subject || '(제목 없음)'),
    from,
    fromName: name,
    fromEmail: email,
    date: String(item.date || ''),
    snippet: String(item.snippet || ''),
    body: String(item.body || item.snippet || ''),
    htmlBody: String(item.htmlBody || ''),
    attachments: (Array.isArray(item.attachments) ? item.attachments : []).map((rawAttachment: unknown) => {
      const att = (rawAttachment && typeof rawAttachment === 'object' ? rawAttachment : {}) as Record<string, unknown>
      return {
      id: String(att.id || att.attachmentId || ''),
      name: String(att.name || att.filename || '첨부파일'),
      filename: String(att.filename || att.name || '첨부파일'),
      mimeType: String(att.mimeType || 'application/octet-stream'),
      size: Number(att.size) || 0,
      attachmentId: String(att.attachmentId || att.id || ''),
      messageId: String(item.id),
    }}),
  }
}

export async function downloadInboxAttachment(messageId: string, attachment: InboxAttachment): Promise<void> {
  const token = getAuthToken()
  const params = new URLSearchParams()
  if (attachment.name || attachment.filename) {
    params.set('filename', attachment.name || attachment.filename || 'attachment')
  }
  if (attachment.mimeType) {
    params.set('mimeType', attachment.mimeType)
  }

  const attachmentId = attachment.attachmentId || attachment.id
  const url = `${API_URL}/api/gmail/messages/${messageId}/attachments/${attachmentId}?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) {
      alert('첨부파일을 다운로드할 수 없습니다.')
      return
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = attachment.name || attachment.filename || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    alert('첨부파일 다운로드 중 오류가 발생했습니다.')
  }
}

export type ExtractedScheduleResult = {
  hasSchedule: boolean
  quote: string
  title: string
  dateTime: string
  source: string
}

export async function extractScheduleFromAi(message: {
  id?: string
  subject: string
  body?: string
  snippet?: string
  from?: string
  date?: string
}): Promise<ExtractedScheduleResult> {
  try {
    const response = await fetch(`${API_URL}/api/gmail/schedule/extract`, {
      method: 'POST',
      headers: {
        ...authorizationHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: message.subject,
        body: message.body || message.snippet,
        snippet: message.snippet,
        from: message.from,
        date: message.date,
      }),
    })
    if (response.ok) {
      const data = await response.json()
      return {
        hasSchedule: data.hasSchedule !== false,
        quote: data.quote || '',
        title: data.title || message.subject || '업무 일정',
        dateTime: data.dateTime || '',
        source: data.source || '메일 내용 기반',
      }
    }
  } catch {
    // fallback
  }

  return {
    hasSchedule: true,
    quote: message.snippet || message.subject || '',
    title: message.subject || '업무 일정',
    dateTime: '일정 확인 필요',
    source: '메일 내용 기반',
  }
}
