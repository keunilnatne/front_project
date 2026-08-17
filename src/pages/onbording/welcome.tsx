import { Link, useNavigate } from 'react-router-dom'
import welcomeIllustration from '../../images/welcome-illustration.png'
import { skipOnboarding, getUserProfile } from '../../users/userProfile'

const START_BUTTON_CLASS = [
  'mt-12 flex h-12 w-full max-w-80 items-center justify-center rounded-lg',
  'bg-[linear-gradient(98.53deg,#6236FF_0%,#35208F_100%)]',
  'text-[15px] font-semibold text-white',
  'shadow-[0_2px_5px_rgba(67,56,202,0.24)] transition duration-200',
  'hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(67,56,202,0.28)]',
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4338ca]/20',
  'active:translate-y-0',
].join(' ')

const SKIP_BUTTON_CLASS = [
  'mt-4 flex h-8.25 items-center rounded-md px-4 py-2',
  'text-[12px] leading-4.25 text-[#77716d] transition',
  'hover:bg-[#f7f5f3] hover:text-[#3e3935]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]/20',
].join(' ')

function ProgressIndicator() {
  return (
    <nav aria-label="온보딩 진행 상황" className="flex h-3.75 items-center justify-center gap-1 pt-9">
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          aria-current={index === 0 ? 'step' : undefined}
          className={`h-1 w-8 rounded-full sm:w-10 ${index === 0 ? 'bg-[#4f46e5]' : 'bg-[#c7c6f9]'}`}
        />
      ))}
    </nav>
  )
}

function Welcome() {
  const navigate = useNavigate()

  const handleSkip = () => {
    const profile = getUserProfile()
    skipOnboarding(profile.email)
    navigate('/dashboard', { replace: true })
  }


  return (
    <main
      className="min-h-screen bg-white px-5 text-[#17171c] sm:px-8"
      style={{
        fontFamily:
          'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col">
        <ProgressIndicator />

        <section className="flex flex-1 items-center justify-center py-14 md:-translate-y-2 lg:-translate-y-1 lg:py-0">
          <div className="flex w-full items-center justify-center gap-6 lg:gap-16">
            <div className="flex w-full max-w-89 flex-col items-center text-center md:w-85 md:shrink-0 lg:w-89">
              <h1 className="w-full whitespace-nowrap text-[30px] font-semibold leading-[1.4] tracking-[-1px] md:text-[28px] md:leading-10 lg:text-[36px] lg:leading-12.5">
                당신의 커뮤니케이션을
                <br />
                이해하는 <span className="text-[#4f46e5]">AI</span>를 만나보세요.
              </h1>

              <p className="mt-6 w-full max-w-86.75 whitespace-nowrap text-[14px] font-normal leading-6 text-[#564334] lg:text-[16px] lg:leading-6.5">
                자주 쓰는 표현부터 팀의 커뮤니케이션 방식까지 학습해,
                <br className="hidden sm:block" />
                나에게 맞는 메시지를 제안해드려요.
              </p>

              <Link
                to="/profile-setup"
                className={START_BUTTON_CLASS}
              >
                시작하기
              </Link>

              <button
                type="button"
                onClick={handleSkip}
                className={SKIP_BUTTON_CLASS}
              >
                건너뛰기
              </button>

              <div className="mt-10 inline-flex h-5.75 w-[197.833px] items-center justify-center gap-1 rounded-full bg-[#4338ca]/10 px-3 py-1 text-[10px] font-medium leading-3.75 text-[#4338ca]">
                <span aria-hidden="true" className="text-[11px] leading-none">
                  ✦
                </span>
                ENTERPRISE AI ENGINE V2.4
              </div>
            </div>

            <img
              src={welcomeIllustration}
              alt="노트북으로 AI 커뮤니케이션 도구를 사용하는 사람"
              className="hidden h-80 w-80 shrink-0 object-contain md:block lg:h-95.5 lg:w-102.25"
            />
          </div>
        </section>
      </div>
    </main>
  )
}

export default Welcome