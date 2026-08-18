import { useState, type ReactNode } from 'react'

type SettingLayoutProps = {
  account: ReactNode
  integrations: ReactNode
  security: ReactNode
}

const menus = [
  { id: 'account', label: '계정' },
  { id: 'integrations', label: '연결' },
  { id: 'security', label: '보안 및 개인정보' },
]

function SettingLayout({ account, integrations, security }: SettingLayoutProps) {
  const [activeMenu, setActiveMenu] = useState('account')

  const moveTo = (id: string) => {
    setActiveMenu(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
                onClick={() => moveTo(menu.id)}
                className={`h-10 rounded-lg px-4 text-left whitespace-nowrap transition cursor-pointer ${
                  activeMenu === menu.id
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
          {integrations}
          {security}
        </main>
      </div>
    </div>
  )
}

export default SettingLayout
