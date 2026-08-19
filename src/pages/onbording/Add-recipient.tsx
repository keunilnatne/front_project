import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRecipient, fetchRecipientByEmail } from '../../users/recipients'
import { getCountryInfo } from '../../users/countryTimezones'

const countries = [
  '대한민국', '미국', '일본', '중국', '영국', '캐나다', '호주', '뉴질랜드',
  '싱가포르', '인도', '독일', '프랑스', '이탈리아', '스페인', '네덜란드', '벨기에',
  '스위스', '스웨덴', '노르웨이', '덴마크', '핀란드', '폴란드', '오스트리아', '아일랜드',
  '포르투갈', '체코', '브라질', '멕시코', '아르헨티나', '칠레', '베트남', '태국',
  '필리핀', '인도네시아', '말레이시아', '아랍에미리트', '이스라엘', '터키', '남아프리카 공화국',
] as const

const DEFAULT_STYLE_TAGS = [
  '편안하고 친근하게',
  '명확하고 간결하게',
  '격식 있고 정중하게',
  '핵심 요약 위주',
  '상세한 설명 선호',
  '빠른 피드백 선호',
  '논리적/데이터 중심',
]

const inputClass = 'h-10 w-full rounded-lg border border-[#bcbcbc] bg-white px-3.5 py-[9px] text-xs leading-[17px] text-[#241912] outline-none transition placeholder:text-[#564334]/50 focus:border-[#5b3df5] focus:ring-2 focus:ring-[#5b3df5]/10'

function ProgressIndicator() {
  return (
    <nav aria-label="온보딩 진행 상황" className="absolute top-8 left-1/2 flex h-3.75 w-[calc(100%-32px)] max-w-4xl -translate-x-1/2 items-center justify-center gap-1">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} aria-current={index === 3 ? 'step' : undefined} className={`h-0.75 w-8 rounded-full ${index === 3 ? 'bg-[#4f46e5]' : 'bg-[#c9c8f4]'}`} />
      ))}
    </nav>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium leading-[16.8px] tracking-[0.12px] text-[#241912]">
      {label}{children}
    </label>
  )
}

function ProfileAvatar() {
  return (
    <span aria-hidden="true" className="relative flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-full bg-[#facc15]">
      <span className="absolute top-2 h-3 w-3 rounded-full bg-white" />
      <span className="absolute bottom-1.5 h-3.5 w-6 rounded-t-full bg-white" />
    </span>
  )
}

function AddRecipient() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [country, setCountry] = useState('대한민국')
  const [language, setLanguage] = useState('Korean')
  const [timezone, setTimezone] = useState('Asia/Seoul')
  const [relationship, setRelationship] = useState('팀원')
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['명확하고 간결하게'])
  const [customStyle, setCustomStyle] = useState('')

  const getNextPath = () => {
    const isGoogle = localStorage.getItem('auth.isGoogleLogin') === 'true' || localStorage.getItem('onboarding.gmail') === 'true'
    return isGoogle ? '/complete' : '/integrations'
  }

  const handleCountryChange = (countryName: string) => {
    setCountry(countryName)
    const info = getCountryInfo(countryName)
    setLanguage(info.language)
    setTimezone(info.defaultTimezone)
  }

  const handleLookupProfile = async () => {
    if (!email || !email.includes('@')) {
      setLookupMessage({ type: 'error', text: '올바른 이메일 주소를 입력해 주세요.' })
      return
    }
    setLookupLoading(true)
    setLookupMessage(null)
    try {
      const found = await fetchRecipientByEmail(email)
      const rawComm = found.communicationStyle as unknown
      const commStyles = Array.isArray(rawComm) && rawComm.length
        ? (rawComm as string[])
        : (typeof rawComm === 'string' && rawComm
          ? (rawComm as string).split(',').map((s: string) => s.trim()).filter(Boolean)
          : (found.preferredStyle ? found.preferredStyle.split(',').map((s: string) => s.trim()).filter(Boolean) : []))

      if (found.name) setName(found.name)
      if (found.role) setRole(found.role)
      if (found.company) setCompany(found.company)
      if (found.country) {
        setCountry(found.country)
        const info = getCountryInfo(found.country)
        setLanguage(found.language || info.language)
        setTimezone(found.timezone || info.defaultTimezone)
      } else {
        if (found.language) setLanguage(found.language)
        if (found.timezone) setTimezone(found.timezone)
      }
      if (found.organizationRelation) setRelationship(found.organizationRelation)
      if (found.customStyle) setCustomStyle(found.customStyle)
      if (commStyles.length > 0) {
        setSelectedStyles(commStyles)
      }

      setLookupMessage({
        type: 'success',
        text: `가입된 회원 정보를 불러왔습니다: ${found.name || '이름 미설정'} (${found.company || '회사 미설정'})`,
      })
    } catch {
      setLookupMessage({
        type: 'error',
        text: '해당 이메일로 등록된 사용자/수신자 정보를 찾을 수 없습니다. 직접 입력해 주세요.',
      })
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim() || `${trimmedName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'recipient'}${Date.now().toString().slice(-4)}@example.com`

    setSubmitting(true)
    try {
      await createRecipient({
        name: trimmedName,
        email: trimmedEmail,
        role: role.trim() || '팀원',
        company: company.trim() || '회사 미지정',
        country,
        language,
        timezone,
        organizationRelation: relationship,
        responseSpeed: '보통',
        averageResponseMinutes: 0,
        collaborationActivity: 'Medium',
        isOnline: false,
        isFavorite: false,
        isRecent: true,
        verifiedExpert: false,
        fullTime: true,
        avatar: trimmedName.slice(0, 1) || '?',
        communicationStyle: selectedStyles.length > 0 ? selectedStyles : ['명확하고 간결하게'],
        preferredStyle: selectedStyles.join(', '),
        customStyle: customStyle.trim(),
      })
    } catch {
      // fallback
    } finally {
      setSubmitting(false)
    }

    localStorage.setItem('onboarding.recipient', 'true')
    navigate(getNextPath())
  }

  const skipRecipient = () => {
    localStorage.setItem('onboarding.recipient', 'false')
    navigate(getNextPath())
  }

  return (
    <main className="relative min-h-screen bg-[#f8f9fc] px-4 pb-16 pt-26.5 text-[#241912]" 
      style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <ProgressIndicator />

      <div className="mx-auto flex w-full max-w-140 flex-col gap-6">
        <header className="text-center">
          <h1 className="text-2xl font-semibold leading-[31.2px] tracking-[-0.24px]">
            자주 협업하는 사람을 추가해보세요</h1>
          <p className="mt-2 px-4 text-sm leading-5.25 text-[#564334]">
            협업할수록 AI가 상대방의 커뮤니케이션 방식을 더 정확하게 이해합니다.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <section className="rounded-xl border border-[#dbdbdb] border-l-4 border-l-[#5b3df5] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="mb-4 flex items-center justify-between border-b border-[#f0f0f4] pb-4">
              <div className="flex items-center gap-3">
                <ProfileAvatar />
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12px] text-[#5b3df5]">
                    Recipient Profile</p>
                  <h2 className="text-base font-bold text-[#1f1d2b]">
                    수신자 등록</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLookupProfile}
                  disabled={lookupLoading}
                  className="rounded-lg border border-[#5b3df5]/30 bg-[#f4f2ff] px-3 py-1.5 text-[11px] font-semibold text-[#5b3df5] transition hover:bg-[#eae6ff] active:scale-95 disabled:opacity-50"
                >
                  {lookupLoading ? '조회 중...' : '🔍 이메일로 프로필 불러오기'}
                </button>
              </div>
            </div>

            {lookupMessage && (
              <div
                className={`mb-4 rounded-lg px-3 py-2 text-xs font-medium ${
                  lookupMessage.type === 'success'
                    ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                    : 'bg-[#fef2f2] text-[#991b1b] border border-[#fecaca]'
                }`}
              >
                {lookupMessage.text}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5 max-sm:grid-cols-1">
              <Field label="이름 *">
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  className={inputClass}
                />
              </Field>

              <Field label="이메일 *">
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={inputClass}
                />
              </Field>

              <Field label="직무 *">
                <input
                  name="job"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="예: 프론트엔드 개발자, PM"
                  className={inputClass}
                />
              </Field>

              <Field label="소속 회사">
                <input
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="회사명"
                  className={inputClass}
                />
              </Field>

              <Field label="국가">
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={`${inputClass} appearance-auto text-[#241912]`}
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="언어">
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Korean, English 등"
                  className={inputClass}
                />
              </Field>

              <Field label="시간대">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={`${inputClass} appearance-auto text-[#241912]`}
                >
                  {getCountryInfo(country).availableTimezones.map((tz) => (
                    <option key={`add-tz-${tz.value}`} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="조직 관계">
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className={`${inputClass} appearance-auto text-[#241912]`}
                >
                  <option value="팀원">팀원</option>
                  <option value="타팀 동료">타팀 동료</option>
                  <option value="리더 / 매니저">리더 / 매니저</option>
                  <option value="외부 파트너">외부 파트너</option>
                  <option value="고객 / 클라이언트">고객 / 클라이언트</option>
                </select>
              </Field>
            </div>

            {/* 추구하는 소통 스타일 (태그 선택) */}
            <div className="mt-4 border-t border-[#f0f0f4] pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#5d5565]">
                  추구하는 소통 스타일 (태그 선택)
                </span>
                <span className="text-[10px] text-[#716b78]">
                  {selectedStyles.length}개 선택됨
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...DEFAULT_STYLE_TAGS, ...selectedStyles])).map((styleTag) => {
                  const isSelected = selectedStyles.includes(styleTag)
                  return (
                    <button
                      key={styleTag}
                      type="button"
                      onClick={() => {
                        setSelectedStyles((prev) =>
                          prev.includes(styleTag)
                            ? prev.filter((t) => t !== styleTag)
                            : [...prev, styleTag]
                        )
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition cursor-pointer ${
                        isSelected
                          ? 'border border-[#4f46e5] bg-[#4f46e5] text-white shadow-sm'
                          : 'border border-[#d8d5f5] bg-[#f8f7ff] text-[#4f46e5] hover:bg-[#eceaff]'
                      }`}
                    >
                      <span className="text-[10px]">{isSelected ? '✓' : '+'}</span>
                      <span>{styleTag}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-[#5d5565] mb-1">
                  추가 스타일 / 어조 (선택)
                </label>
                <input
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="예: 비즈니스 용어를 많이 사용합니다, 이모지를 자주 씁니다..."
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <div className="pt-6 text-center">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#5b3df5_0%,#35248f_100%)] text-xs font-semibold leading-[16.8px] tracking-[0.12px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:brightness-110 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5b3df5]/20"
            >
              {submitting ? '수신자 추가 중...' : '수신자 등록 완료'} <span aria-hidden="true" className="text-lg leading-none">→</span>
            </button>
            <button type="button" onClick={skipRecipient} className="mt-3.5 h-[17.8px] text-xs leading-[16.8px] text-[#564334] transition hover:text-[#35248f] focus-visible:outline-none focus-visible:underline">
              나중에 추가하기</button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default AddRecipient
