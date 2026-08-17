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
    const response = await fetch(`${API_URL}/api/company-dna`, { signal })
    if (!response.ok) throw new Error()
    const data: unknown = await response.json()
    if (isCompanyDNA(data)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return data
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }

  try {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return isCompanyDNA(local) ? local : emptyCompanyDNA
  } catch {
    return emptyCompanyDNA
  }
}

export async function saveCompanyDNA(data: CompanyDNA): Promise<CompanyDNA> {
  try {
    const response = await fetch(`${API_URL}/api/company-dna`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error()
    const result: unknown = await response.json()
    if (isCompanyDNA(result)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
      return result
    }
  } catch {
    // 백엔드가 준비되기 전에도 동일한 계약으로 로컬 상태를 유지한다.
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}
