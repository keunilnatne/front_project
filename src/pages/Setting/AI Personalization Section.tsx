import { useState } from 'react'

type Tone = 'formal' | 'balance' | 'casual'

const toneOptions: { value: Tone; label: string; description: string }[] = [
  { value: 'formal', label: '낮음', description: '문법 위주 교정' },
  { value: 'balance', label: '기본', description: '균형있게 제안' },
  { value: 'casual', label: '적극적', description: '고급 표현 제안' },
]

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full ${checked ? 'bg-[#5146e5]' : 'bg-[#c9cbd2]'}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

function AiPersonalizationSection() {
  const [autoLearn, setAutoLearn] = useState(true)
  const [styleSuggestions, setStyleSuggestions] = useState(true)
  const [tone, setTone] = useState<Tone>('balance')

  return (
    <section id="ai-personalization" className="min-h-163.75 scroll-mt-8 overflow-hidden rounded-xl border border-[#e1e1e1] bg-white shadow-sm">
      <header className="border-b border-[#ececf0] p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#26262b]">
          <AiPersonalizationIcon />
          AI 개인화 (AI Personalization)
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-[#777981]">AI가 사용자의 커뮤니케이션 스타일을 학습하고 최적화하는 방식을 설정할 수 있습니다.</p>
      </header>

      <div className="p-6">
        <div className="space-y-3">
          <PreferenceRow title="AI 자동 학습" description="내가 작성한 메시지를 기반으로 스타일을 학습합니다.">
            <Toggle label="AI 자동 학습" checked={autoLearn} onChange={() => setAutoLearn(!autoLearn)} />
          </PreferenceRow>
          <PreferenceRow title="자동 문장 스타일 제안" description="자주 사용하는 표현에 맞게 자연스러운 대안을 제안합니다.">
            <Toggle label="자동 문장 스타일 제안" checked={styleSuggestions} onChange={() => setStyleSuggestions(!styleSuggestions)} />
          </PreferenceRow>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-[12px] font-medium">AI 제안 강도</p>
          <div className="grid grid-cols-3 gap-3">
            {toneOptions.map((option) => {
              const selected = tone === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTone(option.value)}
                  className={`h-17 rounded-lg border text-center ${selected ? 'border-[#aaa2f3] bg-[#dedbff] text-[#332d7d]' : 'border-[#e2e2e5] hover:bg-[#faf9ff]'}`}
                >
                  <strong className="block text-[12px]">{option.label}</strong>
                  <span className="mt-1 block text-[10px] text-[#777982]">{option.description}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-medium">메시지 스타일 선호도 (Tone)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['간결한', '친근한', '명확한', '격식 있는'].map((tag, index) => (
              <span key={tag} className={`rounded-full px-3 py-1 text-[10px] ${index === 0 ? 'bg-[#e3deff] text-[#5146e5]' : 'bg-[#f2f2f4] text-[#62646c]'}`}>{tag}</span>
            ))}
          </div>

          <div className="mt-4 min-h-27 rounded-lg border border-[#dedee3] bg-[#fcfcfd] p-4 text-[11px] leading-5 text-[#555861]">
            <p className="font-medium text-[#5146e5]">AI 분석 메모</p>
            <p className="mt-2">명확하면서도 부담스럽지 않은 문장을 선호하는 것으로 보여요.</p>
            <p className="mt-2 border-l-2 border-[#8d83f4] pl-3">“결론을 먼저 공유한 후, 필요한 근거를 간단히 덧붙이는 방식이 잘 맞습니다.”</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function AiPersonalizationIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16.5"
      height="16.5"
      viewBox="0 0 16.5 16.5"
      fill="none"
      className="shrink-0 text-[#4338CA]"
    >
      <path d="M6.25 1.25c.35 2.68 1.82 4.15 4.5 4.5-2.68.35-4.15 1.82-4.5 4.5-.35-2.68-1.82-4.15-4.5-4.5 2.68-.35 4.15-1.82 4.5-4.5Z" fill="currentColor" />
      <path d="M12.35 9.15c.22 1.65 1.13 2.56 2.78 2.78-1.65.22-2.56 1.13-2.78 2.78-.22-1.65-1.13-2.56-2.78-2.78 1.65-.22 2.56-1.13 2.78-2.78Z" fill="currentColor" />
      <circle cx="13.7" cy="3.05" r="1.05" fill="currentColor" />
    </svg>
  )
}

function PreferenceRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-18 items-center justify-between gap-5 rounded-lg border border-[#e2e2e5] px-4 py-3">
      <div>
        <p className="text-[13px] font-medium">{title}</p>
        <p className="mt-1 text-[11px] text-[#7b7d85]">{description}</p>
      </div>
      {children}
    </div>
  )
}

export default AiPersonalizationSection
