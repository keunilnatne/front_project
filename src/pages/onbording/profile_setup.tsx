import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile, saveUserProfile } from '../../users/userProfile'
import { getCountryInfo } from '../../users/countryTimezones'

const roles = ['PM', '기획자', '디자이너', '개발자', '마케터', '팀 리더', '기타'] as const

type Role = (typeof roles)[number]

const inputClass = 'h-10 min-w-0 rounded-lg border border-[#e5e7ef] bg-white px-2 py-[9px] text-xs font-normal outline-none transition placeholder:text-[#999] focus:border-[#6a54ee] focus:ring-2 focus:ring-[#6a54ee]/10'

function ProgressIndicator() {
  return (
    <nav aria-label="온보딩 진행 상황" className="flex h-3.75 w-full max-w-4xl items-center justify-center gap-1">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} aria-current={index === 1 ? 'step' : undefined} className={`h-0.75 w-8 rounded-full ${index === 1 ? 'bg-[#4f46e5]' : 'bg-[#c9c8f4]'}`} />
      ))}
    </nav>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-[11px] font-medium leading-[17.8px] text-[#2f2b29]">
      {label}{children}
    </label>
  )
}

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00'
]

function ProfileSetup() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const profile = getUserProfile()

  const [selectedCountry, setSelectedCountry] = useState(profile.country || '대한민국')
  const [selectedLanguage, setSelectedLanguage] = useState(profile.language || 'Korean')
  const [selectedTimezone, setSelectedTimezone] = useState(profile.timezone || 'Asia/Seoul')

  const rawHours = profile.workHours || '09:00 - 18:00'
  const parts = rawHours.split(/[-~]/).map((s) => s.trim())
  const [startHour, setStartHour] = useState(parts[0] || '09:00')
  const [endHour, setEndHour] = useState(parts[1] || '18:00')

  const onCountryChange = (countryName: string) => {
    setSelectedCountry(countryName)
    const info = getCountryInfo(countryName)
    setSelectedLanguage(info.language)
    setSelectedTimezone(info.defaultTimezone)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const role = selectedRole === '기타'
      ? String(form.get('customRole')).trim()
      : selectedRole || profile.role
    const workHours = `${startHour} - ${endHour}`
    await saveUserProfile({
      name: String(form.get('name')),
      company: String(form.get('company')),
      position: String(form.get('position')),
      country: selectedCountry,
      language: selectedLanguage,
      timezone: selectedTimezone,
      role,
      workHours,
    })
    localStorage.setItem('onboarding.profile', 'true')
    navigate('/communication')
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-[clamp(48px,15.27vh,152.53px)] text-[#17171c]" style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4.25">
        <ProgressIndicator />
        <section className="w-full max-w-160 rounded-xl border border-[#e5e7ef] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-sm:p-5">
          <header className="flex h-[61.2px] flex-col items-center gap-[8.2px] text-center">
            <h1 className="text-2xl font-semibold leading-[31.2px] tracking-[-0.24px] text-black">먼저 당신에 대해 알려주세요</h1>
            <p className="text-sm leading-5.25 text-[#564334]">원활한 소통을 위해 기본 프로필을 설정합니다.</p>
          </header>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col">
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="이름"><input name="name" required defaultValue={profile.name} className={inputClass} /></Field>
              <Field label="소속 회사"><input name="company" required defaultValue={profile.company} placeholder="회사명" className={inputClass} /></Field>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="직급"><input name="position" defaultValue={profile.position} placeholder="예: 책임, 매니저, 팀장" className={inputClass} /></Field>
              <Field label="업무 시간">
                <div className="flex items-center gap-1.5">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="h-9.5 flex-1 rounded-md border border-[#ddc1ae] bg-white px-2 text-xs font-medium text-[#564334] outline-none focus:border-[#5b3df5]"
                  >
                    {TIME_OPTIONS.map((t) => <option key={`onboard-s-${t}`} value={t}>{t}</option>)}
                  </select>
                  <span className="text-[#888] font-semibold text-xs">~</span>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="h-9.5 flex-1 rounded-md border border-[#ddc1ae] bg-white px-2 text-xs font-medium text-[#564334] outline-none focus:border-[#5b3df5]"
                  >
                    {TIME_OPTIONS.map((t) => <option key={`onboard-e-${t}`} value={t}>{t}</option>)}
                  </select>
                </div>
              </Field>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              <Field label="국가">
                <select
                  value={selectedCountry}
                  onChange={(e) => onCountryChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#e5e7ef] bg-white px-2 text-xs font-normal text-[#241912] outline-none focus:border-[#6a54ee]"
                >
                  <option value="대한민국">대한민국</option>
                  <option value="미국">미국</option>
                  <option value="일본">일본</option>
                  <option value="중국">중국</option>
                  <option value="영국">영국</option>
                  <option value="독일">독일</option>
                  <option value="프랑스">프랑스</option>
                  <option value="싱가포르">싱가포르</option>
                  <option value="인도">인도</option>
                  <option value="호주">호주</option>
                  <option value="캐나다">캐나다</option>
                  <option value="베트남">베트남</option>
                </select>
              </Field>

              <Field label="언어">
                <input
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className={inputClass}
                  placeholder="Korean, English 등"
                />
              </Field>

              <Field label="시간대">
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#e5e7ef] bg-white px-2 text-xs font-normal text-[#241912] outline-none focus:border-[#6a54ee]"
                >
                  {getCountryInfo(selectedCountry).availableTimezones.map((tz) => (
                    <option key={`profile-tz-${tz.value}`} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <fieldset className="mt-8 border-y border-[#ececf1] py-4">
              <legend className="sr-only">직무 선택</legend>
              <p className="mb-2 text-[11px] font-medium leading-4 text-[#2f2b29]">직무 선택</p>
              <div className="flex min-h-9.75 flex-wrap items-start gap-2">
                {roles.map((role) => <button key={role} type="button" aria-pressed={selectedRole === role} onClick={() => setSelectedRole(role)} className={`h-7.75 rounded-full border px-3.25 text-[11px] transition ${selectedRole === role ? 'border-[#aaa5f4] bg-[#eeedff] text-[#5146d8]' : 'border-[#d8d5f5] bg-white text-[#574b45] hover:bg-[#f8f7ff]'}`}>{role}</button>)}
              </div>
              {selectedRole === '기타' && (
                <div className="mt-3">
                  <Field label="직무 직접 입력">
                    <input
                      name="customRole"
                      required
                      autoFocus
                      placeholder="예: 데이터 분석가"
                      className={`${inputClass} w-full`}
                    />
                  </Field>
                </div>
              )}
            </fieldset>

            <div className="flex min-h-[76.19px] items-end gap-4 pt-4">
              <button type="button" onClick={() => navigate('/welcome')} className="h-[43.19px] w-20.5 shrink-0 rounded-lg border border-[#ddc1ae] bg-white px-6 text-[13px] text-[#564334] transition hover:bg-[#faf7f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5b3df5]/25">이전</button>
              <button type="submit" className="ml-auto h-[41.19px] w-72.25 max-w-full rounded-lg bg-[linear-gradient(90deg,#5b3df5_0%,#35248f_100%)] px-6 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5b3df5]/20">다음</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default ProfileSetup