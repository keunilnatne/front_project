import { useState, type ReactNode } from 'react'

type SettingLayoutProps = {
  account: ReactNode
  personalization: ReactNode
  integrations: ReactNode
  security: ReactNode
}

const menus = [
  { id: 'account', label: '계정', stage: 1 },
  { id: 'ai-personalization', label: 'AI 개인화', stage: 1 },
  { id: 'integrations', label: '연결', stage: 2 },
  { id: 'security', label: '보안 및 개인정보', stage: 3 },
]

function MoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e1e1e1] bg-white text-[13px] font-semibold text-[#5146e5] shadow-sm transition hover:border-[#bbb5fa] hover:bg-[#f8f7ff]"
    >
      {label}
      <span aria-hidden="true">⌄</span>
    </button>
  )
}

function SettingLayout({ account, personalization, integrations, security }: SettingLayoutProps) {
  const [visibleStage, setVisibleStage] = useState(1)

  const moveTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showNext = (stage: number, id: string) => {
    setVisibleStage(stage)
    window.setTimeout(() => moveTo(id), 80)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafbfc] text-[#26262b]">
      <div className="mx-auto flex w-full max-w-350 items-start gap-5 px-8 pt-8 pb-32 max-md:flex-col max-md:px-4 max-md:pt-5">
        <aside className="sticky top-8 h-fit w-64 shrink-0 max-lg:w-48 max-md:static max-md:w-full">
          <h1 className="mb-5 text-[20px] font-semibold">설정</h1>

          <nav aria-label="설정 메뉴" className="flex flex-col gap-1 text-[13px] max-md:flex-row max-md:overflow-x-auto max-md:pb-2">
            {menus.map((menu) => (
              <button
                key={menu.id}
                type="button"
                disabled={visibleStage < menu.stage}
                onClick={() => moveTo(menu.id)}
                className={`h-10 rounded-lg px-4 text-left whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  menu.id === 'account'
                    ? 'bg-[#f0edff] font-semibold text-[#5146e5]'
                    : 'text-[#565861] hover:bg-white'
                }`}
              >
                {menu.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex w-full max-w-175 min-w-0 flex-col gap-8">
          {account}
          {personalization}

          {visibleStage === 1 && (
            <MoreButton label="연결 설정 더보기" onClick={() => showNext(2, 'integrations')} />
          )}

          {visibleStage >= 2 && integrations}

          {visibleStage === 2 && (
            <MoreButton label="보안 및 개인정보 더보기" onClick={() => showNext(3, 'security')} />
          )}

          {visibleStage >= 3 && security}
        </main>
      </div>
    </div>
  )
}

export default SettingLayout
