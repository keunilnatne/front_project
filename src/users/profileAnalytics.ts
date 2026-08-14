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
  // 백엔드 연동(최초 조회): 아래 반환 코드를 사용자 분석 데이터 조회 API 호출로 교체
  // 예시: GET /api/users/me/profile-analytics 요청 후 응답값을 정규화하여 반환
  signal?.throwIfAborted()
  return emptyProfileAnalytics
}

export function subscribeToProfileAnalytics(
  onUpdate: (analytics: ProfileAnalytics) => void,
): () => void {
  const handleLocalUpdate = (event: Event) => {
    onUpdate(normalizeProfileAnalytics((event as CustomEvent<ProfileAnalytics>).detail))
  }

  window.addEventListener(PROFILE_ANALYTICS_EVENT, handleLocalUpdate)

  // 백엔드 연동(실시간 갱신): 이곳에서 WebSocket 또는 SSE에 연결
  // 대화 분석 결과가 변경될 때마다 onUpdate(normalizeProfileAnalytics(payload))를 호출
  return () => {
    window.removeEventListener(PROFILE_ANALYTICS_EVENT, handleLocalUpdate)
    // 백엔드 연동(실시간 연결 해제): 이곳에서 WebSocket 또는 SSE 연결을 종료 부분
  }
}

export async function resetProfileAnalytics(): Promise<void> {
  // 백엔드 연동(데이터 삭제): 이곳에서 현재 사용자의 학습 데이터 삭제 API를 호출
  window.dispatchEvent(new CustomEvent(PROFILE_ANALYTICS_EVENT, { detail: emptyProfileAnalytics }))
}
