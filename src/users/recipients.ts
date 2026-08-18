export type Recipient = {
  id: number
  name: string
  email?: string
  role: string
  company: string
  country: string
  language: string
  timezone: string
  organizationRelation: string
  responseSpeed: '빠름' | '보통' | '느림' | string
  averageResponseMinutes: number
  collaborationActivity: 'High' | 'Medium' | 'Low' | string
  isOnline: boolean
  isFavorite: boolean
  isRecent: boolean
  verifiedExpert: boolean
  fullTime: boolean
  avatar: string
  communicationStyle?: string[]
  preferredStyle?: string
}

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'recipients-data'

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

async function apiError(response: Response, fallback: string) {
  if (response.status === 401) {
    return new Error('로그인이 필요합니다. 먼저 로그인해주세요.')
  }
  const data = await response.json().catch(() => null) as { message?: string; error?: { message?: string } } | null
  return new Error(data?.message || data?.error?.message || fallback)
}

function normalizeRecipient(item: any): Recipient {
  return {
    id: Number(item.id),
    name: String(item.name || ''),
    email: item.email || '',
    role: item.role || item.jobRole || item.position || '',
    company: item.company || '',
    country: item.country || 'South Korea',
    language: item.language || 'Korean',
    timezone: item.timezone || 'Asia/Seoul',
    organizationRelation: item.organizationRelation || item.relationship || '팀원',
    responseSpeed: item.responseSpeed || '보통',
    averageResponseMinutes: Number(item.averageResponseMinutes || 0),
    collaborationActivity: item.collaborationActivity || 'Medium',
    isOnline: Boolean(item.isOnline),
    isFavorite: Boolean(item.isFavorite),
    isRecent: item.isRecent !== undefined ? Boolean(item.isRecent) : true,
    verifiedExpert: Boolean(item.verifiedExpert),
    fullTime: item.fullTime !== undefined ? Boolean(item.fullTime) : true,
    avatar: item.avatar || (item.name ? String(item.name).slice(0, 1) : '?'),
    communicationStyle: Array.isArray(item.communicationStyle) ? item.communicationStyle : [],
    preferredStyle: item.preferredStyle || '',
  }
}

function isRecipient(value: unknown): value is Recipient {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Recipient>
  return typeof item.id === 'number' && typeof item.name === 'string'
}

function readLocalRecipients(): Recipient[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(isRecipient).map(normalizeRecipient) : []
  } catch {
    return []
  }
}

export function persistRecipients(recipients: Recipient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipients))
}

export async function fetchRecipients(signal?: AbortSignal): Promise<Recipient[]> {
  signal?.throwIfAborted()
  try {
    const token = getAuthToken()
    if (token) {
      const response = await fetch(`${API_URL}/api/recipients`, {
        signal,
        headers: authorizationHeaders(),
      })
      if (response.ok) {
        const data: unknown = await response.json()
        if (Array.isArray(data)) {
          const recipients = data.map(normalizeRecipient)
          persistRecipients(recipients)
          return recipients
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }

  return readLocalRecipients()
}

export type CreateRecipientInput = Omit<Recipient, 'id'> & {
  email: string
  communicationStyle?: string[]
  preferredStyle?: string
}

export async function createRecipient(recipient: CreateRecipientInput): Promise<Recipient> {
  const response = await fetch(`${API_URL}/api/recipients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
    body: JSON.stringify(recipient),
  })
  if (!response.ok) throw await apiError(response, '수신자 저장에 실패했습니다.')
  const item: any = await response.json()
  const data = normalizeRecipient(item)
  const current = readLocalRecipients().filter((r) => r.id !== data.id)
  persistRecipients([data, ...current])
  return data
}

export async function fetchIeumUserProfile(email: string): Promise<Recipient> {
  const response = await fetch(
    `${API_URL}/api/users/lookup?email=${encodeURIComponent(email.trim())}`,
    { headers: authorizationHeaders() },
  )
  if (!response.ok) throw await apiError(response, '이음에 가입된 회원을 찾을 수 없습니다.')
  const data = await response.json()
  return normalizeRecipient(data)
}

export async function fetchRecipientByEmail(email: string): Promise<Recipient> {
  return fetchIeumUserProfile(email)
}

export async function updateRecipient(recipient: Recipient): Promise<Recipient> {
  const response = await fetch(`${API_URL}/api/recipients/${recipient.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
    body: JSON.stringify(recipient),
  })
  if (!response.ok) throw new Error('수신자 수정에 실패했습니다.')
  const data = await response.json()
  const normalized = normalizeRecipient(data)
  const current = readLocalRecipients().map((r) => (r.id === normalized.id ? normalized : r))
  persistRecipients(current)
  return normalized
}

export async function toggleRecipientFavorite(id: number): Promise<Recipient | null> {
  try {
    const response = await fetch(`${API_URL}/api/recipients/${id}/favorite`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
    })
    if (response.ok) {
      const data = await response.json()
      const normalized = normalizeRecipient(data)
      const current = readLocalRecipients().map((r) => (r.id === normalized.id ? normalized : r))
      persistRecipients(current)
      return normalized
    }
  } catch {
    // offline fallback
  }

  const current = readLocalRecipients()
  const target = current.find((r) => r.id === id)
  if (target) {
    const updated = { ...target, isFavorite: !target.isFavorite }
    persistRecipients(current.map((r) => (r.id === id ? updated : r)))
    return updated
  }
  return null
}

export async function deleteRecipient(id: number): Promise<void> {
  try {
    await fetch(`${API_URL}/api/recipients/${id}`, {
      method: 'DELETE',
      headers: authorizationHeaders(),
    })
  } catch {
    // ignore
  }
  const current = readLocalRecipients().filter((r) => r.id !== id)
  persistRecipients(current)
}
