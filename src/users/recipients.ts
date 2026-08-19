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
  responseSpeed?: '빠름' | '보통' | '느림' | string | null
  averageResponseMinutes?: number | null
  collaborationActivity?: 'High' | 'Medium' | 'Low' | string | null
  responseSampleCount?: number
  responseRate?: number | null
  responseOpportunityCount?: number
  sentCount?: number
  receivedCount?: number
  interactionCount?: number
  collaborationScore?: number | null
  responseBaselineMinutes?: number | null
  metricsWindowDays?: number
  responseWindowDays?: number
  isOnline: boolean
  isFavorite: boolean
  isRecent: boolean
  verifiedExpert: boolean
  fullTime: boolean
  avatar: string
  communicationStyle?: string[]
  preferredStyle?: string
  customStyle?: string
}

import { getAuthToken, authorizationHeaders } from './authStorage'
import { apiError as apiResponseError, reportApiFailure, requireOk } from './apiClient'
import { readUserStorage, writeUserStorage } from './storage'

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'recipients-data'

export function sanitizeResponseSpeed(value: unknown): '빠름' | '보통' | '느림' | '' {
  if (!value) return ''
  const str = String(value || '').trim()
  if (str.includes('빠') || str.toLowerCase().includes('fast')) return '빠름'
  if (str.includes('느') || str.toLowerCase().includes('slow')) return '느림'
  if (str.includes('보') || str.toLowerCase().includes('normal')) return '보통'
  return ''
}

function normalizeRecipient(item: unknown): Recipient {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
  const speed = sanitizeResponseSpeed(source.responseSpeed)
  const avgMinutes = typeof source.averageResponseMinutes === 'number' && source.averageResponseMinutes > 0
    ? source.averageResponseMinutes
    : (source.averageResponseMinutes && !isNaN(Number(source.averageResponseMinutes)) && Number(source.averageResponseMinutes) > 0 ? Number(source.averageResponseMinutes) : null)

  return {
    id: Number(source.id),
    name: String(source.name || ''),
    email: String(source.email || ''),
    role: String(source.role || source.jobRole || source.position || ''),
    company: String(source.company || ''),
    country: String(source.country || 'South Korea'),
    language: String(source.language || 'Korean'),
    timezone: String(source.timezone || 'Asia/Seoul'),
    organizationRelation: String(source.organizationRelation || source.relationship || '팀원'),
    responseSpeed: speed || null,
    averageResponseMinutes: avgMinutes,
    collaborationActivity: source.collaborationActivity ? String(source.collaborationActivity) : null,
    responseSampleCount: Number(source.responseSampleCount) || 0,
    responseRate: source.responseRate !== null && source.responseRate !== undefined
      ? Number(source.responseRate)
      : null,
    responseOpportunityCount: Number(source.responseOpportunityCount) || 0,
    sentCount: Number(source.sentCount) || 0,
    receivedCount: Number(source.receivedCount) || 0,
    interactionCount: Number(source.interactionCount) || 0,
    collaborationScore: source.collaborationScore !== null && source.collaborationScore !== undefined
      ? Number(source.collaborationScore)
      : null,
    responseBaselineMinutes: source.responseBaselineMinutes !== null && source.responseBaselineMinutes !== undefined
      ? Number(source.responseBaselineMinutes)
      : null,
    metricsWindowDays: Number(source.metricsWindowDays) || 90,
    responseWindowDays: Number(source.responseWindowDays) || 7,
    isOnline: Boolean(source.isOnline),
    isFavorite: Boolean(source.isFavorite),
    isRecent: source.isRecent !== undefined ? Boolean(source.isRecent) : true,
    verifiedExpert: Boolean(source.verifiedExpert),
    fullTime: source.fullTime !== undefined ? Boolean(source.fullTime) : true,
    avatar: String(source.avatar || (source.name ? String(source.name).slice(0, 1) : '?')),
    communicationStyle: Array.isArray(source.communicationStyle) ? source.communicationStyle.map(String) : [],
    preferredStyle: String(source.preferredStyle || ''),
    customStyle: String(source.customStyle || ''),
  }
}

function isRecipient(value: unknown): value is Recipient {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Recipient>
  return typeof item.id === 'number' && typeof item.name === 'string'
}

function readLocalRecipients(): Recipient[] {
  try {
    const parsed: unknown = JSON.parse(readUserStorage(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(isRecipient).map(normalizeRecipient) : []
  } catch {
    return []
  }
}

export function persistRecipients(recipients: Recipient[]) {
  writeUserStorage(STORAGE_KEY, JSON.stringify(recipients))
}

export async function fetchRecipients(signal?: AbortSignal): Promise<Recipient[]> {
  signal?.throwIfAborted()
  try {
    const token = getAuthToken()
    if (!token) throw new Error('로그인 정보가 없습니다.')
    const response = await fetch(`${API_URL}/api/recipients`, {
      signal,
      cache: 'no-store',
      headers: authorizationHeaders(),
    })
    await requireOk(response, '수신자 목록을 불러오지 못했습니다.')
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const recipients = data.map(normalizeRecipient)
      persistRecipients(recipients)
      return recipients
    }
    throw new Error('서버가 올바르지 않은 수신자 목록을 반환했습니다.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : '수신자 목록을 불러오지 못했습니다.', true)
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
  if (!response.ok) throw await apiResponseError(response, '수신자 저장에 실패했습니다.')
  const item: unknown = await response.json()
  const data = normalizeRecipient(item)
  const normalizedEmail = data.email?.trim().toLowerCase()
  const current = readLocalRecipients().filter((r) => (
    r.id !== data.id && r.email?.trim().toLowerCase() !== normalizedEmail
  ))
  persistRecipients([data, ...current])
  return data
}

export async function fetchIeumUserProfile(email: string): Promise<Recipient> {
  const response = await fetch(
    `${API_URL}/api/users/lookup?email=${encodeURIComponent(email.trim())}`,
    { cache: 'no-store', headers: authorizationHeaders() },
  )
  if (!response.ok) throw await apiResponseError(response, '이음에 가입된 회원을 찾을 수 없습니다.')
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
  await requireOk(response, '수신자 수정에 실패했습니다.')
  const data = await response.json()
  const normalized = normalizeRecipient(data)
  const current = readLocalRecipients().map((r) => (r.id === normalized.id ? normalized : r))
  persistRecipients(current)
  return normalized
}

export async function toggleRecipientFavorite(id: number): Promise<Recipient | null> {
  const response = await fetch(`${API_URL}/api/recipients/${id}/favorite`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
  })
  await requireOk(response, '즐겨찾기를 변경하지 못했습니다.')
  const data = await response.json()
  const normalized = normalizeRecipient(data)
  const current = readLocalRecipients().map((r) => (r.id === normalized.id ? normalized : r))
  persistRecipients(current)
  return normalized
}

export async function deleteRecipient(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/recipients/${id}`, {
    method: 'DELETE',
    headers: authorizationHeaders(),
  })
  if (!response.ok) throw await apiResponseError(response, '수신자 삭제에 실패했습니다.')

  const current = readLocalRecipients().filter((r) => r.id !== id)
  persistRecipients(current)
}
