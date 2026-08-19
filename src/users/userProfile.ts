export type UserProfile = {
  email: string
  name: string
  company: string
  position: string
  role: string
  workHours: string
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
  workHours: '09:00 - 18:00',
  tools: [],
  communicationPreferences: [],
  customStyle: '',
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
        workHours: data.workHours || '09:00 - 18:00',
        tools: data.tools || ['Slack', 'Notion', 'Gmail'],
        communicationPreferences: data.communicationPreferences || [],
        customStyle: data.customStyle || data.preferredStyle || '',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      if (profile.position || profile.role || profile.company || (profile.name && profile.name !== profile.email?.split('@')[0])) {
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
          workHours: updated.workHours,
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
  if (email) {
    const key = `onboarding.completed_${email.trim().toLowerCase()}`
    if (localStorage.getItem(key) === 'true') return true
  }
  if (localStorage.getItem('onboarding.completed') === 'true') return true

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && (parsed.position || parsed.role || parsed.company || (parsed.name && parsed.name !== parsed.email?.split('@')[0]))) {
        return true
      }
    }
  } catch {
    // ignore
  }

  return false
}

export function completeOnboarding(email = '') {
  if (email) {
    localStorage.setItem(`onboarding.completed_${email.trim().toLowerCase()}`, 'true')
  }
  localStorage.setItem('onboarding.completed', 'true')
}

export function startOnboarding(email = '') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultUserProfile, email }))
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  window.dispatchEvent(new Event('profile-updated'))
}

export function skipOnboarding(email = '') {
  localStorage.removeItem(STORAGE_KEY)
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.setItem('onboarding.skipped', 'true')
  completeOnboarding(email)
  window.dispatchEvent(new Event('profile-updated'))
}
