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

const STORAGE_KEY = 'ieum.userProfile'
const ONBOARDING_STORAGE_KEYS = [
  'onboarding.profile',
  'onboarding.communication',
  'onboarding.recipient',
  'onboarding.gmail',
  'onboarding.gmailEmail',
  'onboarding.skipped',
] as const

export function getUserProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultUserProfile, ...JSON.parse(stored) } : defaultUserProfile
  } catch {
    return defaultUserProfile
  }
}

export function saveUserProfile(profile: Partial<UserProfile>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...getUserProfile(), ...profile }))
  window.dispatchEvent(new Event('profile-updated'))
}

export function resetUserProfile() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event('profile-updated'))
}

export function startOnboarding(email = '') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultUserProfile, email }))
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  window.dispatchEvent(new Event('profile-updated'))
}

export function skipOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
  ONBOARDING_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  localStorage.setItem('onboarding.skipped', 'true')
  window.dispatchEvent(new Event('profile-updated'))
}
