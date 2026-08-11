import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import appleIcon from '../images/apple.png'
import facebookIcon from '../images/facebook.png'
import googleIcon from '../images/google.png'
import logo from '../images/ieum-logo.png'
import kakaoIcon from '../images/kakao.png'
import naverIcon from '../images/naver.png'
import { saveUserProfile } from '../users/userProfile'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      ) : (
        <>
          <path d="m3 3 18 18" />
          <path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8M6.4 6.4C4 8 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3.2-.6M10.2 10.2a2.5 2.5 0 0 0 3.6 3.6" />
        </>
      )}
    </svg>
  )
}

type CheckOptionProps = {
  id: string
  label: string
  defaultChecked?: boolean
}

function CheckOption({ id, label, defaultChecked = false }: CheckOptionProps) {
  return (
    <label htmlFor={id} className="flex h-11.75 cursor-pointer items-center gap-3 px-4 text-[14px] font-medium text-[#3f3f46]">
      <input id={id} type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex h-5 w-5 items-center justify-center rounded-xs border-2 border-[#b9b9c0] bg-white text-white transition peer-checked:border-[#4338ca] peer-checked:bg-[#4338ca] peer-focus-visible:ring-2 peer-focus-visible:ring-[#4338ca]/30">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m3 7 2.5 2.5L11 4" />
        </svg>
      </span>
      {label}
    </label>
  )
}

const socialLogins = [
  { name: '네이버', icon: naverIcon },
  { name: '카카오', icon: kakaoIcon },
  { name: '구글', icon: googleIcon },
  { name: '페이스북', icon: facebookIcon },
  { name: '애플', icon: appleIcon },
]

function SocialLoginSection({ onLogin }: { onLogin: () => void }) {
  return (
    <section className="mt-9.5 text-center" aria-labelledby="social-login-title">
      <h2 id="social-login-title" className="text-[14px] font-medium text-[#232329]">
        SNS 계정으로 로그인하기
      </h2>

      <div className="mt-6 flex items-start justify-center gap-5.75">
        {socialLogins.map(({ name, icon }) => (
          <button
            key={name}
            type="button"
            onClick={onLogin}
            aria-label={`${name} 계정으로 로그인`}
            className="group flex w-13.75 flex-col items-center gap-2 focus-visible:outline-none"
          >
            <img
              src={icon}
              alt=""
              className="h-11.75 w-11.75 rounded-full object-contain shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition duration-300 group-hover:-translate-y-1 group-focus-visible:ring-4 group-focus-visible:ring-[#4338ca]/20"
            />
            <span className="text-[10px] font-medium text-[#686870] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              {name}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Loginpage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    saveUserProfile({ email: String(form.get('email')) })
    navigate('/welcome')
  }

  return (
    <main
      className="min-h-screen bg-white px-5 text-[#202027]"
      style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}
    >
      <div className="mx-auto flex min-h-256 w-full max-w-360 flex-col items-center">
        <header className="mt-26 flex flex-col items-center">
          <img src={logo} alt="이음 로고" className="h-37 w-66 object-contain" />
          <h1 className="text-center text-[36px] font-bold leading-10.75 text-[#4338ca]">이음</h1>
        </header>

        <form onSubmit={handleSubmit} className="mt-16.5 w-full max-w-145.25" aria-label="로그인">
          <div className="space-y-5.25">
            <label className="block">
              <span className="sr-only">아이디 (이메일)</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="아이디 (이메일)"
                className="h-11.75 w-full rounded-lg border-2 border-black/20 px-5 text-[14px] outline-none transition duration-300 ease-out placeholder:text-[#9b9ba2] focus:border-[#4338ca] focus:ring-4 focus:ring-[#4338ca]/10"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">비밀번호</span>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="비밀번호"
                className="h-11.75 w-full rounded-lg border-2 border-black/20 px-5 pr-14 text-[14px] outline-none transition duration-300 ease-out placeholder:text-[#9b9ba2] focus:border-[#4338ca] focus:ring-4 focus:ring-[#4338ca]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-[#8d8d95] hover:bg-[#f2f1fb] hover:text-[#4338ca]"
              >
                <EyeIcon open={showPassword} />
              </button>
            </label>
          </div>

          <button type="submit" className="mt-5.25 h-15 w-full rounded-lg bg-[#4338ca] text-[15px] font-bold text-white transition duration-300 ease-out hover:bg-[#3730a3] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4338ca]/25 active:scale-[0.995]">
            로그인하기
          </button>

          <div className="mt-3.75 flex flex-wrap items-center gap-x-0 sm:gap-x-px">
            <div className="w-48.25">
              <CheckOption id="auto-login" label="자동로그인" defaultChecked />
            </div>
            <div className="w-44.5">
              <CheckOption id="save-id" label="아이디 저장" defaultChecked />
            </div>
          </div>

          <button type="button" className="mt-13.25 h-15 w-full rounded-lg border border-[#4338ca] bg-white text-[15px] font-bold text-[#4338ca] transition duration-300 ease-out hover:bg-[#f5f3ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4338ca]/15">
            간편 회원가입하기
          </button>

          <SocialLoginSection onLogin={() => navigate('/welcome')} />
        </form>
      </div>
    </main>
  )
}

export default Loginpage
