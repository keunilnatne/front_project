import { getAuthToken, authorizationHeaders } from './authStorage'
import { reportApiFailure, requireOk } from './apiClient'

export type DashboardSummary = {
  sentMessages: number
  aiConversions: number
  recipients: number
  totalMessages?: number
}

const API_URL = import.meta.env.VITE_API_URL || ''

export async function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  signal?.throwIfAborted()
  try {
    const token = getAuthToken()
    if (!token) throw new Error('로그인 정보가 없습니다.')
    const response = await fetch(`${API_URL}/api/dashboard/summary`, {
      signal,
      headers: authorizationHeaders(),
    })
    await requireOk(response, '대시보드 통계를 불러오지 못했습니다.')
    const data = await response.json()
    return {
      sentMessages: Number(data.sentMessages ?? data.sent ?? 0),
      aiConversions: Number(data.aiConversions ?? data.aiOptimizedResults ?? 0),
      recipients: Number(data.recipients ?? data.totalRecipients ?? 0),
      totalMessages: Number(data.totalMessages ?? 0),
      }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    reportApiFailure(error instanceof Error ? error.message : '대시보드 통계를 불러오지 못했습니다.')
  }

  return {
    sentMessages: 0,
    aiConversions: 0,
    recipients: 0,
    totalMessages: 0,
  }
}
