export type RegisterInput = {
  name: string
  email: string
  password: string
}

type StoredAccount = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

const ACCOUNTS_STORAGE_KEY = 'ieum.accounts'

export async function registerAccount(input: RegisterInput): Promise<void> {
  // 백엔드 연동(회원가입): 실제 서비스에서는 이곳에서 회원가입 API를 호출해 주세요.
  // 비밀번호 해시와 사용자 계정은 브라우저가 아니라 백엔드에서 안전하게 관리해야 합니다.
  const accounts = getStoredAccounts()
  const email = normalizeEmail(input.email)
  const alreadyExists = accounts.some((account) => account.email === email)

  if (alreadyExists) {
    throw new Error('이미 가입된 이메일입니다.')
  }

  const newAccount: StoredAccount = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(
    ACCOUNTS_STORAGE_KEY,
    JSON.stringify([...accounts, newAccount]),
  )
}

export async function authenticateAccount(
  email: string,
  password: string,
): Promise<boolean> {
  // 백엔드 연동(로그인): 실제 서비스에서는 로그인 API를 호출하고 인증 토큰을 받아 주세요.
  const normalizedEmail = normalizeEmail(email)
  const passwordHash = await hashPassword(password)

  return getStoredAccounts().some((account) => (
    account.email === normalizedEmail
    && account.passwordHash === passwordHash
  ))
}

function getStoredAccounts(): StoredAccount[] {
  try {
    const storedData: unknown = JSON.parse(
      localStorage.getItem(ACCOUNTS_STORAGE_KEY) || '[]',
    )

    return Array.isArray(storedData)
      ? storedData.filter(isStoredAccount)
      : []
  } catch {
    return []
  }
}

function isStoredAccount(value: unknown): value is StoredAccount {
  if (!value || typeof value !== 'object') return false
  const account = value as Partial<StoredAccount>

  return typeof account.id === 'string'
    && typeof account.name === 'string'
    && typeof account.email === 'string'
    && typeof account.passwordHash === 'string'
    && typeof account.createdAt === 'string'
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function hashPassword(password: string) {
  const encodedPassword = new TextEncoder().encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedPassword)

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
