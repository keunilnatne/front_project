const API_URL = import.meta.env.VITE_API_URL || ''

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

export async function fetchInboxMessages(q?: string): Promise<InboxMessage[]> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  params.set('maxResults', '25')

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

  return data.map((item: any) => {
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
    }
  })
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
  }
}
