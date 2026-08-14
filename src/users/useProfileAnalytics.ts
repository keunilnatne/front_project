import { useEffect, useState } from 'react'
import {
  emptyProfileAnalytics,
  fetchProfileAnalytics,
  normalizeProfileAnalytics,
  subscribeToProfileAnalytics,
  type ProfileAnalytics,
} from './profileAnalytics'

export function useProfileAnalytics() {
  const [analytics, setAnalytics] = useState<ProfileAnalytics>(emptyProfileAnalytics)

  useEffect(() => {
    const controller = new AbortController()
    const unsubscribe = subscribeToProfileAnalytics((nextAnalytics) => {
      setAnalytics(normalizeProfileAnalytics(nextAnalytics))
    })

    void fetchProfileAnalytics(controller.signal)
      .then((initialAnalytics) => setAnalytics(normalizeProfileAnalytics(initialAnalytics)))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('프로필 분석 데이터를 불러오지 못했습니다.', error)
        }
      })

    return () => {
      controller.abort()
      unsubscribe()
    }
  }, [])

  return analytics
}
