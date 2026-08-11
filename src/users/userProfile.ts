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
  email: 'jungsin@abc.com',
  name: '정신',
  company: 'ABC Company',
  position: 'Senior',
  role: '디자이너',
  tools: [],
  communicationPreferences: ['polite', 'conclusion', 'detailed'],
  customStyle: '',
}

const STORAGE_KEY = 'ieum.userProfile'

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
