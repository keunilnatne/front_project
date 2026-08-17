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
  responseSpeed: string
  averageResponseMinutes: number
  collaborationActivity: string
  isOnline: boolean
  isFavorite: boolean
  isRecent: boolean
  verifiedExpert: boolean
  fullTime: boolean
  avatar: string
}

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'ieum.recipients'

function isRecipient(value: unknown): value is Recipient {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Recipient>
  return typeof item.id === 'number'
    && typeof item.name === 'string'
    && (item.email === undefined || typeof item.email === 'string')
    && typeof item.role === 'string'
    && typeof item.company === 'string'
    && typeof item.country === 'string'
    && typeof item.language === 'string'
    && typeof item.timezone === 'string'
    && typeof item.organizationRelation === 'string'
    && typeof item.responseSpeed === 'string'
    && typeof item.averageResponseMinutes === 'number'
    && typeof item.collaborationActivity === 'string'
    && typeof item.isOnline === 'boolean'
    && typeof item.isFavorite === 'boolean'
    && typeof item.isRecent === 'boolean'
    && typeof item.verifiedExpert === 'boolean'
    && typeof item.fullTime === 'boolean'
    && typeof item.avatar === 'string'
}

function readLocalRecipients(): Recipient[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(data) ? data.filter(isRecipient) : []
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
    const response = await fetch(`${API_URL}/api/recipients`, { signal })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const recipients = data.filter(isRecipient)
      persistRecipients(recipients)
      return recipients
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return readLocalRecipients()
}

export async function createRecipient(recipient: Recipient): Promise<Recipient> {
  let saved = recipient
  try {
    const response = await fetch(`${API_URL}/api/recipients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipient),
    })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (isRecipient(data)) saved = data
  } catch {
    // 백엔드가 준비되지 않은 환경에서는 로컬 저장소를 사용한다.
  }

  const recipients = readLocalRecipients()
  persistRecipients([saved, ...recipients.filter((item) => item.id !== saved.id)])
  return saved
}
