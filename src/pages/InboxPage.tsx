import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchInboxMessages, fetchInboxMessageDetail, getGmailStatus, type InboxMessage, type GmailStatus } from '../users/inbox'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  } catch {
    return dateStr
  }
}

export default function InboxPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<InboxMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<GmailStatus>({ connected: false, email: null })
  const [notConnected, setNotConnected] = useState(false)
  const [copied, setCopied] = useState(false)

  async function loadData() {
    setLoading(true)
    setNotConnected(false)
    try {
      const currentStatus = await getGmailStatus()
      setStatus(currentStatus)
      if (!currentStatus.connected) {
        setNotConnected(true)
        setLoading(false)
        return
      }

      const list = await fetchInboxMessages()
      setMessages(list)
      if (list.length > 0) {
        setSelectedId(list[0].id)
      }
    } catch (err: any) {
      if (err.message === 'GMAIL_NOT_CONNECTED') {
        setNotConnected(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Load message detail when selected
  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null)
      return
    }

    const cached = messages.find((m) => m.id === selectedId)
    if (cached && cached.body) {
      setSelectedDetail(cached)
      return
    }

    let active = true
    setDetailLoading(true)
    void fetchInboxMessageDetail(selectedId)
      .then((detail) => {
        if (active) setSelectedDetail(detail)
      })
      .catch(() => {
        if (active && cached) setSelectedDetail(cached)
      })
      .finally(() => {
        if (active) setDetailLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedId, messages])

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return messages
    return messages.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.fromName.toLowerCase().includes(q) ||
        m.fromEmail.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q)
    )
  }, [messages, search])

  const handleReplyWithAi = (msg: InboxMessage) => {
    navigate('/messages', {
      state: {
        recipient: {
          id: `inbox-reply-${Date.now()}`,
          name: msg.fromName || msg.fromEmail.split('@')[0] || '발신자',
          email: msg.fromEmail,
          position: '연락처',
          company: '',
          country: 'South Korea',
          language: 'Korean',
          timezone: 'Asia/Seoul',
          relationship: '외부 파트너',
          speed: '보통',
          responseTime: 30,
          collaboration: 'Medium',
        },
        subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
        body: `\n\n--- 원본 메일 (${msg.from}) ---\n${msg.body || msg.snippet}`,
      },
    })
  }

  const handleCopyBody = (text: string) => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Top Header */}
      <header className="flex h-17 shrink-0 items-center justify-between border-b border-[#e5e5e8] bg-white px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-[18px] font-bold tracking-tight text-[#222]">받은 메시지</h1>
          {status.connected && status.email && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#f0ebff] px-3 py-1 text-[11px] font-medium text-[#4f46e5]">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              Gmail 연동됨 ({status.email})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#e2e2e8] bg-white px-3.5 py-2 text-[12px] font-medium text-[#555] transition hover:bg-[#f7f7fa] disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            새로고침
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-8">
        {notConnected ? (
          /* Gmail Not Connected Card */
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-[#e5e7ef] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f2ff] text-[#4f46e5]">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-bold text-[#222]">Gmail 연동이 필요합니다</h2>
            <p className="mt-2 text-sm text-[#666]">
              Google 계정을 연동하면 받은 편지함의 메일을 실시간으로 확인하고, AI 맞춤형 답장을 즉시 작성할 수 있습니다.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${import.meta.env.VITE_API_URL || ''}/api/auth/google`
                }}
                className="flex items-center gap-2 rounded-xl bg-[#4f46e5] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#4338ca]"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 16.033 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.62 0 3.015.615 4.095 1.62l2.37-2.37C16.89 3.48 14.655 2.5 12.24 2.5 7.02 2.5 2.74 6.78 2.74 12s4.28 9.5 9.5 9.5c5.445 0 9.075-3.825 9.075-9.225 0-.615-.06-1.23-.165-1.99H12.24z" />
                </svg>
                Google 계정 연동하기
              </button>
            </div>
          </div>
        ) : (
          /* 2-Column Split Pane */
          <div className="grid grid-cols-[360px_minmax(0,1fr)] items-stretch gap-7">
            {/* Left: Email List */}
            <div className="flex min-h-[760px] flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              {/* Search Bar */}
              <div className="border-b border-[#ededf0] p-4">
                <div className="flex h-10 items-center rounded-full bg-[#f1f1f4] px-4">
                  <svg className="mr-2 h-4 w-4 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="보낸 사람, 제목, 내용 검색"
                    className="w-full bg-transparent text-[12px] text-[#333] outline-none placeholder:text-[#999]"
                  />
                </div>
              </div>

              {/* List Header */}
              <div className="flex items-center justify-between border-b border-[#ededf0] px-4 py-2.5 text-[11px] font-semibold text-[#888]">
                <span>전체 메일 {filteredMessages.length}개</span>
                <span>최신순</span>
              </div>

              {/* Email Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse rounded-xl bg-[#f7f7fa] p-4 space-y-2">
                        <div className="h-4 w-1/3 rounded bg-[#e4e4e9]" />
                        <div className="h-4 w-3/4 rounded bg-[#ededf2]" />
                        <div className="h-3 w-full rounded bg-[#f0f0f5]" />
                      </div>
                    ))}
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="py-20 text-center text-[13px] text-[#999]">
                    수신된 메일이 없습니다.
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isSelected = msg.id === selectedId
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedId(msg.id)}
                        className={`cursor-pointer rounded-xl p-3.5 transition-all ${
                          isSelected
                            ? 'border border-[#4f46e5]/40 bg-[#f8f7ff] shadow-sm'
                            : 'border border-transparent hover:bg-[#f7f7fa]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eeeaff] text-[11px] font-bold text-[#4f46e5]">
                              {msg.fromName ? msg.fromName.slice(0, 1) : '@'}
                            </div>
                            <span className="truncate text-[13px] font-semibold text-[#28272c]">
                              {msg.fromName || msg.fromEmail}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] text-[#999]">
                            {formatDate(msg.date)}
                          </span>
                        </div>

                        <p className="mt-1.5 truncate text-[13px] font-medium text-[#333]">
                          {msg.subject}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#777]">
                          {msg.snippet}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right: Detail View */}
            <div className="flex min-h-[760px] flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              {!selectedDetail ? (
                <div className="flex flex-1 items-center justify-center p-12 text-center text-[#888]">
                  메일을 선택하면 상세 내용이 표시됩니다.
                </div>
              ) : (
                <div className="flex flex-1 flex-col">
                  {/* Detail Header */}
                  <div className="border-b border-[#ededf0] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-[20px] font-bold text-[#1f1e24] leading-snug">
                        {selectedDetail.subject}
                      </h2>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyBody(selectedDetail.body || selectedDetail.snippet)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#dedee3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#555] transition hover:bg-[#f7f7fa]"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="8" y="8" width="12" height="12" rx="2" />
                            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                          </svg>
                          {copied ? '복사 완료!' : '본문 복사'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplyWithAi(selectedDetail)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#4f46e5] px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#4338ca]"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
                            <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
                          </svg>
                          ⚡ AI 답장 작성
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0edff] text-[13px] font-bold text-[#4f46e5]">
                          {selectedDetail.fromName ? selectedDetail.fromName.slice(0, 1) : '@'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-[#29272c]">
                              {selectedDetail.fromName}
                            </span>
                            {selectedDetail.fromEmail && (
                              <span className="rounded bg-[#f4f4f6] px-2 py-0.5 text-[10px] text-[#666]">
                                &lt;{selectedDetail.fromEmail}&gt;
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#888]">
                            수신: {selectedDetail.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail Body */}
                  <div className="flex-1 p-8 overflow-y-auto">
                    {detailLoading ? (
                      <div className="space-y-3">
                        <div className="h-4 w-full animate-pulse rounded bg-[#f0f0f5]" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-[#f0f0f5]" />
                        <div className="h-4 w-4/6 animate-pulse rounded bg-[#f0f0f5]" />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#2f2e34]">
                        {selectedDetail.body || selectedDetail.snippet || '(본문 내용이 없습니다.)'}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="border-t border-[#ededf0] bg-[#fafafc] p-4 flex items-center justify-between">
                    <span className="text-[11px] text-[#888]">
                      이 메일에 답장하려면 [AI 답장 작성]을 눌러 이음의 맞춤형 톤앤매너로 작성하세요.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleReplyWithAi(selectedDetail)}
                      className="rounded-lg bg-[#4f46e5] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#4338ca]"
                    >
                      AI 답장 작성하기 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
