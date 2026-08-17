import { useCallback, useEffect, useState } from 'react'

export type Recipient = {
  id: number
  email?: string
  name: string
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

function isRecipient(value: unknown): value is Recipient {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Recipient>
  return typeof item.id === 'number'
    && typeof item.name === 'string'
    && typeof item.role === 'string'
    && typeof item.company === 'string'
    && typeof item.country === 'string'
    && typeof item.language === 'string'
    && typeof item.timezone === 'string'
    && typeof item.organizationRelation === 'string'
    && typeof item.averageResponseMinutes === 'number'
    && typeof item.isOnline === 'boolean'
    && typeof item.isFavorite === 'boolean'
    && typeof item.isRecent === 'boolean'
    && typeof item.verifiedExpert === 'boolean'
    && typeof item.fullTime === 'boolean'
    && typeof item.avatar === 'string'
}

function readLocalRecipients(): Recipient[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(isRecipient) : []
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
    const response = await fetch(`${API_URL}/api/recipients`, {
      signal,
      headers: authorizationHeaders(),
    })
    if (!response.ok) throw await apiError(response, '수신자 조회 실패')
    const data: unknown = await response.json()
    if (!Array.isArray(data)) throw new Error('수신자 응답 형식 오류')
    const recipients = data.filter(isRecipient)
    if (recipients.length) {
      persistRecipients(recipients)
      return recipients
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }

  return readLocalRecipients()
}

export type CreateRecipientInput = Omit<Recipient, 'id'> & { email: string }

export async function createRecipient(recipient: CreateRecipientInput): Promise<Recipient> {
  const response = await fetch(`${API_URL}/api/recipients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
    body: JSON.stringify(recipient),
  })
  if (!response.ok) throw await apiError(response, '수신자 저장에 실패했습니다.')
  const data: unknown = await response.json()
  if (!isRecipient(data)) throw new Error('수신자 응답 형식 오류')
  const current = readLocalRecipients().filter((item) => item.id !== data.id)
  persistRecipients([data, ...current])
  return data
}

export async function fetchIeumUserProfile(email: string): Promise<Recipient> {
  const response = await fetch(
    `${API_URL}/api/users/lookup?email=${encodeURIComponent(email.trim())}`,
    { headers: authorizationHeaders() },
  )
  if (!response.ok) throw await apiError(response, '이음에 가입된 회원을 찾을 수 없습니다.')
  const data: unknown = await response.json()
  return data as Recipient
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
  const data: unknown = await response.json()
  if (!isRecipient(data)) throw new Error('수신자 응답 형식 오류')
  persistRecipients(readLocalRecipients().map((item) => item.id === data.id ? data : item))
  return data
}

export function useRecipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    void fetchRecipients(controller.signal)
      .then(setRecipients)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setErrorMessage('수신자 목록을 불러오지 못했습니다.')
        }
      })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [])

  const replaceRecipients = useCallback((next: Recipient[]) => {
    setRecipients(next)
    persistRecipients(next)
  }, [])

  return { recipients, setRecipients: replaceRecipients, isLoading, errorMessage }
}
