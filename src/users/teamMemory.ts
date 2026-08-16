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
  return typeof item.id === 'string' && typeof item.title === 'string'
    && typeof item.purpose === 'string' && typeof item.reason === 'string'
    && typeof item.request === 'string' && typeof item.deadline === 'string'
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

export async function fetchTeamMemory(signal?: AbortSignal) {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/team-memory`, { signal })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const patterns = data.filter(isPattern)
      localStorage.setItem(PATTERN_KEY, JSON.stringify(patterns))
      return patterns
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return read(PATTERN_KEY, isPattern)
}

export async function saveTeamMemoryPattern(pattern: Pattern) {
  const response = await fetch(`${API_URL}/api/team-memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pattern),
  })
  if (!response.ok) throw new Error('팀 메모리 저장에 실패했습니다.')
  const data: unknown = await response.json()
  const saved = isPattern(data) ? data : pattern
  localStorage.setItem(PATTERN_KEY, JSON.stringify([saved, ...read(PATTERN_KEY, isPattern).filter((item) => item.id !== saved.id)]))
  return saved
}

export async function updateTeamMemoryPattern(pattern: Pattern) {
  const response = await fetch(`${API_URL}/api/team-memory/${pattern.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pattern),
  })
  if (!response.ok) throw new Error('팀 메모리 수정에 실패했습니다.')
  const data: unknown = await response.json()
  const updated = isPattern(data) ? data : pattern
  localStorage.setItem(PATTERN_KEY, JSON.stringify(read(PATTERN_KEY, isPattern).map((item) => item.id === updated.id ? updated : item)))
  return updated
}

export async function deleteTeamMemoryPattern(id: string) {
  const response = await fetch(`${API_URL}/api/team-memory/${id}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('팀 메모리 삭제에 실패했습니다.')
  localStorage.setItem(PATTERN_KEY, JSON.stringify(read(PATTERN_KEY, isPattern).filter((item) => item.id !== id)))
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
