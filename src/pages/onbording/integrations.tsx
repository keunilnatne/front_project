import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import gmailLogo from '../../images/gmail.png'

const TOTAL_STEPS = 6
const CURRENT_STEP = 4
const BUTTON_CLASS = 'flex h-[58px] w-full items-center justify-center rounded-lg text-lg leading-[25.2px] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5b3df5]/20'
const GOOGLE_AUTH_URL = import.meta.env.VITE_GOOGLE_AUTH_URL || '/api/auth/google'

type GoogleAuthMessage = {
  type: 'google-auth-success' | 'google-auth-error'
  email?: string
  message?: string
}

function ProgressIndicator() {
  return (
    <nav aria-label="온보딩 진행 상황" className="absolute top-5 left-1/2 flex h-3.75 w-[calc(100%-32px)] max-w-4xl -translate-x-1/2 items-center justify-center gap-1">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => (
        <span key={index} aria-current={index === CURRENT_STEP ? 'step' : undefined} className={`h-0.75 w-8 rounded-full ${index === CURRENT_STEP ? 'bg-[#4f46e5]' : 'bg-[#c9c8f4]'}`} />
      ))}
    </nav>
  )
}

function Integrations() {
  const navigate = useNavigate()
  const [showGmailLogin, setShowGmailLogin] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [googleError, setGoogleError] = useState('')

  const finishIntegration = (connected: boolean) => {
    localStorage.setItem('onboarding.gmail', String(connected))
    navigate('/complete')
  }

  const completeGmailConnection = (email: string) => {
    localStorage.setItem('onboarding.gmailEmail', email)
    localStorage.setItem('onboarding.gmail', 'true')
    setShowGmailLogin(false)
    setIsConnecting(false)
    navigate('/complete')
  }

  useEffect(() => {
    if (localStorage.getItem('auth.isGoogleLogin') === 'true' || localStorage.getItem('onboarding.gmail') === 'true') {
      navigate('/complete', { replace: true })
      return
    }

    const handleGoogleAuthMessage = (event: MessageEvent<GoogleAuthMessage>) => {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === 'google-auth-success' && event.data.email) {
        completeGmailConnection(event.data.email)
        return
      }

      if (event.data?.type === 'google-auth-error') {
        setIsConnecting(false)
        setGoogleError(event.data.message || 'Google 계정 연결에 실패했습니다.')
      }
    }

    window.addEventListener('message', handleGoogleAuthMessage)
    return () => window.removeEventListener('message', handleGoogleAuthMessage)
  }, [navigate])

  const openGoogleLogin = () => {
    setGoogleError('')
    const popup = window.open(
      GOOGLE_AUTH_URL,
      'google-login',
      'popup=yes,width=520,height=680,left=200,top=80',
    )

    if (!popup) {
      setGoogleError('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.')
      return
    }

    setIsConnecting(true)
    popup.focus()
  }

  return (
    <main className="relative min-h-screen bg-white px-4 text-[#241912]" style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <ProgressIndicator />

      <div className="mx-auto h-[609.16px] w-full max-w-lg pt-18">
        <header className="h-[109.59px] px-6 pb-8 text-center">
          <h1 className="h-11 text-[32px] font-semibold leading-[43.2px] tracking-[-0.72px]">업무 환경과 연결하세요</h1>
          <p className="mt-2 text-base leading-[25.6px] text-[#564334]">원활한 커뮤니케이션을 위해 이메일 계정을 연동해 주세요.</p>
        </header>

        <section className="h-56.5 px-6 pb-6">
          <div className="flex h-50.5 flex-col items-center justify-center rounded-lg border border-[#cecece] text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#4338ca]/30 bg-white">
              <img src={gmailLogo} alt="Gmail" className="h-8 w-8 object-contain" />
            </div>
            <h2 className="mt-4 h-7.5 pb-1 text-lg font-semibold leading-6.5">Gmail 연동</h2>
            <p className="mx-auto max-w-98.75 px-13.5 text-sm leading-5.25 text-[#686868] max-sm:px-5">
              이메일을 연결하면 메시지 작성과 전송을 더 편리하게<br className="max-sm:hidden" /> 사용할 수 있어요.
            </p>
          </div>
        </section>

        <div className="flex h-37 flex-col gap-2 px-6 pb-6">
          <button
            type="button"
            onClick={openGoogleLogin}
            disabled={isConnecting}
            className={`${BUTTON_CLASS} gap-1 bg-[linear-gradient(90deg,#5b3df5_0%,#35248f_100%)] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:brightness-110 disabled:opacity-60`}
          >
            <span aria-hidden="true" className="text-base leading-none">↪</span>
            {isConnecting ? 'Gmail 계정 연결 중...' : 'Gmail 연결하기'}
          </button>
          <button type="button" onClick={() => finishIntegration(false)} className={`${BUTTON_CLASS} border border-[#cecece] bg-white font-normal hover:bg-[#fafafa]`}>
            나중에 연결하기
          </button>
        </div>

        {googleError && <p role="alert" className="mt-2 text-center text-sm text-[#c23e3e]">{googleError}</p>}

        <p className="flex h-[16.8px] items-center justify-center gap-1 px-6 text-center text-xs leading-[16.8px] tracking-[0.12px] text-[#5d5d5d]/80">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3 shrink-0 fill-current"><path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9h14v-9a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V6Z" /></svg>
          연결된 데이터는 AI 개인화 및 서비스 제공에 필요한 범위에서만 사용됩니다.
        </p>
      </div>

      {showGmailLogin && (
        <GmailConnectionDialog
          onClose={() => setShowGmailLogin(false)}
          onConnect={completeGmailConnection}
        />
      )}
    </main>
  )
}


function GmailConnectionDialog({ onClose, onConnect }: {
  onClose: () => void
  onConnect: (email: string) => void
}) {
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()

    // 백엔드 연동: 실제 서비스에서는 비밀번호를 직접 전송하지 말고 Google OAuth 인증으로 교체해 주세요.
    // OAuth 인증 성공 콜백에서 onConnect(연동된이메일)를 호출하면 다음 단계로 이동합니다.
    
    onConnect(email)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="gmail-login-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-105 rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e1e1e5] bg-white"><img src={gmailLogo} alt="" className="h-6 w-6 object-contain" /></span>
            <div><h2 id="gmail-login-title" className="text-lg font-semibold">Gmail 계정 연결</h2><p className="mt-1 text-xs text-[#686868]">사용할 Gmail 계정 정보를 입력해 주세요.</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Gmail 연결 창 닫기" className="flex h-8 w-8 items-center justify-center rounded-md text-xl text-[#777981] hover:bg-[#f2f2f4]">×</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <label className="block text-xs font-medium text-[#34343a]">이메일 주소
            <input name="email" type="email" autoComplete="username" required autoFocus placeholder="example@gmail.com" className="mt-2 h-11 w-full rounded-lg border border-[#d9d9df] px-3 text-sm outline-none focus:border-[#5b3df5] focus:ring-2 focus:ring-[#5b3df5]/10" />
          </label>
          <label className="mt-4 block text-xs font-medium text-[#34343a]">비밀번호
            <span className="relative mt-2 block">
              <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={8} placeholder="비밀번호를 입력해 주세요" className="h-11 w-full rounded-lg border border-[#d9d9df] px-3 pr-14 text-sm outline-none focus:border-[#5b3df5] focus:ring-2 focus:ring-[#5b3df5]/10" />
              <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[10px] text-[#686870] hover:bg-[#f2f2f4]" aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>{showPassword ? '숨기기' : '보기'}</button>
            </span>
          </label>

          <p className="mt-4 rounded-lg bg-[#f5f3ff] px-3 py-2 text-[10px] leading-4 text-[#5e56a0]">입력한 비밀번호는 저장되지 않으며 Gmail 연결 확인에만 사용됩니다.</p>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="h-11 flex-1 rounded-lg border border-[#d9d9df] text-sm font-medium hover:bg-[#fafafa]">취소</button>
            <button type="submit" className="h-11 flex-1 rounded-lg bg-[#4338ca] text-sm font-semibold text-white hover:bg-[#352ca8]">연결하기</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default Integrations