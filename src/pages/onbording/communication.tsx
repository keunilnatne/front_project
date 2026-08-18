import { useState, type FormEvent, type SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile, saveUserProfile } from '../../users/userProfile'

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

function getStylePreview(selected: PreferenceId[]): { before: string; after: string; note: string } {
  const before = '내일 회의 시간 몇시인가요? 자료 준비해야해서요.'
  if (selected.includes('polite') && selected.includes('concise')) {
    return {
      before,
      after: '내일 회의 일정 확인 부탁드립니다. 사전 발표 자료 준비 후 공유드리겠습니다.',
      note: '정중하고 간결한 비즈니스 톤으로 정제됩니다.',
    }
  }
  if (selected.includes('polite')) {
    return {
      before,
      after: '안녕하십니까. 내일 예정된 회의 시간을 확인해 주실 수 있으실까요? 사전 준비 자료를 차질 없이 준비하고자 합니다.',
      note: '존댓말과 정중한 어조로 공손하게 변환됩니다.',
    }
  }
  if (selected.includes('concise') || selected.includes('conclusion')) {
    return {
      before,
      after: '내일 회의 시간 확인 요청의 건 (목적: 사전 자료 준비 및 공유)',
      note: '핵심 결론 위주로 빠르게 파악할 수 있게 압축됩니다.',
    }
  }
  if (selected.includes('casual')) {
    return {
      before,
      after: '내일 회의 몇 시에 진행할까요? 미리 자료 세팅해두려고 해요 😊',
      note: '친근하고 편안한 협업 톤앤매너로 변환됩니다.',
    }
  }
  if (selected.includes('detailed') || selected.includes('context')) {
    return {
      before,
      after: '안녕하세요. 내일 예정된 미팅과 관련하여, 필요한 발표 자료를 사전에 준비하여 원활한 회의가 될 수 있도록 정확한 시작 일정을 안내해 주시면 감사하겠습니다.',
      note: '배경 맥락과 목적을 풍부하게 기술하여 명확성을 높입니다.',
    }
  }
  return {
    before,
    after: '내일 회의 일정 확인 부탁드립니다. 사전 발표 자료 준비 후 공유드리겠습니다.',
    note: '스타일을 선택하면 AI가 실시간으로 변환 톤앤매너를 미리 보여줍니다.',
  }
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
  const profile = getUserProfile()
  const [selected, setSelected] = useState<PreferenceId[]>(profile.communicationPreferences.filter((id): id is PreferenceId => preferences.some(([preference]) => preference === id)))

  const togglePreference = (id: PreferenceId) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const preview = getStylePreview(selected)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await saveUserProfile({ communicationPreferences: selected, customStyle: String(form.get('customStyle') || '') })
    localStorage.setItem('onboarding.communication', 'true')
    navigate('/add-recipient')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f8f9fc] px-4 py-[clamp(60px,10vh,120px)] text-[#241912]" style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <ProgressIndicator />

      <section className="w-full max-w-160 rounded-2xl border border-[#e5e7ef] bg-white p-8 shadow-sm max-sm:px-5">
        <header className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="w-full text-2xl font-semibold leading-[31.2px] tracking-[-0.24px] text-black">평소 어떻게 소통하시나요?</h1>
          <p className="w-full text-sm leading-5.25 text-[#564334]">이 정보는 AI가 당신의 메시지 작성 스타일을 이해하는 데 사용됩니다.</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-6">
          <fieldset>
            <legend className="sr-only">선호하는 커뮤니케이션 방식</legend>
            <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
              {preferences.map(([id, label]) => {
                const isSelected = selected.includes(id)

                return (
                  <button key={id} type="button" aria-pressed={isSelected} onClick={() => togglePreference(id)} className={`flex h-16 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5]/25 ${isSelected ? 'border-[#6a54ee] bg-[#efedff] text-[#4f46e5] shadow-xs' : 'border-[#dadada] bg-white text-[#241912] hover:bg-[#fafafa]'}`}>
                    <PreferenceIcon name={id} className="h-4.5 w-4.5" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* AI 실시간 변환 미리보기 */}
          <div className="mt-5 rounded-xl border border-[#e5e1f8] bg-[#f8f7ff] p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-[#5531e8] flex items-center gap-1">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
                </svg>
                AI 스타일 실시간 미리보기
              </span>
              <span className="text-[10px] text-[#888]">{preview.note}</span>
            </div>

            <div className="space-y-2 text-[12px]">
              <div className="rounded-lg border border-[#e8e8ed] bg-white p-2.5">
                <span className="text-[10px] font-semibold text-[#888] block mb-0.5">원문 (Before)</span>
                <p className="text-[#555]">{preview.before}</p>
              </div>

              <div className="rounded-lg border border-[#cfc7ff] bg-[#faf9ff] p-2.5">
                <span className="text-[10px] font-semibold text-[#5531e8] block mb-0.5">변환 후 (After)</span>
                <p className="font-medium text-[#2f2e34] leading-relaxed">{preview.after}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="custom-style" className="block text-xs font-semibold text-[#5d5565] mb-1">직접 입력하기 (선택)</label>
            <textarea id="custom-style" name="customStyle" defaultValue={profile.customStyle} rows={2} placeholder="예: 비즈니스 용어를 많이 사용합니다, 이모지를 자주 씁니다..." className="block w-full resize-none rounded-lg border border-[#dadada] bg-white p-3 text-xs outline-none transition placeholder:text-[#999] focus:border-[#6a54ee] focus:ring-2 focus:ring-[#6a54ee]/10" />
          </div>

          <div className="mt-6 grid grid-cols-[140px_1fr] gap-3 border-t border-[#ececf1] pt-5">
            <button type="button" onClick={() => navigate('/profile-setup')} className="h-11 rounded-lg border border-[#e2e2e2] bg-white px-5 text-xs font-medium text-[#555] transition hover:bg-[#fafafa]">이전</button>
            <button type="submit" className="h-11 rounded-lg bg-[linear-gradient(90deg,#5b3df5_0%,#35248f_100%)] px-5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110">다음</button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default Communication
