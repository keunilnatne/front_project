import { type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const fields = [
  { label: '이름', name: 'name', placeholder: '장범수' },
  { label: '직무', name: 'job', placeholder: 'front' },
] as const

const inputClass = 'h-10 w-full rounded-lg border border-[#bcbcbc] bg-white px-4 py-[9px] text-sm leading-[17px] text-[#241912] outline-none transition placeholder:text-[#564334]/50 focus:border-[#5b3df5] focus:ring-2 focus:ring-[#5b3df5]/10'

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
    <label className="flex flex-col gap-1 text-xs leading-[16.8px] tracking-[0.12px] text-[#241912]">
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    localStorage.setItem('onboarding.recipient', 'true')
    navigate('/integrations')
  }

  const skipRecipient = () => {
    localStorage.setItem('onboarding.recipient', 'false')
    navigate('/integrations')
  }

  return (
    <main className="relative min-h-screen bg-[#f8f9fc] px-4 pb-16 pt-26.5 text-[#241912]" 
     style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <ProgressIndicator />

      <div className="mx-auto flex w-full max-w-120 flex-col gap-8">
        <header className="text-center">
          <h1 className="h-8 text-2xl font-semibold leading-[31.2px] tracking-[-0.24px]">
            자주 협업하는 사람을 추가해보세요</h1>
          <p className="mt-2 px-4 text-sm leading-5.25 text-[#564334]">
            협업할수록 AI가 상대방의 커뮤니케이션 방식을 더 정확하게 이해합니다.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <section className="min-h-[403.19px] rounded-xl border border-[#dbdbdb] border-l-2 border-l-[#5b3df5] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="mb-3.75 flex h-11.5 items-start gap-4 pb-1">
              <ProfileAvatar />
              <div>
                <p className="h-[17.8px] pb-[0.8px] text-xs leading-[16.8px] tracking-[0.12px] text-[#564334]">
                  Recipient Profile</p>
                <h2 className="text-lg font-semibold leading-[25.2px]">
                  New Connection</h2>
              </div>
            </div>

            <div className="flex flex-col gap-3.75">
              {fields.map((field) => (
                <Field key={field.name} label={field.label}>
                  <input name={field.name} required placeholder={field.placeholder} className={inputClass} />
                </Field>
              ))}

              <Field label="회사">
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xs">▦</span>
                  <input name="company" placeholder="ABC Company" className={`${inputClass} pl-9`} />
                </div>
              </Field>

              <Field label="관계">
                <select name="relationship" defaultValue="" className={`${inputClass} appearance-auto text-[#241912]`}>
                  <option value="" disabled>관계를 선택하세요 (예: 팀원)</option>
                  <option value="team-member">팀원</option>
                  <option value="manager">리더 / 매니저</option>
                  <option value="client">고객 / 클라이언트</option>
                  <option value="partner">외부 파트너</option>
                </select>
              </Field>
            </div>
          </section>

          <div className="pt-8 text-center">
            <button type="submit" className=
            "flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#5b3df5_0%,#35248f_100%)] text-xs leading-[16.8px] tracking-[0.12px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5b3df5]/20">
              추가하기 <span aria-hidden="true" className="text-lg leading-none">→</span>
            </button>
            <button type="button" onClick={skipRecipient} className="mt-4 h-[17.8px] text-xs leading-[16.8px] text-[#564334] transition hover:text-[#35248f] focus-visible:outline-none focus-visible:underline">
              나중에 추가하기</button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default AddRecipient
