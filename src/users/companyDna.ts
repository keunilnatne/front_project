export type Term = { from: string; to: string }

export type CommunicationRule = {
  id: string
  title: string
  description: string
  icon: 'mail' | 'notice' | 'report'
}

export type CompanyDNA = {
  decisionStructure: string
  channels: string
  reporting: string
  terms: Term[]
  rules: CommunicationRule[]
  accuracy: number
  aiEnabled?: boolean
}

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'ieum.companyDNA'

export const emptyCompanyDNA: CompanyDNA = {
  decisionStructure: '',
  channels: '',
  reporting: '',
  terms: [],
  rules: [],
  accuracy: 0,
  aiEnabled: true,
}

function isCompanyDNA(value: unknown): value is CompanyDNA {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CompanyDNA>
  return typeof item.decisionStructure === 'string'
    && typeof item.channels === 'string'
    && typeof item.reporting === 'string'
    && Array.isArray(item.terms)
    && Array.isArray(item.rules)
    && typeof item.accuracy === 'number'
}

export async function fetchCompanyDNA(signal?: AbortSignal): Promise<CompanyDNA> {
  signal?.throwIfAborted()
  try {
    const response = await fetch(`${API_URL}/api/company-dna`, {
      signal,
      headers: authorizationHeaders(),
    })
    await requireOk(response, 'Company DNA를 불러오지 못했습니다.')
    const data: unknown = await response.json()
    if (isCompanyDNA(data)) {
      writeUserStorage(STORAGE_KEY, JSON.stringify(data))
      return data
    }
    throw new Error('서버가 올바르지 않은 Company DNA 데이터를 반환했습니다.')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : 'Company DNA를 불러오지 못했습니다.', true)
  }

  try {
    const local = JSON.parse(readUserStorage(STORAGE_KEY) || 'null')
    return isCompanyDNA(local) ? local : emptyCompanyDNA
  } catch {
    return emptyCompanyDNA
  }
}

export async function saveCompanyDNA(data: CompanyDNA): Promise<CompanyDNA> {
  const response = await fetch(`${API_URL}/api/company-dna`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
    body: JSON.stringify(data),
  })
  await requireOk(response, 'Company DNA를 저장하지 못했습니다.')
  const result: unknown = await response.json()
  if (!isCompanyDNA(result)) {
    throw new Error('서버가 올바르지 않은 Company DNA 데이터를 반환했습니다.')
  }
  writeUserStorage(STORAGE_KEY, JSON.stringify(result))
  return result
}
import { authorizationHeaders } from './authStorage'
import { reportApiFailure, requireOk } from './apiClient'
import { readUserStorage, writeUserStorage } from './storage'
