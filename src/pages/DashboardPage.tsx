// src/pages/DashboardPage.tsx

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useConversations } from '../users/useConversations'
import { useProfileAnalytics } from '../users/useProfileAnalytics'

import DocumentIcon from '../images/dashboard/DocumentImg.png'
import DocumentInBox from '../images/dashboard/DocumentInBox.png'

type DashboardStats = {
  sentMessages: number
  aiConversions: number
  recipients: number
}

const fallbackStats: DashboardStats = {
  sentMessages: 0,
  aiConversions: 0,
  recipients: 0,
}


export default function DashboardPage() {
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStats>(fallbackStats)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { conversations } = useConversations(true)
  const analytics = useProfileAnalytics()
  const [openGuide, setOpenGuide] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    void fetch('/api/recipients')
      .then((response) => response.ok ? response.json() : [])
      .then((data) => {
        if (active && Array.isArray(data)) setStats((current) => ({ ...current, recipients: data.length }))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    const sentMessages = conversations.reduce((count, conversation) => (
      count + conversation.messages.filter((message) => message.role === 'user').length
    ), 0)

    setStats((current) => ({
      ...current,
      sentMessages,
      aiConversions: analytics.optimizedMessageCount,
    }))
    setLoading(false)
  }, [conversations, analytics.optimizedMessageCount])

  const guideItems = useMemo(
    () => [
      {
        number: 1,
        title: '메시지 작성',
        description: '전달할 메시지를 작성해보세요.',
        icon: '▱',
        color: '#7c3aed',
        bg: '#f1ebff',
        action: () => navigate('/messages'),
      },
      {
        number: 2,
        title: '수신자 선택',
        description: '메시지를 받을 수신자를 선택하세요.',
        icon: '♙',
        color: '#13b8a6',
        bg: '#e9fbf7',
        action: () => navigate('/recipients'),
      },
      {
        number: 3,
        title: 'AI 최적화',
        description: '상황에 맞는 메시지로 최적화해보세요.',
        icon: '✦',
        color: '#3b82f6',
        bg: '#edf4ff',
        action: () => navigate('/messages/optimized'),
      },
    ],
    [navigate],
  )

  const handleCreateMessage = () => {
    navigate('/messages')
  }

  const handleTemplate = () => {
    navigate('/messages')
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* 상단 검색 영역 */}
      <PageHeader searchValue={search} onSearchChange={setSearch} />

      <main className="grid grid-cols-[minmax(0,1fr)_302px] gap-6 px-8 pb-12 pt-8">
        {/* 왼쪽 메인 */}
        <section className="min-w-0">
          {/* Hero */}
          <div className="relative h-[268px] overflow-hidden rounded-xl border border-[#ded9ed] bg-[#f5f2ff]">
            <div className="absolute left-[36px] top-[44px]">
              <h1 className="text-[28px] font-bold leading-[1.45] tracking-[-0.02em] text-[#282328]">
                AI가 당신의 메시지를
                <br />
                상황에 맞게{' '}
                <span className="text-[#6844e2]">최적화</span>해드려요
              </h1>

              <p className="mt-2 text-[13px] text-[#8a858c]">
                빠르고, 정확하고, 매너있는 커뮤니케이션을 도와드립니다.
              </p>

              <div className="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={handleCreateMessage}
                  className="flex h-[49px] items-center gap-2 rounded-lg bg-[#4c2fdc] px-5 text-[13px] font-semibold text-white transition hover:bg-[#4327ca]"
                >
                  <span className="text-[18px]">♢</span>
                  새 메시지 작성
                </button>

                <button
                  type="button"
                  onClick={handleTemplate}
                  className="flex h-[49px] items-center gap-2 rounded-lg border border-[#d6d2dc] bg-white px-5 text-[13px] font-semibold text-[#4d4750] transition hover:bg-[#fafafa]"
                >
                  <span className="text-[17px] text-[#6040e8]">▱</span>
                  템플릿 둘러보기
                </button>
              </div>
            </div>

            {/* 업로드한 DocumentIcon.png */}
            <img
              src={DocumentIcon}
              alt=""
              className="pointer-events-none absolute right-[38px] top-[55px] h-[195px] w-[226px] object-contain"
            />
          </div>

          {/* 통계 카드 */}
          <div className="mt-[17px] grid grid-cols-3 gap-4">
            <div className="h-[102px] rounded-xl border border-[#dedee4] bg-white px-4 py-3">
              <strong className="block text-[36px] font-bold leading-none text-[#bcbcbc]">
                {loading ? '-' : stats.sentMessages}
              </strong>

              <p className="mt-4 text-[11px] text-[#c1c1c1]">
                전송한 메시지
              </p>
            </div>

            <div className="h-[102px] rounded-xl border border-[#dedee4] bg-white px-4 py-3">
              <strong className="block text-[36px] font-bold leading-none text-[#bcbcbc]">
                {loading ? '-' : stats.aiConversions}
              </strong>

              <p className="mt-4 text-[11px] text-[#c1c1c1]">
                AI 변환 횟수
              </p>
            </div>

            <div className="h-[102px] rounded-xl border border-[#dedee4] bg-white px-4 py-3">
              <strong className="block text-[36px] font-bold leading-none text-[#bcbcbc]">
                {loading ? '-' : stats.recipients}
              </strong>

              <p className="mt-4 text-[11px] text-[#c1c1c1]">
                등록된 수신자
              </p>
            </div>
          </div>

          {/* 빈 메시지 영역 */}
          <div className="mt-[21px] flex h-[429px] flex-col items-center justify-center rounded-xl border border-[#dedee4] bg-white">
            <img
              src={DocumentInBox}
              alt=""
              className="h-[115px] w-[113px] object-contain"
            />

            <h2 className="mt-[13px] text-[17px] font-bold text-[#282328]">
              아직 작성한 메시지가 없어요
            </h2>

            <p className="mt-2 text-[13px] text-[#777]">
              첫 메시지를 작성하고 스마트한 커뮤니케이션을 경험해보세요!
            </p>

            <button
              type="button"
              onClick={handleCreateMessage}
              className="mt-6 rounded-lg bg-[#f2efff] px-5 py-2.5 text-[12px] font-semibold text-[#6844e2] transition hover:bg-[#e9e4ff]"
            >
              첫 메시지 작성하기
            </button>
          </div>
        </section>

        {/* 오른쪽 */}
        <aside>
          {/* 사용 방법 */}
          <div className="rounded-xl border border-[#dedee4] bg-white p-5">
            <h2 className="text-[16px] font-bold text-[#282328]">
              이렇게 사용해보세요!
            </h2>

            <div className="mt-6 space-y-[10px]">
              {guideItems.map((item) => {
                const isOpen = openGuide === item.number

                return (
                  <div key={item.number}>
                    <button
                      type="button"
                      onClick={() => {
                        if (isOpen) {
                          setOpenGuide(null)
                        } else {
                          setOpenGuide(item.number)
                        }
                      }}
                      className="flex h-[80px] w-full items-center rounded-lg border border-[#d9d9df] px-4 text-left transition hover:bg-[#fafafa]"
                    >
                      <div
                        className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: item.bg }}
                      >
                        <span
                          className="absolute left-[-4px] top-[-5px] flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-semibold text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.number}
                        </span>

                        <span
                          className="text-[23px]"
                          style={{ color: item.color }}
                        >
                          {item.icon}
                        </span>
                      </div>

                      <div className="ml-5 min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-[#4a454a]">
                          {item.title}
                        </p>

                        {isOpen && (
                          <p className="mt-1 text-[10px] text-[#999]">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`text-[14px] text-[#aaa] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      >
                        ⌄
                      </span>
                    </button>

                    {isOpen && (
                      <button
                        type="button"
                        onClick={item.action}
                        className="mt-1 w-full rounded-lg bg-[#f7f5ff] py-2 text-[11px] font-semibold text-[#6844e2]"
                      >
                        바로 시작하기 →
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 새로운 소식 */}
          <div className="mt-[16px] rounded-xl border border-[#dedee4] bg-white p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-[#282328]">
                새로운 소식
              </h2>

              <span className="rounded-full bg-[#eee9ff] px-2 py-0.5 text-[10px] font-semibold text-[#6844e2]">
                new
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                window.alert(
                  '성능 개선과 새로운 기능으로 더 나은 커뮤니케이션 경험을 제공합니다.',
                )
              }}
              className="mt-3 w-full rounded-lg bg-[#f0edff] p-5 text-left transition hover:bg-[#e9e5ff]"
            >
              <p className="text-[13px] font-semibold text-[#4b4650]">
                더 편리해진 이음이를 만나보세요
              </p>

              <p className="mt-2 text-[12px] leading-5 text-[#999]">
                성능 개선과 새로운 기능으로
                <br />
                더 나은 경험을 제공합니다.
              </p>
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}