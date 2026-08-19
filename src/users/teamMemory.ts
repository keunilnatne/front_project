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
  type?: string
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

import { authorizationHeaders } from './authStorage'
import { reportApiFailure, requireOk } from './apiClient'
import { readUserStorage, writeUserStorage } from './storage'

const API_URL = import.meta.env.VITE_API_URL || ''
const PATTERN_KEY = 'ieum.teamMemory.patterns'
const CANDIDATE_KEY = 'ieum.teamMemory.candidates'
const LOG_KEY = 'ieum.teamMemory.logs'

function read<T>(key: string, guard: (value: unknown) => value is T): T[] {
  try {
    const data: unknown = JSON.parse(readUserStorage(key) || '[]')
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

function normalizePattern(item: unknown): Pattern {
  const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
  return {
    id: String(source.id || ''),
    title: String(source.title || ''),
    purpose: String(source.purpose || ''),
    reason: String(source.reason || ''),
    request: String(source.request || ''),
    deadline: String(source.deadline || ''),
    attachmentName: source.attachmentName ? String(source.attachmentName) : undefined,
    updatedAt: source.updatedAt ? String(source.updatedAt) : undefined,
    unread: Boolean(source.unread),
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
    await requireOk(response, '팀 일정을 불러오지 못했습니다.')
    const data: unknown = await response.json()
    let rawList: unknown[]
    if (Array.isArray(data)) {
      rawList = data
    } else if (data && typeof data === 'object' && Array.isArray((data as { patterns?: unknown }).patterns)) {
      rawList = (data as { patterns: unknown[] }).patterns
    } else {
      throw new Error('서버가 올바르지 않은 팀 일정 목록을 반환했습니다.')
    }
    const patterns = rawList.map(normalizePattern)
    writeUserStorage(PATTERN_KEY, JSON.stringify(patterns))
    return patterns
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : '팀 일정을 불러오지 못했습니다.', true)
  }
  return read(PATTERN_KEY, isPattern)
}

export async function saveTeamMemoryPattern(pattern: Pattern): Promise<Pattern> {
  const response = await fetch(`${API_URL}/api/team-memory/patterns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify(pattern),
  })
  await requireOk(response, '팀 일정을 저장하지 못했습니다.')
  const data: unknown = await response.json()
  const saved = normalizePattern(data)
  const current = read(PATTERN_KEY, isPattern)
  const next = [saved, ...current.filter((item) => String(item.id) !== String(saved.id))]
  writeUserStorage(PATTERN_KEY, JSON.stringify(next))
  return saved
}

export async function updateTeamMemoryPattern(pattern: Pattern): Promise<Pattern> {
  const response = await fetch(`${API_URL}/api/team-memory/patterns/${pattern.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify(pattern),
  })
  await requireOk(response, '팀 일정을 수정하지 못했습니다.')
  const data: unknown = await response.json()
  const updated = normalizePattern(data)
  const current = read(PATTERN_KEY, isPattern)
  const next = current.map((item) => (String(item.id) === String(updated.id) ? updated : item))
  writeUserStorage(PATTERN_KEY, JSON.stringify(next))
  return updated
}

export async function deleteTeamMemoryPattern(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/team-memory/patterns/${id}`, {
    method: 'DELETE',
    headers: authorizationHeaders(),
  })
  await requireOk(response, '팀 일정을 삭제하지 못했습니다.')
  const current = read(PATTERN_KEY, isPattern)
  const next = current.filter((item) => String(item.id) !== String(id))
  writeUserStorage(PATTERN_KEY, JSON.stringify(next))
}

export async function fetchTeamMemoryCandidates(signal?: AbortSignal): Promise<Candidate[]> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/team-memory/candidates`, {
      signal,
      headers: authorizationHeaders(),
    })
    await requireOk(response, '학습 후보를 불러오지 못했습니다.')
    const data: unknown = await response.json()
    if (Array.isArray(data)) {
      const candidates = data.filter(isCandidate)
      writeUserStorage(CANDIDATE_KEY, JSON.stringify(candidates))
      return candidates
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : '학습 후보를 불러오지 못했습니다.', true)
  }
  return read(CANDIDATE_KEY, isCandidate)
}

export function getLocalLearningLogs() {
  return read(LOG_KEY, isLog)
}

export function persistLearningLogs(logs: LearningLog[]) {
  writeUserStorage(LOG_KEY, JSON.stringify(logs))
}
