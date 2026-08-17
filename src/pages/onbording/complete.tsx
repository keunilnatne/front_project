import { useNavigate } from 'react-router-dom'
import completeImage from '../../images/onboarding-complete.png'
import { getUserProfile, completeOnboarding } from '../../users/userProfile'

const summaryItems = [
  { key: 'profile', label: '내 프로필 설정 완료' },
  { key: 'communication', label: '커뮤니케이션 스타일 설정 완료' },
  { key: 'gmail', label: 'Gmail 연결 상태' },
  { key: 'recipient', label: '협업 프로필' },
] as const

type SummaryKey = (typeof summaryItems)[number]['key']

function getCompletionStatus(key: string) {
  const savedStatus = localStorage.getItem(`onboarding.${key}`)
  return savedStatus === null ? true : savedStatus === 'true'
}

function ProgressIndicator() {
  return (
    <nav aria-label="온보딩 진행 상황" className="absolute top-5 left-1/2 flex h-3.75 w-[calc(100%-32px)] max-w-4xl -translate-x-1/2 items-center justify-center gap-1">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} aria-current={index === 5 ? 'step' : undefined} className={`h-0.75 w-8 rounded-full ${index === 5 ? 'bg-[#4f46e5]' : 'bg-[#c9c8f4]'}`} />
      ))}
    </nav>
  )
}

function StatusIcon({ completed }: { completed: boolean }) {
  return (
    <span
      role="img"
      aria-label={completed ? '완료' : '미완료'}
      className={`flex h-8 w-8 items-center justify-center text-base font-semibold ${completed ? 'text-[#4338ca]' : 'text-red-500'}`}
    >
      {completed ? '✓' : '×'}
    </span>
  )
}

function SummaryIcon({ name }: { name: SummaryKey }) {
  const paths = {
    profile: <><circle cx="12" cy="8" r="3" /><path d="M6 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2H6Z" /></>,
    communication: <><path d="M9 18H7v-3a7 7 0 1 1 10 0v3h-2" /><circle cx="12" cy="10" r="2" /><path d="M12 6v2m0 4v2m-4-4h2m4 0h2m-5.5-2.5L9 6m4.5 1.5L15 6" /></>,
    gmail: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></>,
    recipient: <><circle cx="12" cy="8" r="2.5" /><circle cx="5.5" cy="10" r="2" /><circle cx="18.5" cy="10" r="2" /><path d="M8 19v-2a4 4 0 0 1 8 0v2M2 19v-1.5a3.5 3.5 0 0 1 5-3.2M22 19v-1.5a3.5 3.5 0 0 0-5-3.2" /></>,
  }

  return (
    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4338ca]/10 text-[#4338ca]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths[name]}
      </svg>
    </span>
  )
}

function Complete() {
  const navigate = useNavigate()

  const handleFinish = () => {
    const profile = getUserProfile()
    completeOnboarding(profile.email)
    navigate('/dashboard')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-white px-4 pb-16 pt-32 text-[#241912]" style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(circle_at_42%_45%,#a5b4fc_0%,transparent_28%),radial-gradient(circle_at_60%_52%,#a7f3d0_0%,transparent_27%)]" />
      <ProgressIndicator />

      <div className="relative mx-auto flex w-full max-w-lg flex-col items-center px-4">
        <img src={completeImage} alt="온보딩 준비 완료" className="h-43.5 w-43.5 object-contain" />

        <header className="w-full text-center">
          <h1 className="h-13.25 pt-2.25 text-4xl font-semibold leading-[43.2px] tracking-[-0.72px]">준비됐어요</h1>
          <p className="h-[26.59px] pb-[0.59px] text-base leading-6.5 text-[#564334]">이제 상대방에게 맞는 메시지를 만들어보세요.</p>
        </header>

        <section aria-label="온보딩 설정 요약" className="mt-10 h-68.5 w-full rounded-xl border border-[#e0e0e0] bg-white px-6 pb-6 pt-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <ul className="flex h-54 flex-col gap-2">
            {summaryItems.map((item) => {
              const completed = getCompletionStatus(item.key)

              return (
                <li key={item.key} className="flex h-12 items-center justify-between rounded-lg p-2">
                  <div className="flex items-center gap-4">
                    <SummaryIcon name={item.key} />
                    <span className="text-sm leading-5.25">{item.label}</span>
                  </div>
                  <StatusIcon completed={completed} />
                </li>
              )
            })}
          </ul>
        </section>

        <button type="button" onClick={handleFinish} className="mt-10 flex h-[58px] w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-4 text-lg leading-[26px] text-[#5d5d5d] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4338ca]/15">
          첫 메시지 작성하기 <span aria-hidden="true" className="text-xl leading-none">→</span>
        </button>
      </div>
    </main>
  )
}


export default Complete