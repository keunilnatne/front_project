import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gmailLogo from '../../images/gmail.png'

const TOTAL_STEPS = 6
const CURRENT_STEP = 4
const BUTTON_CLASS = 'flex h-[58px] w-full items-center justify-center rounded-lg text-lg leading-[25.2px] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5b3df5]/20'


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
  const [isConnecting, setIsConnecting] = useState(false)
  const [googleError, setGoogleError] = useState('')

  const finishIntegration = (connected: boolean) => {
    localStorage.setItem('onboarding.gmail', String(connected))
    navigate('/complete')
  }

  const completeGmailConnection = (email: string) => {
    localStorage.setItem('onboarding.gmailEmail', email)
    localStorage.setItem('onboarding.gmail', 'true')
    setIsConnecting(false)
    navigate('/complete')
  }

  useEffect(() => {
    if (localStorage.getItem('auth.isGoogleLogin') === 'true' || localStorage.getItem('onboarding.gmail') === 'true') {
      navigate('/complete', { replace: true })
      return
    }

    const handleGoogleAuthMessage = (event: MessageEvent<GoogleAuthMessage>) => {
      if (!event.data || typeof event.data !== 'object') return

      if (event.data.type === 'google-auth-success' && event.data.email) {
        completeGmailConnection(event.data.email)
        return
      }

      if (event.data.type === 'google-auth-error') {
        setIsConnecting(false)
        setGoogleError(event.data.message || 'Google 계정 연결에 실패했습니다.')
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
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          popup.location.href = data.url
          popup.focus()
          return
        }
      }
      popup.location.href = targetApi ? `${targetApi}/api/auth/google` : 'http://localhost:4000/api/auth/google'
      popup.focus()
    } catch {
      const targetApi = import.meta.env.VITE_API_URL || ''
      popup.location.href = targetApi ? `${targetApi}/api/auth/google` : 'http://localhost:4000/api/auth/google'
      popup.focus()
    }
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
    </main>
  )
}

export default Integrations