import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useSearchParams } from 'react-router-dom'
import { fetchHistory, type HistoryItem } from '../users/history'
import { analyzeHistory, type HistoryAIInsight } from '../ai/aiInsights'
import MarkdownViewer from '../components/MarkdownViewer'

type TabType = '전체' | '변환 기록' | '전송 기록'

const PAGE_SIZE = 8

function getItemType(item: HistoryItem): '변환' | '전송' {
  if (item.type === '변환' || item.type === '전송') {
    return item.type
  }

  if (
    item.status.includes('전송') ||
    item.status.includes('완료')
  ) {
    return '전송'
  }

  return '변환'
}

function getScoreClass(score: number) {
  if (score >= 90) {
    return 'bg-[#e1f7ff] text-[#0086bd]'
  }

  if (score >= 80) {
    return 'bg-[#fff0d6] text-[#bc6a00]'
  }

  return 'bg-[#ffe4e5] text-[#df3340]'
}

function getStatusClass(status: string) {
  return status === '대기 중'
    ? 'bg-[#eee] text-[#888]'
    : 'bg-[#dcf8e8] text-[#22955c]'
}

export default function HistoryPage() {
  const [searchParams] = useSearchParams()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('전체')
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aiInsight, setAiInsight] = useState<HistoryAIInsight | null>(null)
  const [aiInsightLoading, setAiInsightLoading] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchHistory()
      setHistory(data)
      const requestedId = searchParams.get('message')
      if (requestedId) {
        const requested = data.find((item) => item.id === requestedId)
        if (requested) setSelectedItem(requested)
      }
    } catch (error) {
      console.error(error)
      setError('기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    const load = async () => { await loadHistory() }
    void load()
  }, [loadHistory])

  useEffect(() => {
    let active = true
    const loadInsight = async () => {
      if (!history.length) {
        if (active) setAiInsight(null)
        return
      }
      if (active) setAiInsightLoading(true)
      const insight = await analyzeHistory(history)
      if (active) { setAiInsight(insight); setAiInsightLoading(false) }
    }
    void loadInsight()
    return () => { active = false }
  }, [history])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return history.filter((item) => {
      const matchesSearch =
        !keyword ||
        `${item.recipient} ${item.purpose} ${item.date} ${item.status}`
          .toLowerCase()
          .includes(keyword)

      const type = getItemType(item)

      const matchesTab =
        activeTab === '전체' ||
        (activeTab === '변환 기록' && type === '변환') ||
        (activeTab === '전송 기록' && type === '전송')

      return matchesSearch && matchesTab
    })
  }, [history, search, activeTab])

  useEffect(() => {
    const resetPage = async () => setCurrentPage(1)
    void resetPage()
  }, [search, activeTab])

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  )

  useEffect(() => {
    const clampPage = async () => {
      if (currentPage > totalPages) setCurrentPage(totalPages)
    }
    void clampPage()
  }, [currentPage, totalPages])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const average =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + Number(item.score || 0), 0) /
            history.length,
        )
      : 0

  const waitingCount = history.filter(
    (item) => item.status === '대기 중',
  ).length

  const sentCount = history.filter((item) =>
    item.status.includes('전송 완료'),
  ).length

  const pageStart =
    filtered.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1

  const pageEnd =
    filtered.length === 0
      ? 0
      : Math.min(currentPage * PAGE_SIZE, filtered.length)

  const weekSentCount = useMemo(() => {
    const now = new Date()

    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(now.getDate() - 6)

    return history.filter((item) => {
      if (!item.status.includes('전송 완료')) {
        return false
      }

      const date = item.createdAt
        ? new Date(item.createdAt)
        : new Date(
            item.date
              .replace(/\./g, '-')
              .concat('T00:00:00'),
          )

      return !Number.isNaN(date.getTime()) && date >= start
    }).length
  }, [history])

  const tabs: TabType[] = [
    '전체',
    '변환 기록',
    '전송 기록',
  ]

  const goToPage = (page: number) => {
    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages,
    )

    setCurrentPage(nextPage)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} searchPlaceholder="기록 검색..." />

      <main className="grid grid-cols-[1fr_320px] gap-6 px-8 pb-12 pt-8">
        <div className="col-span-full mb-0">
          <h1 className="ieum-page-title">기록</h1>
        </div>
        <section>
          <div className="grid grid-cols-4 gap-3">
            {[
              ['▥', '총 기록 수', history.length, '전체 누적 기록'],
              ['⌁', '평균 적합도', `${average}%`, '전체 평균 점수'],
              ['⌛', '대기 중', waitingCount, '검토 대기'],
              ['➤', '이번 주 전송 완료', weekSentCount || sentCount, '전송 성공'],
            ].map(([icon, title, value, sub]) => (
              <div
                key={String(title)}
                className="rounded-lg border border-[#dedee4] bg-white p-5"
              >
                <div className="text-[#6844e2]">{icon}</div>

                <p className="mt-4 text-[12px] text-[#777]">
                  {title}
                </p>

                <strong className="mt-1 block text-[26px]">
                  {value}
                </strong>

                <p className="mt-1 text-[11px] text-[#999]">
                  {sub}
                </p>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-[#dedee5] bg-white px-4 py-3 text-[12px] text-[#777]">
              {error}
              <button
                type="button"
                onClick={() => loadHistory()}
                className="ml-3 font-semibold text-[#5033df]"
              >
                다시 시도
              </button>
            </div>
          )}

          <div className="mt-8 flex border-b border-[#dddde3]">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? 'border-b-2 border-[#5033df] px-4 pb-4 text-[13px] font-semibold text-[#5033df]'
                    : 'px-4 pb-4 text-[13px] text-[#777]'
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-[#dedee5] bg-white">
            <div className="grid grid-cols-[125px_120px_1fr_100px_100px] border-b border-[#dddde2] px-5 py-4 text-[11px] text-[#777]">
              <span>날짜</span>
              <span>수신자</span>
              <span>목적</span>
              <span>적합도 점수</span>
              <span>상태</span>
            </div>

            {loading ? (
              <div className="px-5 py-10 text-center text-[12px] text-[#999]">
                기록을 불러오는 중입니다...
              </div>
            ) : paginated.length === 0 ? (
              <div className="px-5 py-10 text-center text-[12px] text-[#999]">
                검색 조건에 맞는 기록이 없습니다.
              </div>
            ) : (
              paginated.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="grid w-full grid-cols-[125px_120px_1fr_100px_100px] items-center border-b border-[#eeeef0] px-5 py-5 text-left text-[12px] last:border-0 hover:bg-[#fafafe]"
                >
                  <span>{item.date}</span>

                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4dcca] text-[9px]">
                      {item.recipient.slice(0, 1)}
                    </span>
                    {item.recipient}
                  </span>

                  <span className="truncate pr-3">
                    {item.purpose}
                  </span>

                  <span>
                    <span
                      className={`rounded-full px-3 py-1 ${getScoreClass(
                        item.score,
                      )}`}
                    >
                      {item.score}%
                    </span>
                  </span>

                  <span>
                    <span
                      className={`rounded px-2 py-1 text-[10px] ${getStatusClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[12px] text-[#777]">
              총 {filtered.length}개의 기록 중{' '}
              {pageStart}-{pageEnd} 표시 중
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#dedde3] text-[12px] disabled:opacity-30"
                >
                  ‹
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => goToPage(page)}
                    className={
                      currentPage === page
                        ? 'flex h-8 w-8 items-center justify-center rounded bg-[#5033df] text-[12px] text-white'
                        : 'flex h-8 w-8 items-center justify-center rounded border border-[#dedde3] text-[12px]'
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#dedde3] text-[12px] disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </section>

        <aside>
          <div className="rounded-xl border border-[#dedee5] bg-white p-6">
            <h2 className="text-[16px] font-bold">✦ AI Insight Panel</h2>
            {aiInsightLoading ? (
              <div className="mt-5 rounded-xl border border-[#dedee5] p-5 text-[12px] text-[#888]">AI가 최근 기록을 분석하고 있습니다.</div>
            ) : aiInsight ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#dedee5] p-5"><p className="text-[12px] text-[#6043d9]">주간 분석</p><h3 className="mt-2 text-[17px] font-bold">{aiInsight.summary}</h3><p className="mt-3 text-[12px] leading-5 text-[#777]">{aiInsight.efficiency}</p></div>
                <div className="rounded-xl border border-[#dedee5] p-5"><p className="text-[12px] text-[#6043d9]">AI 추천</p><p className="mt-2 text-[12px] leading-5 text-[#555]">{aiInsight.recommendation}</p></div>
                <div className="rounded-xl border border-[#dedee5] p-5"><p className="text-[12px] text-[#6043d9]">다음 집중 영역</p><p className="mt-2 text-[12px] leading-5 text-[#555]">{aiInsight.focus}</p></div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-[#dedee5] p-5 text-[12px] leading-5 text-[#888]">기록이 AI 분석 서버에 전달되면 주간 분석과 추천이 표시됩니다.</div>
            )}
          </div>
        </aside>
      </main>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-130 rounded-xl border border-[#dedee5] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold">
                기록 상세
              </h2>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-[18px] text-[#777]"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4 text-[13px]">
              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">날짜</span>
                <span>{selectedItem.date}</span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">수신자</span>
                <span>{selectedItem.recipient}</span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">목적</span>
                <span className="max-w-75 text-right">
                  {selectedItem.purpose}
                </span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">적합도</span>
                <span
                  className={`rounded-full px-3 py-1 ${getScoreClass(
                    selectedItem.score,
                  )}`}
                >
                  {selectedItem.score}%
                </span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">상태</span>
                <span
                  className={`rounded px-2 py-1 text-[10px] ${getStatusClass(
                    selectedItem.status,
                  )}`}
                >
                  {selectedItem.status}
                </span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">기록 유형</span>
                <span>{getItemType(selectedItem)} 기록</span>
              </div>

              {selectedItem.content && (
                <div>
                  <p className="mb-2 text-[#777]">
                    내용
                  </p>

                  <div className="rounded-lg bg-[#f8f9fc] p-4 leading-6">
                    <MarkdownViewer content={selectedItem.content} />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="mt-6 h-10 w-full rounded-lg bg-[#5033df] text-[13px] font-semibold text-white"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
