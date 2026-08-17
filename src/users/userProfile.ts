export type UserProfile = {
  email: string
  name: string
  company: string
  position: string
  role: string
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

function getAuthToken(): string | null {
  return (
    localStorage.getItem('ieum.token') ||
    localStorage.getItem('ieum.accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  )
}

function authorizationHeaders(): Record<string, string> {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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
        tools: data.tools || ['Slack', 'Notion', 'Gmail'],
        communicationPreferences: data.communicationPreferences || [],
        customStyle: data.customStyle || data.preferredStyle || '',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
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
          tools: updated.tools,
          communicationPreferences: updated.communicationPreferences,
          customStyle: updated.customStyle,
          preferredStyle: updated.customStyle || (updated.communicationPreferences?.join(', ') ?? ''),
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
  return localStorage.getItem('onboarding.completed') === 'true'
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
