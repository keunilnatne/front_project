// src/pages/HistoryPage.tsx

import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'

const API_URL = import.meta.env.VITE_API_URL || ''

type HistoryItem = {
  id: string
  date: string
  recipient: string
  purpose: string
  score: number
  status: string

  // API에서 내려오면 사용하고, 기존 API에는 없어도 동작하도록 optional 처리
  type?: '변환' | '전송' | string
  createdAt?: string
  content?: string
}

type TabType = '전체' | '변환 기록' | '전송 기록'

const fallbackHistory: HistoryItem[] = [
  {
    id: '1',
    date: '2026.08.22',
    recipient: '김민수',
    purpose: '디자인 피드백',
    score: 92,
    status: '전송 완료',
    type: '전송',
  },
  {
    id: '2',
    date: '2026.08.21',
    recipient: '이서윤',
    purpose: '주간 보고',
    score: 88,
    status: '대기 중',
    type: '변환',
  },
  {
    id: '3',
    date: '2026.08.21',
    recipient: '박현우',
    purpose: '신규 프로젝트 제안서 검토 요청',
    score: 95,
    status: '전송 완료',
    type: '전송',
  },
  {
    id: '4',
    date: '2026.08.20',
    recipient: '최지우',
    purpose: '인사고과 면담 일정 조율',
    score: 72,
    status: '전송 완료',
    type: '전송',
  },
  {
    id: '5',
    date: '2026.08.20',
    recipient: '정재훈',
    purpose: '기술 스택 선정 회의록 공유',
    score: 91,
    status: '전송 완료',
    type: '전송',
  },
  {
    id: '6',
    date: '2026.08.19',
    recipient: '강윤지',
    purpose: '클라이언트 미팅 피드백',
    score: 85,
    status: '전송 완료',
    type: '전송',
  },
  {
    id: '7',
    date: '2026.08.19',
    recipient: '송도윤',
    purpose: '인프라 점검 리포트',
    score: 94,
    status: '전송 완료',
    type: '전송',
  },
  {
    id: '8',
    date: '2026.08.18',
    recipient: '한유리',
    purpose: '복지 혜택 안내',
    score: 99,
    status: '전송 완료',
    type: '변환',
  },
]

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
  const [history, setHistory] = useState<HistoryItem[]>(fallbackHistory)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('전체')
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
      } else {
        setLoading(true)
      }

      setError('')

      const res = await fetch(`${API_URL}/api/history`)

      if (!res.ok) {
        throw new Error('기록을 불러오지 못했습니다.')
      }

      const data = await res.json()

      if (Array.isArray(data)) {
        setHistory(data)
      }
    } catch {
      // API가 없어도 기존 fallback 데이터로 화면은 정상 동작
      setError('서버 기록을 불러오지 못했습니다. 기본 기록을 표시합니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

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
    setCurrentPage(1)
  }, [search, activeTab])

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
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

  const highScoreCount = history.filter(
    (item) => Number(item.score) >= 90,
  ).length

  const middleScoreCount = history.filter(
    (item) => Number(item.score) >= 80 && Number(item.score) < 90,
  ).length

  const lowScoreCount = history.filter(
    (item) => Number(item.score) < 80,
  ).length

  const highScorePercent =
    history.length > 0
      ? Math.round((highScoreCount / history.length) * 100)
      : 0

  const middleScorePercent =
    history.length > 0
      ? Math.round((middleScoreCount / history.length) * 100)
      : 0

  const lowScorePercent =
    history.length > 0
      ? Math.round((lowScoreCount / history.length) * 100)
      : 0

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
      <PageHeader searchValue={search} onSearchChange={setSearch} searchPlaceholder="기록 검색..." />

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
                onClick={() => loadHistory(true)}
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
            <h2 className="text-[16px] font-bold">
              ✦ AI Insight Panel
            </h2>

            <div className="mt-5 rounded-xl border border-[#dedee5] p-5">
              <p className="text-[12px] text-[#6043d9]">
                주간 분석
              </p>

              <h3 className="mt-2 text-[17px] font-bold">
                {average >= 90
                  ? '높은 소통 효율성'
                  : average >= 80
                    ? '안정적인 소통 효율성'
                    : '소통 효율성 개선 필요'}
              </h3>

              <p className="mt-3 text-[12px] leading-5 text-[#777]">
                현재 평균 적합도 점수가 {average}%입니다.
                {average >= 90
                  ? ' 높은 수준의 소통 효율을 유지하고 있습니다.'
                  : average >= 80
                    ? ' 전반적으로 안정적인 수준입니다.'
                    : ' 메시지 목적과 수신자에 맞춘 표현을 조금 더 다듬어 보세요.'}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-[#dedee5] p-5">
              <h3 className="text-[13px] font-semibold">
                점수 분포
              </h3>

              <div className="mt-5">
                <div className="flex justify-between text-[11px]">
                  <span>90% 이상</span>
                  <span>{highScorePercent}%</span>
                </div>

                <div className="mt-2 h-2 rounded-full bg-[#e7e7e8]">
                  <div
                    className="h-full rounded-full bg-[#5335dd]"
                    style={{ width: `${highScorePercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-[11px]">
                  <span>80% - 90%</span>
                  <span>{middleScorePercent}%</span>
                </div>

                <div className="mt-2 h-2 rounded-full bg-[#e7e7e8]">
                  <div
                    className="h-full rounded-full bg-[#9b8ce8]"
                    style={{ width: `${middleScorePercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-[11px]">
                  <span>80% 미만</span>
                  <span>{lowScorePercent}%</span>
                </div>

                <div className="mt-2 h-2 rounded-full bg-[#e7e7e8]">
                  <div
                    className="h-full rounded-full bg-[#df3340]"
                    style={{ width: `${lowScorePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-[13px]">
                추천 액션
              </h3>

              <div className="mt-5 space-y-5 text-[12px] text-[#666]">
                {history.some(
                  (item) => item.recipient === '이서윤' && item.status === '대기 중',
                ) && (
                  <p>
                    ✓ 이서윤 님의 '주간 보고' 검토 대기 중인 항목을 확인하세요.
                  </p>
                )}

                {history.some(
                  (item) => item.score < 80,
                ) && (
                  <p>
                    ♧ 적합도 80% 미만의 기록을 확인하고 메시지 표현을 개선해보세요.
                  </p>
                )}

                {!history.some(
                  (item) => item.score < 80,
                ) &&
                  !history.some(
                    (item) => item.status === '대기 중',
                  ) && (
                    <p>
                      ✓ 현재 검토가 필요한 기록이 없습니다.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-[520px] rounded-xl border border-[#dedee5] bg-white p-6"
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
                <span className="max-w-[300px] text-right">
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
                    {selectedItem.content}
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