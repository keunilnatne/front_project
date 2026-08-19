import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { fetchDashboardSummary } from '../users/dashboard'
import { getNotices, type NoticeItem } from '../users/notices'

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
  const [showNews, setShowNews] = useState(false)
  const [notices, setNotices] = useState<NoticeItem[]>([])

  useEffect(() => {
    setNotices(getNotices())
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const loadStats = async () => {
      try {
        const summary = await fetchDashboardSummary(controller.signal)
        setStats({
          sentMessages: summary.sentMessages,
          aiConversions: summary.aiConversions,
          recipients: summary.recipients,
        })
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error(error)
        }
      } finally {
        setLoading(false)
      }
    }
    void loadStats()
    return () => controller.abort()
  }, [])

  const guideItems = useMemo(
    () => [
      {
        number: 1,
        title: '수신자 선택',
        description: '메시지를 받을 수신자를 선택하세요.',
        icon: '♙',
        color: '#7c3aed',
        bg: '#f1ebff',
        action: () => navigate('/recipients'),
      },
      {
        number: 2,
        title: '메시지 작성',
        description: '전달할 메시지를 작성해보세요.',
        icon: '▱',
        color: '#13b8a6',
        bg: '#e9fbf7',
        action: () => navigate('/messages'),
      },
    ],
    [navigate],
  )

  const keyword = search.trim().toLowerCase()
  const visibleGuideItems = guideItems.filter((item) =>
    !keyword
      || `${item.title} ${item.description}`.toLowerCase().includes(keyword),
  )

  const handleCreateMessage = () => {
    navigate('/messages')
  }


  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* 상단 검색 영역 */}
      <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} />

      <main className="grid grid-cols-[minmax(0,1fr)_302px] gap-6 px-8 pb-12 pt-8">
        {/* 왼쪽 메인 */}
        <section className="min-w-0">
          {/* Hero */}
          <div className="relative h-[268px] overflow-hidden rounded-xl border border-[#ded9ed] bg-[#f5f2ff]">
            <div className="absolute left-9 top-11">
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
                  className="flex h-12.25 items-center gap-2 rounded-lg bg-[#4c2fdc] px-5 text-[13px] font-semibold text-white transition hover:bg-[#4327ca]"
                >
                  <span className="text-[18px]">♢</span>
                  새 메시지 작성
                </button>


              </div>
            </div>

            {/* 업로드한 DocumentIcon.png */}
            <img
              src={DocumentIcon}
              alt=""
              className="pointer-events-none absolute right-9.5 top-13.75 h-48.75 w-56.5 object-contain"
            />
          </div>

          {/* 통계 카드 */}
          <div className="mt-4.25 grid grid-cols-3 gap-4">
            <div className="h-25.5 rounded-xl border border-[#dedee4] bg-white px-4 py-3 shadow-xs transition hover:border-[#cfc7ff]">
              <strong className="block text-[34px] font-bold leading-none text-[#29272c]">
                {loading ? '-' : stats.sentMessages}
              </strong>

              <p className="mt-4 text-[12px] font-medium text-[#777]">
                전송한 메시지
              </p>
            </div>

            <div className="h-25.5 rounded-xl border border-[#dedee4] bg-white px-4 py-3 shadow-xs transition hover:border-[#cfc7ff]">
              <strong className="block text-[34px] font-bold leading-none text-[#5531e8]">
                {loading ? '-' : stats.aiConversions}
              </strong>

              <p className="mt-4 text-[12px] font-medium text-[#777]">
                AI 변환 횟수
              </p>
            </div>

            <div className="h-25.5 rounded-xl border border-[#dedee4] bg-white px-4 py-3 shadow-xs transition hover:border-[#cfc7ff]">
              <strong className="block text-[34px] font-bold leading-none text-[#29272c]">
                {loading ? '-' : stats.recipients}
              </strong>

              <p className="mt-4 text-[12px] font-medium text-[#777]">
                등록된 수신자
              </p>
            </div>
          </div>

          {/* 빈 메시지 영역 */}
          <div className="mt-5.25 flex h-107.25 flex-col items-center justify-center rounded-xl border border-[#dedee4] bg-white">
            <img
              src={DocumentInBox}
              alt=""
              className="h-28.75 w-28.25 object-contain"
            />

            <h2 className="mt-3.25 text-[17px] font-bold text-[#282328]">
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

            <div className="mt-6 space-y-2.5">
              {visibleGuideItems.map((item) => (
                <div key={item.number}>
                  <button
                    type="button"
                    onClick={() => item.action()}
                    className="group flex h-20 w-full items-center rounded-lg border border-[#d9d9df] px-4 text-left transition hover:border-[#cfc7ff] hover:bg-[#faf9ff] hover:shadow-xs cursor-pointer"
                  >
                    <div
                      className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full transition group-hover:scale-105"
                      style={{ backgroundColor: item.bg }}
                    >
                      <span
                        className="absolute -left-1 -top-1.25 flex h-5.5 w-5.5 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-2xs"
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
                      <p className="text-[13px] font-semibold text-[#4a454a] group-hover:text-[#5338ec] transition">
                        {item.title}
                      </p>

                      <p className="mt-1 text-[10px] text-[#999]">
                        {item.description}
                      </p>
                    </div>

                    <span className="text-[14px] text-[#aaa] group-hover:text-[#5338ec] group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 새로운 소식 */}
          <div className="mt-4 rounded-xl border border-[#dedee4] bg-white p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-[#282328]">
                새로운 소식
              </h2>

              <span className="rounded-full bg-[#eee9ff] px-2 py-0.5 text-[10px] font-semibold text-[#6844e2]">
                {notices[0]?.tag || 'new'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowNews(true)}
              className="mt-3 w-full rounded-lg bg-[#f0edff] p-5 text-left transition hover:bg-[#e9e5ff] cursor-pointer"
            >
              <p className="text-[13px] font-semibold text-[#4b4650]">
                {notices[0]?.title || '더 편리해진 이음을 만나보세요'}
              </p>

              <p className="mt-2 text-[12px] leading-5 text-[#888] whitespace-pre-line">
                {notices[0]?.subtitle || '성능 개선과 새로운 기능으로\n더 나은 경험을 제공합니다.'}
              </p>
            </button>
          </div>
        </aside>
      </main>

      {/* 새 소식 모달 */}
      {showNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowNews(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#eee9ff] px-2 py-0.5 text-[10px] font-bold text-[#6844e2]">
                  {notices[0]?.tag || '공지사항'}
                </span>
                <span className="text-[11px] text-[#999]">
                  {notices[0]?.createdAt ? new Date(notices[0].createdAt).toLocaleDateString('ko-KR') : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNews(false)}
                className="text-[#999] hover:text-[#333] cursor-pointer text-[14px]"
              >
                ✕
              </button>
            </div>

            <h3 className="mt-3 text-[17px] font-bold text-[#282328]">
              {notices[0]?.title || '더 편리해진 이음을 만나보세요 🎉'}
            </h3>

            <div className="mt-3 rounded-xl bg-[#f9f9fb] p-4 text-[13px] leading-6 text-[#555] whitespace-pre-line">
              {notices[0]?.content || `• 실시간 비즈니스 메시지 AI 최적화 지원\n• 조직 맞춤형 Company DNA 자동 분석 탑재\n• 수신자별 맞춤형 문체 및 어조 조율 강화\n• Gmail 실시간 수신함 연동 및 스마트 AI 일정 추출`}
            </div>

            {notices.length > 1 && (
              <div className="mt-4 border-t border-[#f0f0f5] pt-3">
                <p className="text-[11px] font-semibold text-[#888] mb-2">이전 공지사항</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {notices.slice(1).map((n) => (
                    <div key={n.id} className="rounded-lg bg-[#f4f4f7] p-2 text-[11px] text-[#555]">
                      <div className="font-semibold text-[#333]">{n.title}</div>
                      <div className="text-[#888] line-clamp-1">{n.subtitle}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowNews(false)}
                className="rounded-lg bg-[#5035dc] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#432ec4] cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
