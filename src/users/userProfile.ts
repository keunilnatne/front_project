export type UserProfile = {
  email: string
  name: string
  company: string
  position: string
  role: string
  country?: string
  language?: string
  timezone?: string
  workHours: string
  lunchHours?: string
  tools: string[]
  communicationPreferences: string[]
  customStyle: string
  onboardingCompleted: boolean
}

export const defaultUserProfile: UserProfile = {
  email: '',
  name: '',
  company: '',
  position: '',
  role: '',
  country: 'South Korea',
  language: 'Korean',
  timezone: 'Asia/Seoul',
  workHours: '09:00 - 18:00',
  lunchHours: '12:00 - 13:00',
  tools: [],
  communicationPreferences: [],
  customStyle: '',
  onboardingCompleted: false,
}

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'ieum.userProfile'
const ONBOARDING_STORAGE_KEYS = [
  'onboarding.profile',
  'onboarding.communication',
  'onboarding.recipient',
  'onboarding.gmail',
  'onboarding.gmailEmail',
  'onboarding.skipped',
] as const

import { getAuthToken, authorizationHeaders } from './authStorage'

export function getUserProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultUserProfile, ...JSON.parse(stored) } : defaultUserProfile
  } catch {
    return defaultUserProfile
  }
}

export async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const token = getAuthToken()
    if (!token) return getUserProfile()

    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: authorizationHeaders(),
    })
    if (response.ok) {
      const data = await response.json()
      const profile: UserProfile = {
        email: data.email || '',
        name: data.name || '',
        company: data.companyName || data.company?.name || '',
        position: data.position || data.jobTitle || '',
        role: data.jobRole || data.role || '',
        country: data.country || 'South Korea',
        language: data.language || data.defaultLanguage || 'Korean',
        timezone: data.timezone || 'Asia/Seoul',
        workHours: data.workHours || '09:00 - 18:00',
        lunchHours: data.lunchHours || '12:00 - 13:00',
        tools: data.tools || ['Slack', 'Notion', 'Gmail'],
        communicationPreferences: data.communicationPreferences || [],
        customStyle: data.customStyle || data.preferredStyle || '',
        onboardingCompleted: data.onboardingCompleted === true,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      if (profile.onboardingCompleted) {
        completeOnboarding(profile.email)
      }
      window.dispatchEvent(new Event('profile-updated'))
      return profile
    }
  } catch {
    // fallback
  }
  return getUserProfile()
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const updated: UserProfile = { ...getUserProfile(), ...profile }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('profile-updated'))

  try {
    const token = getAuthToken()
    if (token) {
      await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeaders(),
        },
        body: JSON.stringify({
          name: updated.name,
          company: updated.company,
          companyName: updated.company,
          position: updated.position,
          jobTitle: updated.position,
          role: updated.role,
          jobRole: updated.role,
          country: updated.country,
          language: updated.language,
          timezone: updated.timezone,
          workHours: updated.workHours,
          lunchHours: updated.lunchHours,
          tools: updated.tools,
          communicationPreferences: updated.communicationPreferences,
          preferredStyle: updated.customStyle || (updated.communicationPreferences?.join(', ') ?? ''),
          customStyle: updated.customStyle,
        }),
      })
    }
  } catch {
    // offline / sync error
  }

  return updated
}

export function resetUserProfile() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('profile-updated'))
}

export function completeOnboarding(email = '') {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail) {
    localStorage.setItem(`onboarding.completed_${normalizedEmail}`, 'true')
    localStorage.removeItem('onboarding.completed')
  } else {
    localStorage.setItem('onboarding.completed', 'true')
  }
}

export async function finishOnboarding(email = ''): Promise<void> {
  const token = getAuthToken()
  if (!token) throw new Error('로그인 정보가 없습니다. 다시 로그인해 주세요.')

  const response = await fetch(`${API_URL}/api/users/me/onboarding`, {
    method: 'PATCH',
    headers: authorizationHeaders(),
  })
  if (!response.ok) {
    throw new Error('온보딩 완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.')
  }

  const profile = { ...getUserProfile(), onboardingCompleted: true }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  completeOnboarding(email || profile.email)
  window.dispatchEvent(new Event('profile-updated'))
}

export function startOnboarding(email = '') {
  const normalizedEmail = email.trim().toLowerCase()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultUserProfile, email: normalizedEmail || email }))
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem('onboarding.completed')
  if (normalizedEmail) {
    localStorage.removeItem(`onboarding.completed_${normalizedEmail}`)
  }
  window.dispatchEvent(new Event('profile-updated'))
}

export async function skipOnboarding(email = ''): Promise<void> {
  localStorage.removeItem(STORAGE_KEY)
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.setItem('onboarding.skipped', 'true')
  await finishOnboarding(email)
  window.dispatchEvent(new Event('profile-updated'))
}
