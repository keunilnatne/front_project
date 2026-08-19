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
}

export function hasCompletedOnboardingProfile(profile?: Partial<UserProfile> | null): boolean {
  return Boolean(profile && (profile.position || profile.role || profile.company))
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
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      if (hasCompletedOnboardingProfile(profile)) {
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

export function isOnboardingCompleted(email = ''): boolean {
  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail) {
    const key = `onboarding.completed_${normalizedEmail}`
    if (localStorage.getItem(key) === 'true') return true
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UserProfile>
      const storedEmail = String(parsed.email || '').trim().toLowerCase()
      const sameAccount = !normalizedEmail || storedEmail === normalizedEmail
      if (sameAccount && hasCompletedOnboardingProfile(parsed)) {
        return true
      }
    }
  } catch {
    // ignore
  }

  return !normalizedEmail && localStorage.getItem('onboarding.completed') === 'true'
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

export function skipOnboarding(email = '') {
  localStorage.removeItem(STORAGE_KEY)
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.setItem('onboarding.skipped', 'true')
  completeOnboarding(email)
  window.dispatchEvent(new Event('profile-updated'))
}
