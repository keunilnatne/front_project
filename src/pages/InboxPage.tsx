import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchInboxMessages,
  fetchInboxMessageDetail,
  downloadInboxAttachment,
  getGmailStatus,
  getCachedInboxMessages,
  extractScheduleFromAi,
  type InboxMessage,
  type GmailStatus,
} from '../users/inbox'
import { saveTeamMemoryPattern, type Pattern } from '../users/teamMemory'
import { fetchRecipients, createRecipient } from '../users/recipients'
import MarkdownViewer from '../components/MarkdownViewer'
import { authorizationHeaders } from '../users/authStorage'
import { requireOk } from '../users/apiClient'
import { readUserStorage, writeUserStorage } from '../users/storage'

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${month}.${day} ${hours}:${minutes}`
  } catch {
    return dateStr
  }
}

function formatFullDateTime(dateStr: string): string {
  if (!dateStr) return ''
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

export type ScheduleInfo = {
  quote: string
  title: string
  dateTime: string
  source: string
}

export default function InboxPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<InboxMessage[]>(() => getCachedInboxMessages())
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const cached = getCachedInboxMessages()
    return cached.length > 0 ? cached[0].id : null
  })
  const [selectedDetail, setSelectedDetail] = useState<InboxMessage | null>(null)
  const [loading, setLoading] = useState(() => getCachedInboxMessages().length === 0)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<GmailStatus>({ connected: false, email: null })
  const [notConnected, setNotConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scheduleCard, setScheduleCard] = useState<ScheduleInfo | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('팀 일정에 추가되었어요.')
  const [addedDate, setAddedDate] = useState<string | null>(null)

  const handleRecommendSchedule = async (msg: InboxMessage) => {
    setScheduleLoading(true)
    try {
      const result = await extractScheduleFromAi(msg)
      if (!result.hasSchedule) {
        setToastMessage('이 메일에는 마감 또는 회의 일정이 포함되어 있지 않습니다.')
        setAddedDate(null)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 4000)
      } else {
        setScheduleCard({
          quote: result.quote,
          title: result.title,
          dateTime: result.dateTime,
          source: result.source,
        })
      }
    } catch {
      setToastMessage('일정 분석에 실패했습니다. 다시 시도해주세요.')
      setAddedDate(null)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    } finally {
      setScheduleLoading(false)
    }
  }

  const handleAddSchedule = async () => {
    if (!scheduleCard) return

    let deadlineStr = scheduleCard.dateTime.trim()
    const currentYear = new Date().getFullYear()
    if (!/^\d{4}/.test(deadlineStr)) {
      deadlineStr = `${currentYear}.${deadlineStr}`
    }

    const dateMatch = deadlineStr.match(/(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/)
    if (dateMatch) {
      setAddedDate(`${dateMatch[1]}-${String(dateMatch[2]).padStart(2, '0')}-${String(dateMatch[3]).padStart(2, '0')}`)
    } else {
      setAddedDate(null)
    }

    const pattern: Pattern = {
      id: `schedule-${Date.now()}`,
      title: scheduleCard.title.trim() || '이메일 추천 일정',
      purpose: scheduleCard.title.trim() || '이메일 추천 일정',
      reason: '이메일 연동',
      request: scheduleCard.quote.trim() || '이메일 내용 기반 AI 추출 일정',
      deadline: deadlineStr,
      attachmentName: 'purple',
      updatedAt: new Date().toISOString(),
      unread: false,
    }

    try {
      await saveTeamMemoryPattern(pattern)
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : '팀 일정 저장에 실패했습니다.')
      setAddedDate(null)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
      return
    }

    try {
      const stored = JSON.parse(readUserStorage('ieum.teamSchedules') || '[]')
      const next = [
        {
          id: pattern.id,
          title: pattern.title,
          dateTime: deadlineStr,
          quote: scheduleCard.quote,
          source: scheduleCard.source,
          createdAt: new Date().toISOString(),
        },
        ...stored,
      ]
      writeUserStorage('ieum.teamSchedules', JSON.stringify(next))
    } catch {
      // ignore
    }

    setScheduleCard(null)
    setToastMessage('팀 일정에 추가되었어요.')
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 5000)
  }

  async function loadData() {
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
        setSelectedId((prev) => prev || list[0].id)
      }
    } catch (err: any) {
      if (err.message === 'GMAIL_NOT_CONNECTED') {
        setNotConnected(true)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleGmailConnect() {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/integrations/gmail/connect`, {
      headers: authorizationHeaders(),
    })
    await requireOk(response, 'Gmail 연결을 시작하지 못했습니다.')
    const data = await response.json() as { authorizationUrl?: string }
    if (!data.authorizationUrl) throw new Error('Gmail 인증 주소를 받지 못했습니다.')
    const popup = window.open(data.authorizationUrl, 'gmail-connect', 'popup=yes,width=520,height=680,left=200,top=80')
    if (!popup) throw new Error('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.')
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    const targetApi = import.meta.env.VITE_API_URL || window.location.origin
    const expectedOrigin = new URL(targetApi, window.location.origin).origin
    const handleMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.origin !== expectedOrigin || event.data?.type !== 'gmail-auth-success') return
      void loadData()
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
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

  const handleReplyWithAi = async (msg: InboxMessage) => {
    let targetRecipient: any = null
    const fromEmail = msg.fromEmail || ''
    const fromName = msg.fromName || fromEmail.split('@')[0] || '발신자'

    try {
      const list = await fetchRecipients()
      const found = list.find((r) => r.email && r.email.toLowerCase() === fromEmail.toLowerCase())
      if (found) {
        targetRecipient = {
          id: String(found.id),
          name: found.name,
          email: found.email,
          position: found.role || '연락처',
          company: found.company || '',
          country: found.country || 'South Korea',
          language: found.language || 'Korean',
          timezone: found.timezone || 'Asia/Seoul',
          relationship: found.organizationRelation || '외부 파트너',
          speed: found.responseSpeed || '보통',
          responseTime: found.averageResponseMinutes || 30,
          collaboration: found.collaborationActivity || 'Medium',
        }
      } else {
        const created = await createRecipient({
          name: fromName,
          email: fromEmail,
          role: '연락처',
          company: '',
          country: 'South Korea',
          language: 'Korean',
          timezone: 'Asia/Seoul',
          organizationRelation: '외부 파트너',
          responseSpeed: '보통',
          averageResponseMinutes: 30,
          collaborationActivity: 'Medium',
          isOnline: false,
          isFavorite: false,
          isRecent: true,
          verifiedExpert: false,
          fullTime: false,
          avatar: fromName.slice(0, 1).toUpperCase(),
        })
        targetRecipient = {
          id: String(created.id),
          name: created.name,
          email: created.email,
          position: created.role || '연락처',
          company: created.company || '',
          country: created.country || 'South Korea',
          language: created.language || 'Korean',
          timezone: created.timezone || 'Asia/Seoul',
          relationship: created.organizationRelation || '외부 파트너',
          speed: created.responseSpeed || '보통',
          responseTime: created.averageResponseMinutes || 30,
          collaboration: created.collaborationActivity || 'Medium',
        }
      }
    } catch {
      targetRecipient = {
        id: `inbox-reply-${Date.now()}`,
        name: fromName,
        email: fromEmail,
        position: '연락처',
        company: '',
        country: 'South Korea',
        language: 'Korean',
        timezone: 'Asia/Seoul',
        relationship: '외부 파트너',
        speed: '보통',
        responseTime: 30,
        collaboration: 'Medium',
      }
    }

    const rawBody = msg.body || msg.snippet || ''
    const cleanBody = rawBody.length > 500 ? `${rawBody.slice(0, 500)}...` : rawBody

    navigate('/messages', {
      state: {
        recipient: targetRecipient,
        subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
        body: `\n\n--- 원본 메일 (${msg.from}) ---\n${cleanBody}`,
      },
    })
  }

  const handleCopyBody = (text: string) => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-screen flex-col bg-[#f8f9fc]">
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
      <div className="min-h-0 flex-1 p-8">
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
                onClick={() => { void handleGmailConnect().catch((error) => window.alert(error instanceof Error ? error.message : 'Gmail 연결을 시작하지 못했습니다.')) }}
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
          <div className="grid h-full grid-cols-[360px_minmax(0,1fr)] items-stretch gap-7">
            {/* Left: Email List */}
            <div className="flex flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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
            <div className="flex flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              {!selectedDetail ? (
                <div className="flex flex-1 items-center justify-center p-12 text-center text-[#888]">
                  메일을 선택하면 상세 내용이 표시됩니다.
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* Detail Header */}
                  <div className="shrink-0 border-b border-[#ededf0] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-[20px] font-bold text-[#1f1e24] leading-snug">
                        {selectedDetail.subject}
                      </h2>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyBody(selectedDetail.body || selectedDetail.snippet)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#dedee3] bg-white px-3 py-2 text-[12px] font-medium text-[#555] transition hover:bg-[#f7f7fa] cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="8" y="8" width="12" height="12" rx="2" />
                            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                          </svg>
                          {copied ? '복사 완료!' : '본문 복사'}
                        </button>

                        {/* Button 1: AI 일정 추천 */}
                        <button
                          type="button"
                          onClick={() => void handleRecommendSchedule(selectedDetail)}
                          disabled={scheduleLoading}
                          className="flex items-center gap-1.5 rounded-lg bg-[#5338ec] px-4 py-2 text-[12px] font-semibold text-white shadow-xs transition hover:bg-[#432bc6] disabled:opacity-60 disabled:cursor-wait cursor-pointer"
                        >
                          {scheduleLoading ? (
                            <>
                              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="10" />
                              </svg>
                              <span>일정 분석 중...</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              <span>AI 일정 추천</span>
                            </>
                          )}
                        </button>

                        {/* Button 2: AI 답장 작성 */}
                        <button
                          type="button"
                          onClick={() => handleReplyWithAi(selectedDetail)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#d1d0d7] bg-white px-4 py-2 text-[12px] font-semibold text-[#374151] shadow-2xs transition hover:bg-[#f9fafb] hover:border-[#9ca3af] cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5 text-[#6b7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>AI 답장 작성</span>
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
                            수신: {formatFullDateTime(selectedDetail.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail Body */}
                  <div className="min-h-0 flex-1 overflow-y-auto p-8">
                    {detailLoading ? (
                      <div className="space-y-3">
                        <div className="h-4 w-full animate-pulse rounded bg-[#f0f0f5]" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-[#f0f0f5]" />
                        <div className="h-4 w-4/6 animate-pulse rounded bg-[#f0f0f5]" />
                      </div>
                    ) : (
                      <>
                        <MarkdownViewer
                          content={selectedDetail.body || selectedDetail.snippet || ''}
                          htmlContent={selectedDetail.htmlBody || ''}
                          className="text-[13px] leading-relaxed text-[#2f2e34]"
                        />

                        {/* Attachments Section */}
                        {selectedDetail.attachments && selectedDetail.attachments.length > 0 && (
                          <div className="mt-8 border-t border-[#ededf0] pt-6">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="h-4 w-4 text-[#4f46e5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                              </svg>
                              <span className="text-[13px] font-bold text-[#222]">
                                첨부파일 ({selectedDetail.attachments.length}개)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedDetail.attachments.map((att, idx) => (
                                <div
                                  key={att.id || idx}
                                  className="group flex items-center justify-between gap-3 rounded-xl border border-[#e5e5eb] bg-[#fbfbfe] p-3.5 transition hover:border-[#cfc7ff] hover:bg-white hover:shadow-sm"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eeeaff] text-[#4f46e5]">
                                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14 2 14 8 20 8" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-[12px] font-semibold text-[#29272c] group-hover:text-[#4f46e5]">
                                        {att.name || att.filename || '첨부파일'}
                                      </p>
                                      <p className="text-[10px] text-[#888]">
                                        {formatFileSize(att.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => downloadInboxAttachment(selectedDetail.id, att)}
                                    className="flex shrink-0 items-center gap-1 rounded-lg border border-[#d9d9df] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#4f46e5] shadow-xs transition hover:bg-[#f5f3ff] hover:border-[#c4b5fd]"
                                    title="다운로드"
                                  >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="7 10 12 15 17 10" />
                                      <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span>다운로드</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="shrink-0 border-t border-[#ededf0] bg-[#fafafc] px-6 py-3.5 flex items-center justify-between text-[12px] text-[#777]">
                    <span>
                      이 메일에 답장하려면 우측 상단의 <strong className="text-[#4f46e5] font-semibold">[AI 답장 작성]</strong>을 눌러 맞춤형 톤앤매너로 신속하게 답장할 수 있습니다.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis Card Modal (Figma design) */}
      {scheduleCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={() => setScheduleCard(null)}
        >
          <div
            className="w-full max-w-[440px] rounded-[24px] bg-white p-7 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f0edff] text-[#6b47ed]">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8" y2="16" />
                  <line x1="16" y1="16" x2="16" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-[#1f1e24] tracking-[-0.01em]">
                  AI가 일정 관련 내용을 분석했어요
                </h3>
                <p className="text-[12px] text-[#716b78] mt-0.5">
                  메일에서 일정을 추출해 추천드려요.
                </p>
              </div>
            </div>

            {/* Quote Snippet Box (editable) */}
            <div className="mt-5 rounded-xl bg-[#f8f9fb] p-3.5 border border-[#ececf2]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[#6b7280]">발췌된 메일 본문</span>
                <span className="text-[10px] text-[#9ca3af]">직접 수정 가능</span>
              </div>
              <textarea
                value={scheduleCard.quote}
                onChange={(e) => setScheduleCard((prev) => (prev ? { ...prev, quote: e.target.value } : null))}
                rows={2}
                className="w-full resize-none rounded-lg bg-white/70 p-2 text-[13px] font-medium leading-relaxed text-[#374151] border border-transparent focus:border-[#5338ec] focus:bg-white outline-none"
                placeholder="일정 관련 본문 내용"
              />
            </div>

            {/* Detail Box (editable) */}
            <div className="mt-4 rounded-xl border border-[#ededf2] bg-white p-4 space-y-3 text-[13px]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#6b7280] w-14 shrink-0 font-medium">
                  <svg className="h-4 w-4 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span>제목</span>
                </div>
                <input
                  type="text"
                  value={scheduleCard.title}
                  onChange={(e) => setScheduleCard((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                  className="flex-1 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-[13px] font-semibold text-[#1f2937] outline-none focus:border-[#5338ec]"
                  placeholder="예: 보고서 마감"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#6b7280] w-14 shrink-0 font-medium">
                  <svg className="h-4 w-4 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>일시</span>
                </div>
                <input
                  type="text"
                  value={scheduleCard.dateTime}
                  onChange={(e) => setScheduleCard((prev) => (prev ? { ...prev, dateTime: e.target.value } : null))}
                  className="flex-1 rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-[13px] font-semibold text-[#1f2937] outline-none focus:border-[#5338ec]"
                  placeholder="예: 8.20 오후 3:00"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[#6b7280] w-14 shrink-0 font-medium">
                  <svg className="h-4 w-4 text-[#9ca3af]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>출처</span>
                </div>
                <span className="font-medium text-[#6b7280] px-3 py-1.5">
                  {scheduleCard.source}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setScheduleCard(null)}
                className="flex-1 h-11.5 rounded-xl border border-[#dedee5] bg-[#f9fafb] text-[13px] font-semibold text-[#4b5563] hover:bg-[#f3f4f6] transition cursor-pointer"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="flex-1 h-11.5 rounded-xl bg-[#4338ca] text-[13px] font-semibold text-white hover:bg-[#3730a3] transition cursor-pointer shadow-sm"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Figma design top-right) */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#d1fae5] bg-white px-5 py-3 shadow-xl transition-all animate-in slide-in-from-top-2 duration-200">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dcfce7] text-[#16a34a]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[#1f2937]">{toastMessage}</span>
          {toastMessage.includes('추가') && (
            <button
              type="button"
              onClick={() => navigate(addedDate ? `/team-memory?date=${addedDate}` : '/team-memory')}
              className="ml-1 rounded-lg bg-[#5338ec] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#432bc6] transition cursor-pointer shadow-xs"
            >
              팀 일정 확인 →
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="ml-1 text-[#9ca3af] hover:text-[#4b5563] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
