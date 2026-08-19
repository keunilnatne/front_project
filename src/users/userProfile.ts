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
import { readUserStorage, removeUserStorage, writeUserStorage } from './storage'
import { reportApiFailure, requireOk } from './apiClient'

export function getUserProfile(): UserProfile {
  try {
    const stored = readUserStorage(STORAGE_KEY)
    return stored ? { ...defaultUserProfile, ...JSON.parse(stored) } : defaultUserProfile
  } catch {
    return defaultUserProfile
  }
}

export async function fetchUserProfile(): Promise<UserProfile> {
  try {
    const token = getAuthToken()
    if (!token) throw new Error('로그인 정보가 없습니다.')

    const response = await fetch(`${API_URL}/api/users/me`, {
      headers: authorizationHeaders(),
    })
    await requireOk(response, '프로필을 불러오지 못했습니다.')
    {
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
      writeUserStorage(STORAGE_KEY, JSON.stringify(profile))
      if (profile.onboardingCompleted) {
        completeOnboarding(profile.email)
      }
      window.dispatchEvent(new Event('profile-updated'))
      return profile
    }
  } catch (error) {
    reportApiFailure(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.', true)
  }
  return getUserProfile()
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const updated: UserProfile = { ...getUserProfile(), ...profile }
  const token = getAuthToken()
  if (!token) throw new Error('로그인 정보가 없습니다. 다시 로그인해 주세요.')

  const response = await fetch(`${API_URL}/api/users/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
    },
    body: JSON.stringify({
      name: updated.name,
      email: updated.email,
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
  await requireOk(response, '프로필을 저장하지 못했습니다.')

  writeUserStorage(STORAGE_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('profile-updated'))

  return updated
}

export function resetUserProfile() {
  removeUserStorage(STORAGE_KEY)
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
  await requireOk(response, '온보딩 완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.')

  const profile = { ...getUserProfile(), onboardingCompleted: true }
  writeUserStorage(STORAGE_KEY, JSON.stringify(profile))
  completeOnboarding(email || profile.email)
  window.dispatchEvent(new Event('profile-updated'))
}

export function startOnboarding(email = '') {
  const normalizedEmail = email.trim().toLowerCase()
  writeUserStorage(STORAGE_KEY, JSON.stringify({ ...defaultUserProfile, email: normalizedEmail || email }))
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.removeItem('onboarding.completed')
  if (normalizedEmail) {
    localStorage.removeItem(`onboarding.completed_${normalizedEmail}`)
  }
  window.dispatchEvent(new Event('profile-updated'))
}

export async function skipOnboarding(email = ''): Promise<void> {
  removeUserStorage(STORAGE_KEY)
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.setItem('onboarding.skipped', 'true')
  await finishOnboarding(email)
  window.dispatchEvent(new Event('profile-updated'))
}
