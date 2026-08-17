import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile, saveUserProfile } from '../../users/userProfile'

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

function ProfileSetup() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const profile = getUserProfile()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const role = selectedRole === '기타'
      ? String(form.get('customRole')).trim()
      : selectedRole || profile.role
    saveUserProfile({ name: String(form.get('name')), company: String(form.get('company')), position: String(form.get('position')), role })
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
            <div className="mt-4"><Field label="직급"><input name="position" defaultValue={profile.position} placeholder="예: 책임, 매니저, 팀장" className={inputClass} /></Field></div>

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