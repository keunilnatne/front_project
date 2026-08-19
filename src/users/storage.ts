const STORAGE_OWNER_KEY = 'ieum.storageOwner'

const LEGACY_USER_DATA_KEYS = [
  'ieum.userProfile',
  'recipients-data',
  'message-drafts',
  'ieum.history',
  'ieum.conversations',
  'ieum.companyDNA',
  'ieum.teamMemory.patterns',
  'ieum.teamMemory.candidates',
  'ieum.teamMemory.logs',
  'ieum.teamSchedules',
  'ieum.inboxCache',
  'ieum-notifications',
  'ieum.notices',
  'ieum.integrations',
  'ieum.aiPersonalization',
  'ieum.accountPassword',
] as const

function decodeTokenScope(token: string | null): string | null {
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(decodeURIComponent(Array.from(atob(padded), (char) => (
      `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`
    )).join(''))) as { sub?: string | number; id?: string | number; email?: string }
    const identifier = payload.sub ?? payload.id ?? payload.email
    return identifier === undefined ? null : String(identifier).replace(/[^a-zA-Z0-9@._-]/g, '_')
  } catch {
    return null
  }
}

function currentToken() {
  return localStorage.getItem('ieum.accessToken')
    || localStorage.getItem('ieum.token')
    || localStorage.getItem('token')
    || localStorage.getItem('accessToken')
}

export function getUserScope(token = currentToken()): string {
  return decodeTokenScope(token) || 'guest'
}

export function scopedStorageKey(baseKey: string): string {
  return `${baseKey}:user:${getUserScope()}`
}

export function readUserStorage(baseKey: string): string | null {
  const key = scopedStorageKey(baseKey)
  const scoped = localStorage.getItem(key)
  if (scoped !== null) return scoped

  const legacy = localStorage.getItem(baseKey)
  const owner = localStorage.getItem(STORAGE_OWNER_KEY)
  const scope = getUserScope()
  if (legacy !== null && scope !== 'guest' && (!owner || owner === scope)) {
    localStorage.setItem(key, legacy)
    localStorage.removeItem(baseKey)
    return legacy
  }
  return null
}

export function writeUserStorage(baseKey: string, value: string): void {
  localStorage.setItem(scopedStorageKey(baseKey), value)
}

export function removeUserStorage(baseKey: string): void {
  localStorage.removeItem(scopedStorageKey(baseKey))
  localStorage.removeItem(baseKey)
}

function clearLegacyUserData(): void {
  LEGACY_USER_DATA_KEYS.forEach((key) => localStorage.removeItem(key))
}

function clearTransientUserData(): void {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('onboarding.')) localStorage.removeItem(key)
  })
  localStorage.removeItem('auth.isGoogleLogin')
}

export function prepareStorageForToken(token: string): void {
  const nextOwner = getUserScope(token)
  const previousOwner = localStorage.getItem(STORAGE_OWNER_KEY)
  const existingTokenOwner = getUserScope()
  const accountChanged = (
    (previousOwner && previousOwner !== nextOwner)
    || (!previousOwner && existingTokenOwner !== 'guest' && existingTokenOwner !== nextOwner)
  )
  if (accountChanged) {
    clearLegacyUserData()
    clearTransientUserData()
  }
  localStorage.setItem(STORAGE_OWNER_KEY, nextOwner)
}

export function clearCurrentUserData(): void {
  const scope = getUserScope()
  const suffix = `:user:${scope}`
  Object.keys(localStorage).forEach((key) => {
    if (key.endsWith(suffix) || key.startsWith('onboarding.')) localStorage.removeItem(key)
  })
  clearLegacyUserData()
  clearTransientUserData()
  localStorage.removeItem(STORAGE_OWNER_KEY)
}

export const USER_STORAGE_BASE_KEYS = LEGACY_USER_DATA_KEYS
