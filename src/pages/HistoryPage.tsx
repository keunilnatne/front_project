import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useSearchParams } from 'react-router-dom'
import { fetchHistory, deleteHistoryItem, type HistoryItem } from '../users/history'
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

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}. ${month}. ${day}. ${hours}:${minutes}`
  } catch {
    return dateStr
  }
}

function getStatusClass(status: string) {
  return status === '대기 중'
    ? 'bg-[#eee] text-[#888]'
    : 'bg-[#dcf8e8] text-[#22955c]'
}

function deduplicateHistory(items: HistoryItem[]): HistoryItem[] {
  const map = new Map<string, HistoryItem>()

  for (const item of items) {
    const key = item.messageId || `${item.recipient}__${(item.subject || item.purpose || '').trim()}`
    const existing = map.get(key)
    if (!existing) {
      map.set(key, item)
    } else {
      const priority = (h: HistoryItem) => {
        if (h.status.includes('전송 완료') || h.type === '전송') return 3
        if (h.status.includes('변환') || h.score > 0) return 2
        return 1
      }
      if (priority(item) > priority(existing)) {
        map.set(key, item)
      }
    }
  }

  return Array.from(map.values())
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

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const deduped = deduplicateHistory(history)

    return deduped.filter((item) => {
      // 변환/전송 된 것만 노출 (내용 없는 실패 더미 제외)
      const isFailedEmpty = item.status === '실패' && !item.content && !item.subject
      if (isFailedEmpty) return false

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
    <div className="min-h-screen bg-[#f5f6f8] text-[#1c1d22]">
      <PageHeader
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={setSearch}
        searchPlaceholder="수신자, 제목 또는 상태 검색"
      />

      <main className="px-8 pb-12 pt-6">
        <h1 className="ieum-page-title text-[#24252c]">
          메시지 기록
        </h1>

        <p className="mt-1 text-[13px] text-[#666]">
          AI로 최적화하고 발송한 모든 메시지
          내역입니다.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-[#fff0f0] p-3 text-[12px] text-[#df3340]">
            {error}
          </div>
        )}

        <section className="mt-6 grid grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#dedde3] bg-white p-5">
            <p className="text-[11px] text-[#777]">
              총 기록
            </p>

            <p className="mt-2 text-[26px] font-bold">
              {history.length}
            </p>

            <p className="mt-1 text-[10px] text-[#999]">
              변환 및 전송 기록 포함
            </p>
          </div>

          <div className="rounded-xl border border-[#dedde3] bg-white p-5">
            <p className="text-[11px] text-[#777]">
              평균 적합도
            </p>

            <p className="mt-2 text-[26px] font-bold text-[#0086bd]">
              {average}%
            </p>

            <p className="mt-1 text-[10px] text-[#999]">
              전체 메시지 평균 점수
            </p>
          </div>

          <div className="rounded-xl border border-[#dedde3] bg-white p-5">
            <p className="text-[11px] text-[#777]">
              발송 대기
            </p>

            <p className="mt-2 text-[26px] font-bold text-[#bc6a00]">
              {waitingCount}
            </p>

            <p className="mt-1 text-[10px] text-[#999]">
              변환 후 미발송 내역
            </p>
          </div>

          <div className="rounded-xl border border-[#dedde3] bg-white p-5">
            <p className="text-[11px] text-[#777]">
              이번 주 전송
            </p>

            <p className="mt-2 text-[26px] font-bold text-[#22955c]">
              {weekSentCount}
            </p>

            <p className="mt-1 text-[10px] text-[#999]">
              최근 7일간 전송 건수
            </p>
          </div>
        </section>

        <section className="mt-6">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setActiveTab(tab)
                }
                className={
                  activeTab === tab
                    ? 'rounded-lg bg-[#5033df] px-4 py-2 text-[12px] font-semibold text-white cursor-pointer'
                    : 'rounded-lg border border-[#dedde3] bg-white px-4 py-2 text-[12px] font-medium text-[#555] hover:bg-[#fafafa] cursor-pointer'
                }
              >
                {tab}
                {tab === '전체' &&
                  ` (${history.length})`}
                {tab === '전송 기록' &&
                  ` (${sentCount})`}
                {tab === '변환 기록' &&
                  ` (${history.length - sentCount})`}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-[#dedee5] bg-white">
            <div className="grid grid-cols-[140px_110px_1fr_130px_80px_45px] border-b border-[#dddde2] px-5 py-4 text-[11px] font-medium text-[#777]">
              <span>일시</span>
              <span>수신자</span>
              <span>제목</span>
              <span>적합도 점수</span>
              <span>상태</span>
              <span className="text-center">삭제</span>
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
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="grid w-full grid-cols-[140px_110px_1fr_130px_80px_45px] items-center border-b border-[#eeeef0] px-5 py-4 text-left text-[12px] last:border-0 hover:bg-[#fafafe] cursor-pointer"
                >
                  <span className="text-[11px] text-[#666]">{formatDateTime(item.createdAt || item.sentAt || item.date)}</span>

                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4dcca] text-[9px] font-semibold shrink-0">
                      {item.recipient.slice(0, 1)}
                    </span>
                    <span className="truncate">{item.recipient}</span>
                  </span>

                  <span className="truncate pr-4 font-medium text-[#2f303b]">
                    {item.subject || item.purpose || '(제목 없음)'}
                  </span>

                  <span>
                    {item.status.includes('실패') || item.score === 0 ? (
                      <span className="inline-block rounded-full bg-[#ffe4e5] px-2.5 py-0.5 text-[10px] font-medium text-[#df3340]">
                        오류로 인한 변환 실패
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium ${getScoreClass(
                          item.score,
                        )}`}
                      >
                        {item.score}%
                      </span>
                    )}
                  </span>

                  <span>
                    <span
                      className={`rounded px-2 py-1 text-[10px] font-medium ${getStatusClass(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>
                  </span>

                  <span className="flex justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('이 기록을 삭제하시겠습니까?')) {
                          void deleteHistoryItem(item.id).then(() => {
                            setHistory((prev) => prev.filter((h) => h.id !== item.id))
                          }).catch((error) => window.alert(error instanceof Error ? error.message : '기록을 삭제하지 못했습니다.'))
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded text-[#a0a0ab] hover:bg-[#fee2e2] hover:text-[#dc2626] transition cursor-pointer"
                      title="기록 삭제"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </span>
                </div>
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
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#dedde3] text-[12px] disabled:opacity-30 cursor-pointer"
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
                        ? 'flex h-8 w-8 items-center justify-center rounded bg-[#5033df] text-[12px] text-white cursor-pointer'
                        : 'flex h-8 w-8 items-center justify-center rounded border border-[#dedde3] text-[12px] cursor-pointer'
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded border border-[#dedde3] text-[12px] disabled:opacity-30 cursor-pointer"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-140 max-h-[85vh] flex flex-col rounded-xl border border-[#dedee5] bg-white p-6 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between shrink-0 pb-4 border-b border-[#eee]">
              <h2 className="text-[17px] font-bold">
                기록 상세
              </h2>

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-[20px] text-[#777] hover:text-[#333] cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4 text-[13px]">
              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">날짜</span>
                <span>{selectedItem.date}</span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">수신자</span>
                <span className="font-medium">{selectedItem.recipient} {selectedItem.recipientEmail ? `(${selectedItem.recipientEmail})` : ''}</span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3">
                <span className="text-[#777]">제목</span>
                <span className="max-w-[320px] text-right font-medium text-[#2d2e36]">
                  {selectedItem.subject || selectedItem.purpose || '(제목 없음)'}
                </span>
              </div>

              <div className="flex justify-between border-b border-[#eee] pb-3 items-center">
                <span className="text-[#777]">적합도</span>
                {selectedItem.status.includes('실패') || selectedItem.score === 0 ? (
                  <span className="rounded-full bg-[#ffe4e5] px-2.5 py-1 text-[11px] font-medium text-[#df3340]">
                    오류로 인한 변환 실패
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-3 py-1 ${getScoreClass(
                      selectedItem.score,
                    )}`}
                  >
                    {selectedItem.score}%
                  </span>
                )}
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

              {/* 메시지 내용 영역 (변환 전/후 또는 단일 메시지) */}
              {(() => {
                const hasConverted = Boolean(
                  (selectedItem.originalBody && selectedItem.content && selectedItem.originalBody.trim() !== selectedItem.content.trim()) ||
                  (selectedItem.originalSubject && selectedItem.subject && selectedItem.originalSubject.trim() !== selectedItem.subject.trim()) ||
                  (selectedItem.type === '변환' && selectedItem.originalBody)
                )

                if (hasConverted) {
                  return (
                    <div className="space-y-4 pt-1">
                      {/* 변환 전 (원문) */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#94a3b8]" />
                          <span className="text-[12px] font-bold text-[#475569]">변환 전 (원문)</span>
                        </div>
                        <div className="rounded-xl bg-[#f8fafc] p-4 border border-[#e2e8f0] text-[13px] space-y-2">
                          {selectedItem.originalSubject && (
                            <p className="font-semibold text-[#334155]">
                              <span className="text-[11px] text-[#64748b] block font-normal mb-0.5">제목:</span>
                              {selectedItem.originalSubject}
                            </p>
                          )}
                          {selectedItem.originalBody && (
                            <div>
                              <span className="text-[11px] text-[#64748b] block font-normal mb-0.5">본문:</span>
                              <div className="whitespace-pre-wrap leading-relaxed text-[#334155] rounded-lg bg-white p-3 border border-[#edf2f7]">
                                {selectedItem.originalBody}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 변환 후 (최적화) */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                          <span className="text-[12px] font-bold text-[#4f46e5]">변환 후 (AI 최적화 메시지)</span>
                        </div>
                        <div className="rounded-xl bg-[#f5f3ff] p-4 border border-[#ddd6fe] text-[13px] space-y-2">
                          {selectedItem.subject && (
                            <p className="font-semibold text-[#1e1b4b]">
                              <span className="text-[11px] text-[#7c3aed] block font-normal mb-0.5">제목:</span>
                              {selectedItem.subject}
                            </p>
                          )}
                          {selectedItem.content && (
                            <div>
                              <span className="text-[11px] text-[#7c3aed] block font-normal mb-0.5">본문:</span>
                              <div className="rounded-lg bg-white p-3 leading-relaxed border border-[#ede9fe]">
                                <MarkdownViewer content={selectedItem.content} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                }

                // 그냥 보낸 메시지인 경우 (단일 본문만 노출)
                return (
                  <div>
                    <p className="mb-2 font-medium text-[#777]">
                      메시지 내용
                    </p>
                    <div className="rounded-lg bg-[#f8f9fc] p-4 leading-6 border border-[#ededf2]">
                      <MarkdownViewer content={selectedItem.content || selectedItem.originalBody || ''} />
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex gap-2 pt-4 border-t border-[#eee] shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('이 기록을 삭제하시겠습니까?')) {
                    void deleteHistoryItem(selectedItem.id).then(() => {
                      setHistory((prev) => prev.filter((h) => h.id !== selectedItem.id))
                      setSelectedItem(null)
                    }).catch((error) => window.alert(error instanceof Error ? error.message : '기록을 삭제하지 못했습니다.'))
                  }
                }}
                className="h-10 rounded-lg border border-[#fca5a5] px-4 text-[13px] font-semibold text-[#dc2626] hover:bg-[#fef2f2] transition cursor-pointer"
              >
                기록 삭제
              </button>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="h-10 flex-1 rounded-lg bg-[#5033df] text-[13px] font-semibold text-white transition hover:bg-[#432bc6] cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
