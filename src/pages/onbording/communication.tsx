import { useState, type FormEvent, type SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'

const preferences = [
  ['concise', '간결하게'],
  ['detailed', '자세하게'],
  ['conclusion', '결론부터'],
  ['context', '맥락부터'],
  ['polite', '정중하게'],
  ['casual', '편하게'],
] as const

type PreferenceId = (typeof preferences)[number][0]

const iconPaths: Partial<Record<PreferenceId, string>> = {
  concise: 'M5 8h14M5 12h9',
  detailed: 'M5 6h14M5 10h14M5 14h14M5 18h9',
  conclusion: 'M6 20V5m0 1h11l-2.5 3L17 12H6',
  context: 'm3 15 5-5 4 4 8-8m-4 0h4v4',
}

function ProgressIndicator() {
  return (
    <nav aria-label="온보딩 진행 상황" className="absolute top-5 left-1/2 flex h-3.75 w-[calc(100%-32px)] max-w-4xl -translate-x-1/2 items-center justify-center gap-1">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} aria-current={index === 2 ? 'step' : undefined} className={`h-0.75 w-8 rounded-full ${index === 2 ? 'bg-[#4f46e5]' : 'bg-[#c9c8f4]'}`} />
      ))}
    </nav>
  )
}

function PreferenceIcon({ name, ...props }: { name: PreferenceId } & SVGProps<SVGSVGElement>) {
  const svgProps = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    'aria-hidden': true, ...props,
  }

  if (name === 'casual') {
    return <svg {...svgProps}><circle cx="12" cy="12" r="9" /><path d="M8.5 10h.01M15.5 10h.01M8.5 14s1.2 2 3.5 2 3.5-2 3.5-2" /></svg>
  }

  if (name === 'polite') {
    return <svg {...svgProps}><path d="m12 3 2.1 2.1 3-.1-.1 3L19 10l-2 2 .1 3-3-.1L12 17l-2.1-2.1-3 .1.1-3L5 10l2-2-.1-3 3 .1L12 3Z" /><path d="m9.5 10 1.6 1.6 3.4-3.4" /></svg>
  }

  return <svg {...svgProps}><path d={iconPaths[name]} /></svg>
}

function Communication() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<PreferenceId[]>([])

  const togglePreference = (id: PreferenceId) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    localStorage.setItem('onboarding.communication', 'true')
    navigate('/add-recipient')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f8f9fc] px-4 py-[clamp(72px,17.78vh,182.12px)] text-[#241912]" style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <ProgressIndicator />

      <section className="min-h-[659.77px] w-full max-w-150 rounded-xl border border-[#e5e7ef] bg-white px-8.25 shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-sm:min-h-0 max-sm:px-5">
        <header className="mt-[58.89px] flex h-15.25 flex-col items-center gap-2 text-center max-sm:mt-8">
          <h1 className="w-full text-2xl font-semibold leading-[31.2px] tracking-[-0.24px] text-black">평소 어떻게 소통하시나요?</h1>
          <p className="w-full text-sm leading-5.25 text-[#564334]">이 정보는 AI가 당신의 메시지 작성 스타일을 이해하는 데 사용됩니다.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset className="mt-[43.69px] pt-4 max-sm:mt-8">
            <legend className="sr-only">선호하는 커뮤니케이션 방식</legend>
            <div className="grid h-[165.59px] grid-cols-3 grid-rows-2 gap-2 max-sm:h-auto max-sm:grid-cols-2">
              {preferences.map(([id, label]) => {
                const isSelected = selected.includes(id)

                return (
                  <button key={id} type="button" aria-pressed={isSelected} onClick={() => togglePreference(id)} className={`flex h-17.25 flex-col items-center justify-center gap-[3.9px] rounded-lg border text-xs leading-[16.8px] tracking-[0.12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5]/25 ${isSelected ? 'border-[#6a54ee] bg-[#efedff] text-[#4f46e5]' : 'border-[#dadada] bg-white text-[#241912] hover:bg-[#fafafa]'}`}>
                    <PreferenceIcon name={id} className="h-5 w-5.5" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-[23.99px] pt-3.75">
            <label htmlFor="custom-style" className="block h-[17.8px] pb-[0.8px] text-xs leading-[16.8px] tracking-[0.12px]">직접 입력하기 (선택)</label>
            <textarea id="custom-style" rows={3} placeholder="예: 비즈니스 용어를 많이 사용합니다, 이모지를 자주 씁니다..." className="mt-1 block h-24.25 w-full resize-none overflow-auto rounded-lg border border-[#dadada] bg-white p-4 text-sm leading-5.25 outline-none transition placeholder:text-[#564334] focus:border-[#6a54ee] focus:ring-2 focus:ring-[#6a54ee]/10" />
          </div>

          <div className="mt-[23.8px] grid h-[99.8px] grid-cols-[178px_1fr] gap-9.75 border-t border-[#ececf1] pt-6 max-sm:grid-cols-[1fr_1.5fr] max-sm:gap-3">
            <button type="button" onClick={() => navigate('/profile-setup')} className="h-12.75 rounded-lg border border-[#e2e2e2] bg-white px-6 py-4 text-xs font-medium leading-[16.8px] tracking-[0.12px] transition hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5]/25">이전</button>
            <button type="submit" className="h-[50.8px] rounded-lg bg-[linear-gradient(90deg,#5b3df5_0%,#35248f_100%)] px-6 py-4 text-xs font-medium leading-[16.8px] tracking-[0.12px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5b3df5]/20">다음</button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default Communication
