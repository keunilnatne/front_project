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

