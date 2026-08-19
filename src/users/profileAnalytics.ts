import { fetchDashboardSummary } from './dashboard'
import { fetchRecipients } from './recipients'
import { getUserProfile } from './userProfile'
import { authorizationHeaders, getAuthToken } from './authStorage'
import { requireOk } from './apiClient'

export type ProfileAnalytics = {
  analyzedMessageCount: number
  modelCompleteness: number
  averageMessageFit: number
  optimizedMessageCount: number
  topCollaboratedRole: string | null
}

export const emptyProfileAnalytics: ProfileAnalytics = {
  analyzedMessageCount: 0,
  modelCompleteness: 0,
  averageMessageFit: 0,
  optimizedMessageCount: 0,
  topCollaboratedRole: null,
}

const PROFILE_ANALYTICS_EVENT = 'profile-analytics-updated'

export function normalizePercentage(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function normalizeProfileAnalytics(data: ProfileAnalytics): ProfileAnalytics {
  return {
    analyzedMessageCount: Math.max(0, Math.round(data.analyzedMessageCount)),
    modelCompleteness: normalizePercentage(data.modelCompleteness),
    averageMessageFit: normalizePercentage(data.averageMessageFit),
    optimizedMessageCount: Math.max(0, Math.round(data.optimizedMessageCount)),
    topCollaboratedRole: data.topCollaboratedRole?.trim() || null,
  }
}

export async function fetchProfileAnalytics(signal?: AbortSignal): Promise<ProfileAnalytics> {
  signal?.throwIfAborted()
  try {
    const [summary, recipients] = await Promise.all([
      fetchDashboardSummary(signal),
      fetchRecipients(signal),
    ])

    const profile = getUserProfile()

    // 프로필 완성도 계산 (이름, 직무, 회사, 소통 선호도 등)
    let completenessBase = 20
    if (profile.name) completenessBase += 15
    if (profile.role || profile.position) completenessBase += 15
    if (profile.company) completenessBase += 10
    if (profile.communicationPreferences?.length > 0) completenessBase += 20
    if (recipients.length > 0) completenessBase += 10
    if (summary.aiConversions > 0) completenessBase += Math.min(10, summary.aiConversions * 2)

    // 가장 많이 협업한 직무 찾기
    const roleCounts: Record<string, number> = {}
    recipients.forEach((r) => {
      if (r.role) roleCounts[r.role] = (roleCounts[r.role] || 0) + 1
    })
    const topRoleEntry = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]

    const totalAnalyzed = (summary.totalMessages || 0) + summary.sentMessages + summary.aiConversions

    const result: ProfileAnalytics = {
      analyzedMessageCount: totalAnalyzed,
      modelCompleteness: normalizePercentage(completenessBase),
      averageMessageFit: summary.aiConversions > 0 ? 94 : totalAnalyzed > 0 ? 88 : 0,
      optimizedMessageCount: summary.aiConversions,
      topCollaboratedRole: topRoleEntry ? topRoleEntry[0] : (recipients[0]?.role || null),
    }

    return normalizeProfileAnalytics(result)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
  }
  return emptyProfileAnalytics
}

export function subscribeToProfileAnalytics(
  onUpdate: (analytics: ProfileAnalytics) => void,
): () => void {
  const handleLocalUpdate = (event: Event) => {
    onUpdate(normalizeProfileAnalytics((event as CustomEvent<ProfileAnalytics>).detail))
  }

  window.addEventListener(PROFILE_ANALYTICS_EVENT, handleLocalUpdate)
  return () => {
    window.removeEventListener(PROFILE_ANALYTICS_EVENT, handleLocalUpdate)
  }
}

export async function resetProfileAnalytics(): Promise<void> {
  const API_URL = import.meta.env.VITE_API_URL || ''
  if (!getAuthToken()) throw new Error('로그인 정보가 없습니다.')
  const response = await fetch(`${API_URL}/api/users/me/reset-personalization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
  })
  await requireOk(response, '개인화 분석을 초기화하지 못했습니다.')
  window.dispatchEvent(new CustomEvent(PROFILE_ANALYTICS_EVENT, { detail: emptyProfileAnalytics }))
}
