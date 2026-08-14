import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import appleIcon from '../../images/apple.png'
import facebookIcon from '../../images/facebook.png'
import googleIcon from '../../images/google.png'
import logo from '../../images/ieum-logo.png'
import kakaoIcon from '../../images/kakao.png'
import naverIcon from '../../images/naver.png'
import { authenticateAccount } from '../../users/auth'
import { startOnboarding } from '../../users/userProfile'

const INPUT_CLASS = [
  'h-12 w-full rounded-lg border-2 border-black/20 px-5 text-sm outline-none',
  'transition placeholder:text-[#9b9ba2]',
  'focus:border-[#4338ca] focus:ring-4 focus:ring-[#4338ca]/10',
].join(' ')

const socialLogins = [
  { name: '네이버', icon: naverIcon },
  { name: '카카오', icon: kakaoIcon },
  { name: '구글', icon: googleIcon },
  { name: '페이스북', icon: facebookIcon },
  { name: '애플', icon: appleIcon },
]

function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const registered = searchParams.get('registered') === 'true'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    let authenticated = false

    try {
      authenticated = await authenticateAccount(email, password)
    } catch {
      setErrorMessage('로그인 처리 중 문제가 발생했습니다.')
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
    startOnboarding(email)
    navigate('/welcome')
  }

  const savedEmail = localStorage.getItem('ieum.savedLoginEmail') || ''
  const initialEmail = searchParams.get('email') || savedEmail

  return (
    <main className="min-h-screen bg-white px-5 text-[#202027]">
      <div className="mx-auto flex min-h-screen w-full max-w-145 flex-col items-center py-14">
        <header className="flex flex-col items-center">
          <img src={logo} alt="이음 로고" className="h-30 w-54 object-contain" />
          <h1 className="text-3xl font-bold text-[#4338ca]">이음</h1>
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
        </form>

        <SocialLoginSection />
      </div>
    </main>
  )
}

function SocialLoginSection() {
  const showPreparingMessage = (serviceName: string) => {
    window.alert(`${serviceName} 로그인은 준비 중입니다.`)
  }

  return (
    <section className="mt-10 text-center" aria-labelledby="social-login-title">
      <h2 id="social-login-title" className="text-sm font-medium">
        SNS 계정으로 로그인하기
      </h2>
      <div className="mt-5 flex gap-5">
        {socialLogins.map(({ name, icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => showPreparingMessage(name)}
            aria-label={`${name} 계정으로 로그인`}
            className="group flex w-12 flex-col items-center gap-2"
          >
            <img
              src={icon}
              alt=""
              className="h-12 w-12 rounded-full object-contain shadow-sm transition group-hover:-translate-y-1"
            />
          </button>
        ))}
      </div>
    </section>
  )
}

export default SignInPage