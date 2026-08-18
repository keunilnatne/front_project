import { getAuthToken, authorizationHeaders } from './authStorage'

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
  try {
    const response = await fetch(`${API_URL}/api/gmail/status`, {
      headers: authorizationHeaders(),
    })
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // fallback
  }
  return { connected: false, email: null }
}

const INBOX_CACHE_KEY = 'ieum.inboxCache'

export function getCachedInboxMessages(): InboxMessage[] {
  try {
    const raw = localStorage.getItem(INBOX_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCachedInboxMessages(messages: InboxMessage[]): void {
  try {
    localStorage.setItem(INBOX_CACHE_KEY, JSON.stringify(messages))
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
    throw new Error('받은 메일 목록을 불러오는 데 실패했습니다.')
  }

  const data = await response.json()
  if (!Array.isArray(data)) return []

  const list = data.map((item: any) => {
    const { name, email } = parseSender(item.from || '')
    return {
      id: String(item.id),
      threadId: item.threadId ? String(item.threadId) : undefined,
      subject: item.subject || '(제목 없음)',
      from: item.from || '',
      fromName: name,
      fromEmail: email,
      date: item.date || '',
      snippet: item.snippet || '',
      body: item.body || '',
      attachments: item.attachments || [],
    }
  })

  if (!q && list.length > 0) {
    saveCachedInboxMessages(list)
  }

  return list
}

export async function fetchInboxMessageDetail(messageId: string): Promise<InboxMessage> {
  const response = await fetch(`${API_URL}/api/gmail/messages/${messageId}`, {
    headers: authorizationHeaders(),
  })

  if (!response.ok) {
    throw new Error('메일 상세 내용을 불러오지 못했습니다.')
  }

  const item = await response.json()
  const { name, email } = parseSender(item.from || '')

  return {
    id: String(item.id),
    threadId: item.threadId ? String(item.threadId) : undefined,
    subject: item.subject || '(제목 없음)',
    from: item.from || '',
    fromName: name,
    fromEmail: email,
    date: item.date || '',
    snippet: item.snippet || '',
    body: item.body || item.snippet || '',
    htmlBody: item.htmlBody || '',
    attachments: (item.attachments || []).map((att: any) => ({
      id: String(att.id || att.attachmentId || ''),
      name: att.name || att.filename || '첨부파일',
      filename: att.filename || att.name || '첨부파일',
      mimeType: att.mimeType || 'application/octet-stream',
      size: Number(att.size) || 0,
      attachmentId: att.attachmentId || att.id,
      messageId: String(item.id),
    })),
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
