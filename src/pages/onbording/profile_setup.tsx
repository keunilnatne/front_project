import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import gmailLogo from '../../images/gmail.png'
import notionLogo from '../../images/Notion.png'
import slackLogo from '../../images/slack.png'
import teamsLogo from '../../images/teams.png'

const roles = ['PM', '기획자', '디자이너', '개발자', '마케터', '팀 리더', '기타'] as const
const tools = [
  { name: 'Gmail', logo: gmailLogo },
  { name: 'Slack', logo: slackLogo },
  { name: 'Notion', logo: notionLogo },
  { name: 'Microsoft Teams', logo: teamsLogo },
  { name: '기타', logo: null },
] as const

type Role = (typeof roles)[number]
type Tool = (typeof tools)[number]['name']

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
  const [selectedTools, setSelectedTools] = useState<Tool[]>([])

  const toggleTool = (tool: Tool) => {
    setSelectedTools((current) =>
      current.includes(tool) ? current.filter((item) => item !== tool) : [...current, tool],
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
              <Field label="이름"><input required defaultValue="홍길동" className={inputClass} /></Field>
              <Field label="소속 회사"><input required placeholder="회사명" className={inputClass} /></Field>
            </div>
            <div className="mt-4"><Field label="직급"><input placeholder="예: 책임, 매니저, 팀장" className={inputClass} /></Field></div>

            <fieldset className="mt-8 border-y border-[#ececf1] py-4">
              <legend className="sr-only">직무 선택</legend>
              <p className="mb-2 text-[11px] font-medium leading-4 text-[#2f2b29]">직무 선택</p>
              <div className="flex min-h-9.75 flex-wrap items-start gap-2">
                {roles.map((role) => <button key={role} type="button" aria-pressed={selectedRole === role} onClick={() => setSelectedRole(role)} className={`h-7.75 rounded-full border px-3.25 text-[11px] transition ${selectedRole === role ? 'border-[#aaa5f4] bg-[#eeedff] text-[#5146d8]' : 'border-[#d8d5f5] bg-white text-[#574b45] hover:bg-[#f8f7ff]'}`}>{role}</button>)}
              </div>
            </fieldset>

            <fieldset className="border-b border-[#ececf1] py-4">
              <legend className="sr-only">주로 사용하는 업무 도구</legend>
              <p className="mb-2 text-[11px] font-medium leading-4 text-[#2f2b29]">주로 사용하는 업무 도구</p>
              <div className="grid min-h-21.5 grid-cols-3 content-start gap-2 max-sm:grid-cols-2">
                {tools.map(({ name, logo }) => { const active = selectedTools.includes(name); return <button key={name} type="button" aria-pressed={active} onClick={() => toggleTool(name)} className={`flex h-8.75 items-center gap-2 rounded-md border px-2 text-left text-[11px] transition ${active ? 'border-[#6a54ee] bg-[#efedff] text-[#4f46e5]' : 'border-[#e1e1e6] bg-white text-[#272321] hover:bg-[#fafafa]'}`}>{logo ? <img src={logo} alt="" className="h-4 w-4 shrink-0 object-contain" /> : <span aria-hidden="true" className="text-base leading-none">＋</span>}{name}</button> })}
              </div>
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
