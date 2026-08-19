import { useState, type ReactNode } from 'react'
import { getUserProfile, saveUserProfile } from '../../users/userProfile'
import { authorizationHeaders } from '../../users/authStorage'
import { requireOk } from '../../users/apiClient'
import { readUserStorage, writeUserStorage } from '../../users/storage'

type Strength = 'low' | 'normal' | 'high'
type PreferenceId = 'concise' | 'detailed' | 'conclusion' | 'context' | 'polite' | 'casual'

type AiSettings = {
  autoLearn: boolean
  autoUpdate: boolean
  strength: Strength
}

const SETTINGS_KEY = 'ieum.aiPersonalization'
const originalMessage = '이번 주 회의는 목요일로 미루는 게 어떨까요? 다들 바쁜 것 같아서요.'

const strengthOptions: { id: Strength; label: string; description: string }[] = [
  { id: 'low', label: '낮음', description: '문법 위주 교정' },
  { id: 'normal', label: '기본', description: '문맥에 최적화' },
  { id: 'high', label: '적극적', description: '구조 전체 재작성' },
]

const preferenceLabels: Record<PreferenceId, string> = {
  concise: '간결하게',
  detailed: '자세하게',
  conclusion: '결론부터',
  context: '맥락부터',
  polite: '격식있는',
  casual: '편하게',
}

const messageExamples: Record<PreferenceId, Record<Strength, string>> = {
  concise: {
    low: '이번 주 회의를 목요일로 미루는 건 어떨까요?',
    normal: '이번 주 회의를 목요일로 연기하고자 합니다. 의견 부탁드립니다.',
    high: '이번 주 회의를 목요일로 변경하겠습니다. 어려우시면 말씀해주세요.',
  },
  detailed: {
    low: '이번 주 일정이 바쁜 점을 고려해 회의를 목요일로 미루는 게 어떨까요?',
    normal: '이번 주 구성원들의 일정이 많은 점을 고려해 회의를 목요일로 연기하고자 합니다. 가능 여부를 알려주세요.',
    high: '원활한 참석과 충분한 준비 시간을 위해 이번 주 회의를 목요일로 조정하려고 합니다. 일정에 어려움이 있다면 가능한 시간을 함께 알려주세요.',
  },
  conclusion: {
    low: '회의를 목요일로 미루면 좋겠습니다. 이번 주 일정이 바쁜 것 같아요.',
    normal: '이번 주 회의를 목요일로 연기하고자 합니다. 모두의 일정이 바쁜 점을 고려했습니다.',
    high: '결론부터 말씀드리면, 이번 주 회의는 목요일로 변경하고자 합니다. 참석이 어려운 분은 의견 부탁드립니다.',
  },
  context: {
    low: '다들 이번 주 일정이 바쁜 것 같아서 회의를 목요일로 미루면 어떨까요?',
    normal: '이번 주에는 구성원들의 일정이 많아 보입니다. 원활한 참석을 위해 회의를 목요일로 미루는 것을 제안합니다.',
    high: '이번 주 업무 일정과 참석 가능 시간을 살펴보니 기존 회의 진행이 어려울 수 있습니다. 모두가 참석할 수 있도록 회의를 목요일로 조정하는 것이 어떨까요?',
  },
  polite: {
    low: '이번 주 회의를 목요일로 미루어도 괜찮을까요?',
    normal: '가능하시다면 이번 주 회의를 목요일로 연기하고자 합니다. 의견 부탁드립니다.',
    high: '바쁘신 일정 중 죄송하지만, 이번 주 회의를 목요일로 조정해도 괜찮을지 의견을 부탁드립니다.',
  },
  casual: {
    low: '이번 주 회의, 목요일로 미루는 건 어때요?',
    normal: '다들 이번 주 바쁜 것 같아요. 회의는 목요일로 미루면 어떨까요?',
    high: '이번 주는 다들 일정이 꽉 찬 것 같네요! 회의는 목요일로 옮겨보는 게 어떨까요?',
  },
}

function AiPersonalizationSection() {
  const profile = getUserProfile()
  const initialPreferences = getPreferences(profile.communicationPreferences)
  const initialSettings = getSettings()

  const [preferences, setPreferences] = useState<PreferenceId[]>(initialPreferences)
  const [activePreference, setActivePreference] = useState<PreferenceId>(initialPreferences[0] ?? 'concise')
  const [settings, setSettings] = useState(initialSettings)
  const [showTagOptions, setShowTagOptions] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || ''

  const updateSettings = async (changes: Partial<AiSettings>) => {
    const nextSettings = { ...settings, ...changes }
    if (changes.autoLearn !== undefined) {
      const response = await fetch(`${API_URL}/api/users/me/ai-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authorizationHeaders() },
        body: JSON.stringify({ aiAutoSuggestion: nextSettings.autoLearn }),
      })
      await requireOk(response, 'AI 학습 설정을 저장하지 못했습니다.')
    }
    setSettings(nextSettings)
    writeUserStorage(SETTINGS_KEY, JSON.stringify(nextSettings))
  }


  const removePreference = async (preference: PreferenceId) => {
    const nextPreferences = preferences.filter((item) => item !== preference)
    await saveUserProfile({ communicationPreferences: nextPreferences })
    setPreferences(nextPreferences)

    if (activePreference === preference) {
      setActivePreference(nextPreferences[0] ?? 'concise')
    }
  }

  const addPreference = async (preference: PreferenceId) => {
    const nextPreferences = [...preferences, preference]
    await saveUserProfile({ communicationPreferences: nextPreferences })
    setPreferences(nextPreferences)
    setActivePreference(preference)
    setShowTagOptions(false)
  }

  const availablePreferences = (Object.keys(preferenceLabels) as PreferenceId[]).filter(
    (preference) => !preferences.includes(preference),
  )

  return (
    <section id="ai-personalization" className="min-h-163.75 scroll-mt-8 overflow-hidden rounded-xl border border-[#e1e1e1] bg-white shadow-sm">
      <header className="border-b border-[#ececf0] p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#26262b]">
          <AiPersonalizationIcon />
          AI 개인화 (AI Personalization)
        </h2>
        <p className="mt-1 text-[12px] leading-5 text-[#777981]">AI가 사용자의 커뮤니케이션 스타일을 학습하고 최적화하는 방식을 세밀하게 조정합니다.</p>
      </header>

      <div className="p-6">
        <div className="space-y-3">
          <PreferenceRow title="AI 학습 활성화" description="과거 메시지와 문서를 기반으로 톤앤매너를 학습합니다.">
            <Toggle checked={settings.autoLearn} label="AI 학습 활성화" onChange={() => { void updateSettings({ autoLearn: !settings.autoLearn }).catch(() => undefined) }} />
          </PreferenceRow>
          <PreferenceRow title="자동 협업 프로파일 업데이트" description="자주 소통하는 팀원의 커뮤니케이션 선호도를 자동 반영합니다.">
            <Toggle checked={settings.autoUpdate} label="자동 협업 프로파일 업데이트" onChange={() => { void updateSettings({ autoUpdate: !settings.autoUpdate }).catch(() => undefined) }} />
          </PreferenceRow>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-[12px] font-medium">AI 제안 강도</p>
          <div className="grid grid-cols-3 gap-3">
            {strengthOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={settings.strength === option.id}
                onClick={() => { void updateSettings({ strength: option.id }).catch(() => undefined) }}
                className={`h-17 rounded-lg border text-center transition-colors ${settings.strength === option.id ? 'border-[#aaa2f3] bg-[#dedbff] text-[#332d7d] shadow-[0_0_0_1px_rgba(170,162,243,0.2)]' : 'border-[#e2e2e5] bg-white hover:bg-[#faf9ff]'}`}
              >
                <strong className="block text-[12px] font-medium">{option.label}</strong>
                <span className="mt-1 block text-[10px] text-[#777281]">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[12px] font-medium">메시지 생성 선호도 (Tags)</p>
          <p className="mt-1 text-[10px] text-[#7b7783]">태그를 선택하면 해당 스타일의 AI 출력 예시를 확인할 수 있습니다.</p>

          <div className="relative mt-3 flex flex-wrap gap-2">
            {preferences.map((preference) => (
              <PreferenceTag
                key={preference}
                label={preferenceLabels[preference]}
                selected={activePreference === preference}
                onSelect={() => setActivePreference(preference)}
                onRemove={() => { void removePreference(preference).catch(() => undefined) }}
              />
            ))}

            {availablePreferences.length > 0 && (
              <button type="button" onClick={() => setShowTagOptions(!showTagOptions)} className="rounded-full border border-dashed border-[#cbc7da] bg-white px-3 py-1 text-[10px] text-[#615d68] hover:border-[#8f87db]">
                + 태그 추가
              </button>
            )}

            {showTagOptions && (
              <div className="absolute top-8 left-0 z-10 flex max-w-[320px] flex-wrap gap-2 rounded-lg border border-[#d8d5e7] bg-white p-3 shadow-lg">
                {availablePreferences.map((preference) => (
                  <button key={preference} type="button" onClick={() => { void addPreference(preference).catch(() => undefined) }} className="rounded-full bg-[#f0edff] px-3 py-1 text-[10px] text-[#5146e5] hover:bg-[#e3deff]">
                    {preferenceLabels[preference]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <MessagePreview preference={preferences.includes(activePreference) ? activePreference : null} strength={settings.strength} />
        </div>
      </div>
    </section>
  )
}

function PreferenceRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={onChange} className="relative h-5 w-10 shrink-0 rounded-full bg-[#d8d8dc]">
      <span className={`absolute -top-0.5 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm transition-all ${checked ? 'left-5 bg-[#4938d5]' : 'left-0 bg-[#99999f]'}`}>
        {checked && <CheckIcon />}
      </span>
    </button>
  )
}

function PreferenceTag({ label, selected, onSelect, onRemove }: { label: string; selected: boolean; onSelect: () => void; onRemove: () => void }) {
  return (
    <span className={`flex items-center rounded-full border text-[10px] transition-colors ${selected ? 'border-[#aaa2f3] bg-[#dedbff] text-[#4338ca] shadow-[0_0_0_1px_rgba(170,162,243,0.16)]' : 'border-[#ddd9e6] bg-white text-[#625e68] hover:border-[#c8c2ef] hover:bg-[#faf9ff]'}`}>
      <button type="button" aria-pressed={selected} onClick={onSelect} className="flex items-center gap-1.5 py-1 pl-3 font-medium">
        {selected && <CheckIcon />}
        {label}
      </button>
      <button type="button" onClick={onRemove} aria-label={`${label} 태그 삭제`} className="px-2 py-1 text-[13px] leading-none">×</button>
    </span>
  )
}

function MessagePreview({ preference, strength }: { preference: PreferenceId | null; strength: Strength }) {
  return (
    <div className="mt-5 min-h-26.5 rounded-lg border border-[#d8d5df] bg-white p-4 text-[11px] leading-5 text-[#4f4b54] shadow-sm">
      <p className="font-medium text-[#5146e5]">AI 출력 미리보기</p>
      {preference ? (
        <>
          <p className="mt-2 text-[#8a858e] line-through">“{originalMessage}”</p>
          <div className="mt-2 flex gap-3">
            <span aria-hidden="true" className="font-semibold text-[#5146e5]">↳</span>
            <div>
              <p>“{messageExamples[preference][strength]}”</p>
              <p className="mt-1 text-[10px] text-[#8a858e]">{preferenceLabels[preference]} · {strengthOptions.find((option) => option.id === strength)?.label} 강도 적용</p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-[#8a858e]">태그를 추가하면 메시지 변환 예시를 확인할 수 있습니다.</p>
      )}
    </div>
  )
}

function getPreferences(preferences: string[]) {
  const validPreferences = Object.keys(preferenceLabels) as PreferenceId[]
  return preferences.filter((preference): preference is PreferenceId => validPreferences.includes(preference as PreferenceId))
}

function getSettings(): AiSettings {
  const defaultSettings: AiSettings = { autoLearn: true, autoUpdate: true, strength: 'normal' }

  try {
    const savedSettings = readUserStorage(SETTINGS_KEY)
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

function AiPersonalizationIcon() {
  return (
    <svg aria-hidden="true" width="16.5" height="16.5" viewBox="0 0 16.5 16.5" fill="none" className="shrink-0 text-[#4338CA]">
      <path d="M6.25 1.25c.35 2.68 1.82 4.15 4.5 4.5-2.68.35-4.15 1.82-4.5 4.5-.35-2.68-1.82-4.15-4.5-4.5 2.68-.35 4.15-1.82 4.5-4.5Z" fill="currentColor" />
      <path d="M12.35 9.15c.22 1.65 1.13 2.56 2.78 2.78-1.65.22-2.56 1.13-2.78 2.78-.22-1.65-1.13-2.56-2.78-2.78 1.65-.22 2.56-1.13 2.78-2.78Z" fill="currentColor" />
      <circle cx="13.7" cy="3.05" r="1.05" fill="currentColor" />
    </svg>
  )
}

function CheckIcon() {
  return <svg aria-hidden="true" width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="m3 6.5 2.1 2.1L10 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

export default AiPersonalizationSection
