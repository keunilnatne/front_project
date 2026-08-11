import { Link } from 'react-router-dom'

const steps = [
  { number: '1', label: '메시지 작성', icon: '✎', color: '#7c3aed' },
  { number: '2', label: '수신자 선택', icon: '○', color: '#16c7a2' },
  { number: '3', label: 'AI 최적화', icon: '✦', color: '#3b82f6' },
]

function DashboardPage() {
  return (
    <div className="min-h-256 bg-[#f8f9fc] text-[#24242a]">
      <header className="flex h-16 items-center justify-between border-b border-[#e5e7eb] bg-white px-8">
        <label className="flex h-10 w-110 items-center gap-3 rounded-md border border-[#dfe1e6] px-4 text-[#91939a] focus-within:border-[#6952e8]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input type="search" placeholder="메시지 또는 팀 멤버 검색" className="min-w-0 flex-1 bg-transparent text-sm text-[#313238] outline-none placeholder:text-[#a0a1a8]" />
        </label>
        <div className="flex items-center gap-4 text-[#666870]">
          <button type="button" aria-label="알림" className="relative rounded-full p-1 hover:bg-[#f1f2f6]">
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-500" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6.5 16.5h11l-1.5-2V10a4 4 0 0 0-8 0v4.5l-1.5 2Z" stroke="currentColor" strokeWidth="1.7" /><path d="M10 19a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" /></svg>
          </button>
          <button type="button" aria-label="도움말" className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-sm hover:bg-[#f1f2f6]">?</button>
        </div>
      </header>

      <main className="min-h-213.75 px-8 pb-12 pt-6">
        <section className="flex h-67 w-161.75 items-center justify-between overflow-hidden rounded-lg border border-[#ded9f4] bg-[#f2efff] px-8">
          <div className="max-w-92.5">
            <h1 className="text-[25px] font-extrabold leading-[1.28] tracking-[-0.03em]">AI가 당신의 메시지를<br />상황에 맞게 최적화해드려요</h1>
            <p className="mt-4 text-[13px] leading-5 text-[#777982]">빠르고, 정확하고, 매너있는 커뮤니케이션을 시작해보세요.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/messages" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#5138d9] px-5 text-[13px] font-semibold text-white hover:bg-[#432ac7]">✎ 새 메시지 작성</Link>
              <Link to="/history" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#ded9ee] bg-white px-5 text-[13px] font-semibold text-[#44454c] hover:bg-[#faf9ff]">▣ 활용팁 둘러보기</Link>
            </div>
          </div>
          <svg className="h-45 w-52.5" viewBox="0 0 210 180" fill="none" aria-hidden="true">
            <defs><linearGradient id="paper" x1="60" y1="25" x2="160" y2="155"><stop stopColor="white" /><stop offset="1" stopColor="#d8d1ff" /></linearGradient></defs>
            <path d="m174 29 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="#6548f5" />
            <path d="m44 36 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#927cff" />
            <rect x="65" y="29" width="96" height="122" rx="13" transform="rotate(8 65 29)" fill="url(#paper)" />
            <path d="m87 59 55 8M84 78l61 9M81 97l50 7M79 116l58 8" stroke="#a999ff" strokeWidth="7" strokeLinecap="round" />
            <circle cx="43" cy="88" r="24" fill="#6648ef" /><path d="M32 83h22M32 92h15" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="m158 96 15 7 20-31 10 7-21 31 10 12-43 8 9-34Z" fill="#5639e7" />
          </svg>
        </section>

        <section className="mt-6 w-161.75">
          <h2 className="mb-3 text-[14px] font-bold">이렇게 사용해보세요!</h2>
          <div className="grid grid-cols-3 gap-3">
            {steps.map((step) => (
              <div key={step.number} className="flex h-20 items-center rounded-lg border border-[#e2e3e7] bg-white px-4">
                <div className="relative mr-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `${step.color}18`, color: step.color }}>
                  <span className="text-lg font-semibold">{step.icon}</span>
                  <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: step.color }}>{step.number}</span>
                </div>
                <span className="text-[13px] font-semibold text-[#383940]">{step.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 flex h-73.5 w-161.75 flex-col items-center justify-center rounded-lg border border-[#dfe1e6] bg-white text-center">
          <div className="relative h-19 w-22.5" aria-hidden="true">
            <div className="absolute bottom-1 left-3 h-10 w-16 rotate-[-8deg] rounded bg-[#d8d0ff]" />
            <div className="absolute bottom-1 right-3 h-10 w-16 rotate-[8deg] rounded bg-[#c9beff]" />
            <div className="absolute left-7.75 top-1 h-12 w-7 rounded border border-[#d5ccff] bg-[#f0edff]" />
          </div>
          <h2 className="mt-3 text-[16px] font-bold">아직 작성한 메시지가 없어요</h2>
          <p className="mt-2 text-[13px] text-[#8a8c93]">첫 메시지를 작성하고 스마트한 커뮤니케이션을 경험해보세요!</p>
          <Link to="/messages" className="mt-5 inline-flex h-9 items-center rounded-md border border-[#6952e8] px-5 text-[12px] font-semibold text-[#5138d9] hover:bg-[#f5f2ff]">새 메시지 작성하기</Link>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
