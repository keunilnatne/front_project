import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import googleIcon from '../../images/google.png'
import logo from '../../images/ieum-logo.png'
import { authenticateAccount } from '../../users/auth'
import { startOnboarding, completeOnboarding, fetchUserProfile } from '../../users/userProfile'
import { setAuthToken } from '../../users/authStorage'
import { requireOk } from '../../users/apiClient'

const INPUT_CLASS = [
  'h-12 w-full rounded-lg border-2 border-black/20 px-5 text-sm outline-none',
  'transition placeholder:text-[#9b9ba2]',
  'focus:border-[#4338ca] focus:ring-4 focus:ring-[#4338ca]/10',
].join(' ')



function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const registered = searchParams.get('registered') === 'true'
  const isGooglePopup = window.name === 'google-login' && Boolean(window.opener)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    let authenticated: boolean

    try {
      authenticated = await authenticateAccount(email, password)
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : '로그인 처리 중 문제가 발생했습니다.')
      setIsSubmitting(false)
      return
    }

    if (!authenticated) {
      setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.')
      setIsSubmitting(false)
      return
    }

    if (form.get('saveEmail')) {
      localStorage.setItem('ieum.savedLoginEmail', email)
    } else {
      localStorage.removeItem('ieum.savedLoginEmail')
    }

    setIsSubmitting(false)
    localStorage.removeItem('auth.isGoogleLogin')
    localStorage.removeItem('onboarding.gmail')

    const userProfile = await fetchUserProfile()
    if (userProfile.onboardingCompleted) {
      completeOnboarding(email)
      navigate('/dashboard')
    } else {
      startOnboarding(email)
      navigate('/welcome')
    }
  }

  const savedEmail = localStorage.getItem('ieum.savedLoginEmail') || ''
  const initialEmail = searchParams.get('email') || savedEmail

  return (
    <main className="min-h-screen bg-white px-5 text-[#202027]">
      <div className="mx-auto flex min-h-screen w-full max-w-145 flex-col items-center py-14">
        <header className="flex flex-col items-center">
          <Link to="/login" className="flex flex-col items-center transition hover:opacity-90">
            <img src={logo} alt="이음 로고" className="h-30 w-54 object-contain" />
            <h1 className="text-3xl font-bold text-[#4338ca]">이음</h1>
          </Link>
          <p className="mt-2 text-sm text-[#777981]">가입한 계정으로 로그인해 주세요.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-10 w-full" aria-label="로그인">
          {registered && (
            <p className="mb-5 rounded-lg bg-[#edf8f1] px-4 py-3 text-sm text-[#287149]">
              회원가입이 완료되었습니다. 가입한 계정으로 로그인해 주세요.
            </p>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium">이메일</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={initialEmail}
                placeholder="example@email.com"
                className={INPUT_CLASS}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium">비밀번호</span>
              <span className="relative block">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="비밀번호"
                  className={`${INPUT_CLASS} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-[#777981] hover:bg-[#f2f1fb]"
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </span>
            </label>
          </div>

          {errorMessage && (
            <p role="alert" className="mt-3 text-sm text-[#c23e3e]">
              {errorMessage}
            </p>
          )}

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-[#55565c]">
            <input name="saveEmail" type="checkbox" defaultChecked={Boolean(savedEmail)} />
            이메일 저장
          </label>

          {!isGooglePopup && (
            <>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 h-14 w-full rounded-lg bg-[#4338ca] text-sm font-bold text-white transition hover:bg-[#3730a3] disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? '로그인 중...' : '로그인하기'}
              </button>

              <Link
                to="/sign-up"
                className="mt-4 flex h-14 w-full items-center justify-center rounded-lg border border-[#4338ca] text-sm font-bold text-[#4338ca] transition hover:bg-[#f5f3ff]"
              >
                간편 회원가입하기
              </Link>
            </>
          )}
        </form>

        <SocialLoginSection />
      </div>
    </main>
  )
}

type GoogleAuthMessage = {
  type: 'google-auth-success' | 'google-auth-error'
  email?: string
  token?: string
  isNewUser?: boolean
  message?: string
}

function SocialLoginSection() {
  const navigate = useNavigate()
  const [isConnecting, setIsConnecting] = useState(false)
  const [googleError, setGoogleError] = useState('')

  useEffect(() => {
    const handleGoogleAuthMessage = (event: MessageEvent<GoogleAuthMessage>) => {
      const targetApi = import.meta.env.VITE_API_URL || window.location.origin
      const expectedOrigin = new URL(targetApi, window.location.origin).origin
      if (event.origin !== expectedOrigin) return
      if (!event.data || typeof event.data !== 'object') return

      if (event.data.type === 'google-auth-success' && event.data.email) {
        setIsConnecting(false)
        const email = event.data.email
        if (event.data.token) {
          setAuthToken(event.data.token)
        }
        localStorage.setItem('auth.isGoogleLogin', 'true')
        localStorage.setItem('onboarding.gmail', 'true')
        localStorage.setItem('onboarding.gmailEmail', email)

        if (event.data.isNewUser) {
          startOnboarding(email)
          localStorage.setItem('auth.isGoogleLogin', 'true')
          localStorage.setItem('onboarding.gmail', 'true')
          localStorage.setItem('onboarding.gmailEmail', email)
          navigate('/welcome')
          return
        }

        void fetchUserProfile().then((userProfile) => {
          if (userProfile.onboardingCompleted) {
            completeOnboarding(email)
            navigate('/dashboard')
          } else {
            startOnboarding(email)
            navigate('/welcome')
          }
        })
        return
      }

      if (event.data.type === 'google-auth-error') {
        setIsConnecting(false)
        setGoogleError(event.data.message || 'Google 로그인에 실패했습니다.')
      }
    }

    window.addEventListener('message', handleGoogleAuthMessage)
    return () => window.removeEventListener('message', handleGoogleAuthMessage)
  }, [navigate])


  const openGoogleLogin = async () => {
    setGoogleError('')

    const popup = window.open(
      'about:blank',
      'google-login',
      'popup=yes,width=520,height=680,left=200,top=80',
    )

    if (!popup) {
      setGoogleError('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.')
      return
    }

    setIsConnecting(true)

    try {
      const targetApi = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${targetApi}/api/auth/google?format=json`, {
        headers: { Accept: 'application/json' },
      })
      await requireOk(res, 'Google 로그인을 시작하지 못했습니다.')
      const data = await res.json() as { url?: string }
      if (!data.url) throw new Error('Google 인증 주소를 받지 못했습니다.')
      popup.location.href = data.url
      popup.focus()
    } catch (error) {
      popup.close()
      setIsConnecting(false)
      setGoogleError(error instanceof Error ? error.message : 'Google 로그인을 시작하지 못했습니다.')
    }
  }

  return (
    <section className="mt-10 w-full" aria-label="Google 로그인">
      <button
        type="button"
        onClick={openGoogleLogin}
        disabled={isConnecting}
        className="relative flex h-14 w-full items-center justify-center rounded-lg border border-[#d9d9de] bg-white px-5 text-sm font-bold text-[#3f4046] transition hover:border-[#b9b6d8] hover:bg-[#fafaff] disabled:cursor-wait disabled:opacity-60"
      >
        <img src={googleIcon} alt="" className="absolute left-5 h-6 w-6 object-contain" />
        {isConnecting ? 'Google 계정 연결 중...' : 'Google 계정으로 로그인하기'}
      </button>

      {googleError && <p role="alert" className="mt-3 text-sm text-[#c23e3e]">{googleError}</p>}

      {/*
        백엔드 작업:
        1. GOOGLE_AUTH_URL에서 Google OAuth 인증을 시작하고 공식 Google 로그인 창으로 이동시켜 주세요.
        2. 인증 성공 후 팝업의 같은 출처 페이지에서 아래 코드를 실행해 주세요.
           window.opener?.postMessage(
             { type: 'google-auth-success', email: '인증된 Google 이메일' },
             window.location.origin,
           )
           window.close()
        3. 실패 시 { type: 'google-auth-error', message: '오류 내용' }을 같은 방식으로 보내 주세요.
        4. 실제 로그인 세션은 백엔드에서 HttpOnly/Secure 쿠키로 발급해 주세요.
      */}
    </section>
  )
}

export default SignInPage
