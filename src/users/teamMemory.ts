export type Pattern = {
  id: string
  title: string
  purpose: string
  reason: string
  request: string
  deadline: string
  attachmentName?: string
  updatedAt?: string
  unread?: boolean
}

export type Candidate = {
  id: string
  text: string
  suggestion: string
  confidence: number
}

export type LearningLog = {
  id: string
  action: string
  description: string
  time: string
}

const API_URL = import.meta.env.VITE_API_URL || ''
const PATTERN_KEY = 'ieum.teamMemory.patterns'
const CANDIDATE_KEY = 'ieum.teamMemory.candidates'
const LOG_KEY = 'ieum.teamMemory.logs'

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

function read<T>(key: string, guard: (value: unknown) => value is T): T[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(data) ? data.filter(guard) : []
  } catch {
    return []
  }
}

const isPattern = (value: unknown): value is Pattern => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Pattern>
  return (typeof item.id === 'string' || typeof item.id === 'number') && typeof item.title === 'string'
}

function normalizePattern(item: any): Pattern {
  return {
    id: String(item.id),
    title: item.title || '',
    purpose: item.purpose || '',
    reason: item.reason || '',
    request: item.request || '',
    deadline: item.deadline || '',
    attachmentName: item.attachmentName || undefined,
    updatedAt: item.updatedAt || undefined,
    unread: Boolean(item.unread),
  }
}

const isCandidate = (value: unknown): value is Candidate => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Candidate>
  return typeof item.id === 'string' && typeof item.text === 'string'
    && typeof item.suggestion === 'string' && typeof item.confidence === 'number'
}

const isLog = (value: unknown): value is LearningLog => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LearningLog>
  return typeof item.id === 'string' && typeof item.action === 'string'
    && typeof item.description === 'string' && typeof item.time === 'string'
}

export async function fetchTeamMemory(signal?: AbortSignal): Promise<Pattern[]> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/team-memory?type=pattern`, {
      signal,
      headers: authorizationHeaders(),
    })
    if (response.ok) {
      const data: unknown = await response.json()
      let rawList: any[] = []
      if (Array.isArray(data)) {
        rawList = data
      } else if (data && typeof data === 'object' && Array.isArray((data as any).patterns)) {
        rawList = (data as any).patterns
      }
      const patterns = rawList.map(normalizePattern)
      localStorage.setItem(PATTERN_KEY, JSON.stringify(patterns))
      return patterns
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return read(PATTERN_KEY, isPattern)
}

export async function saveTeamMemoryPattern(pattern: Pattern): Promise<Pattern> {
  try {
    const response = await fetch(`${API_URL}/api/team-memory/patterns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(),
      },
      body: JSON.stringify(pattern),
    })
    if (response.ok) {
      const data: any = await response.json()
      const saved = normalizePattern(data)
      const current = read(PATTERN_KEY, isPattern)
      const next = [saved, ...current.filter((item) => String(item.id) !== String(saved.id))]
      localStorage.setItem(PATTERN_KEY, JSON.stringify(next))
      return saved
    }
  } catch (err) {
    console.warn('Backend save failed, saving locally:', err)
  }
  const saved = pattern
  const current = read(PATTERN_KEY, isPattern)
  const next = [saved, ...current.filter((item) => String(item.id) !== String(saved.id))]
  localStorage.setItem(PATTERN_KEY, JSON.stringify(next))
  return saved
}

export async function updateTeamMemoryPattern(pattern: Pattern): Promise<Pattern> {
  try {
    const response = await fetch(`${API_URL}/api/team-memory/patterns/${pattern.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authorizationHeaders(),
      },
      body: JSON.stringify(pattern),
    })
    if (response.ok) {
      const data: any = await response.json()
      const updated = normalizePattern(data)
      const current = read(PATTERN_KEY, isPattern)
      const next = current.map((item) => (String(item.id) === String(updated.id) ? updated : item))
      localStorage.setItem(PATTERN_KEY, JSON.stringify(next))
      return updated
    }
  } catch (err) {
    console.warn('Backend update failed, updating locally:', err)
  }
  const updated = pattern
  const current = read(PATTERN_KEY, isPattern)
  const next = current.map((item) => (String(item.id) === String(updated.id) ? updated : item))
  localStorage.setItem(PATTERN_KEY, JSON.stringify(next))
  return updated
}

export async function deleteTeamMemoryPattern(id: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/team-memory/patterns/${id}`, {
      method: 'DELETE',
      headers: authorizationHeaders(),
    })
  } catch (err) {
    console.warn('Backend delete failed, deleting locally:', err)
  }
  const current = read(PATTERN_KEY, isPattern)
  const next = current.filter((item) => String(item.id) !== String(id))
  localStorage.setItem(PATTERN_KEY, JSON.stringify(next))
}

export async function fetchTeamMemoryCandidates(signal?: AbortSignal): Promise<Candidate[]> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/team-memory/candidates`, { signal })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const candidates = data.filter(isCandidate)
      localStorage.setItem(CANDIDATE_KEY, JSON.stringify(candidates))
      return candidates
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return read(CANDIDATE_KEY, isCandidate)
}

export function getLocalLearningLogs() {
  return read(LOG_KEY, isLog)
}

export function persistLearningLogs(logs: LearningLog[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs))
}
