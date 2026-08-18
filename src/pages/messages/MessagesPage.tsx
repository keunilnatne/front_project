import { useEffect, useRef, useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { createRecipient, fetchRecipients, type Recipient as UserRecipient } from '../../users/recipients'
import { optimizeMessage, sendMessage } from '../../users/messageService'
import { analyzeMessageMetadata } from '../../ai/aiInsights'
import { fetchConversations, saveConversation, type Conversation } from '../../users/conversationArchive'
import { detectMessageLanguage, translateAndSpellCheck } from '../../ai/freeLanguageTools'
import { type AttachmentItem } from '../../components/AttachmentPicker'
import { saveDraftToServer } from '../../users/drafts'

type Recipient = {
  id: string
  name: string
  email?: string
  position: string
  company: string
  country?: string
  language: string
  timezone: string
  relationship: string
  responseTime?: number
  speed?: string
  collaboration?: string
}

type MessagePageState = {
  recipients?: Recipient[]
  recipient?: Recipient
  subject?: string
  body?: string
  attachments?: AttachmentItem[]
}

/* -------------------------------------------------------
 * 공통 아이콘
 * ----------------------------------------------------- */

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function PaperclipIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m21.4 11.6-8.8 8.8a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  )
}

function getRecipientTimeNotice(recipient?: Recipient) {
  if (!recipient?.timezone) return '수신자를 선택하면 현지 업무시간을 확인할 수 있습니다.'
  try {
    const now = new Date()
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: recipient.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
    const [hour, minute] = time.split(':').map(Number)
    const afterHours = hour >= 18 || hour < 9
    const labels: Record<string, string> = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT', 'Asia/Seoul': 'KST', 'Asia/Tokyo': 'JST', 'America/New_York': 'ET', 'America/Los_Angeles': 'PT' }
    const zone = labels[recipient.timezone] || recipient.timezone
    return `${zone} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} · ${afterHours ? '수신자 업무 시간 이후입니다' : '수신자 업무 시간입니다'}`
  } catch { return `${recipient.timezone} · 수신자 현지 시간을 확인할 수 없습니다.` }
}

/* -------------------------------------------------------
 * 수신자 Context 컴포넌트
 * 사진에서 보이는 1명 단위
 * ----------------------------------------------------- */

function RecipientContextCard({
  recipient,
  aiTags = [],
}: {
  recipient: Recipient
  aiTags?: string[]
}) {
  return (
    <div className="border-b border-[#eeeef0] pb-6">
      {/* 사람 정보 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0f0f4] text-[11px] font-semibold text-[#555]">
          {recipient.name.slice(0, 2)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#29292d]">
            {recipient.name}
          </p>

          <p className="truncate text-[11px] text-[#999]">
            {recipient.position} · {recipient.company}
          </p>
        </div>
      </div>

      {/* 기본 Context */}
      <div className="mt-5 space-y-3 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#999]">국가</span>

          <span className="font-medium text-[#29292d]">
            {recipient.country || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[#999]">언어</span>

          <span className="font-medium text-[#29292d]">
            {recipient.language || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[#999]">시간대</span>

          <span className="font-medium text-[#29292d]">
            {recipient.timezone || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[#999]">직무</span>

          <span className="max-w-45 text-right font-medium text-[#29292d]">
            {recipient.position || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[#999]">조직 관계</span>

          <span className="max-w-45 text-right font-medium text-[#29292d]">
            {recipient.relationship || '-'}
          </span>
        </div>
      </div>

      {/* 커뮤니케이션 스타일 */}
      <div className="mt-5">
        <p className="text-[10px] text-[#999]">
          커뮤니케이션 스타일
        </p>
        <div className="mt-2 max-h-24 overflow-y-auto pr-1">
          {aiTags.length ? <div className="flex flex-wrap gap-1.5">{aiTags.map((tag) => <span key={tag} className="rounded bg-[#f0ebff] px-2 py-1 text-[9px] text-[#6343dd]">{tag}</span>)}</div> : <p className="text-[10px] text-[#999]">AI 분석 결과가 아직 없습니다.</p>}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------
 * Messages Page
 * ----------------------------------------------------- */

export default function MessagesPage() {
  const [search, setSearch] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [openedConversation, setOpenedConversation] = useState<Conversation | null>(null)

  const pageState = location.state as MessagePageState | null

  useEffect(() => {
    const id = searchParams.get('conversation')
    let active = true
    const loadConversation = async () => {
      if (!id) {
        if (active) setOpenedConversation(null)
        return
      }
      const items = await fetchConversations()
      const found = items.find((item) => item.id === id)
      if (active) setOpenedConversation(found || null)
    }
    void loadConversation()
    return () => { active = false }
  }, [searchParams])


  const [recipients, setRecipients] =
    useState<Recipient[]>([])

  // 처음에는 비어있음
  const [selectedRecipients, setSelectedRecipients] =
    useState<Recipient[]>([])

  const [showRecipientList, setShowRecipientList] = useState(false)
  const [quickRecipient, setQuickRecipient] = useState({ email: '', role: '' })
  const [quickRecipientError, setQuickRecipientError] = useState('')
  const [quickRecipientSaving, setQuickRecipientSaving] = useState(false)
  const recipientPickerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subject, setSubject] =
    useState(pageState?.subject || '')

  const [body, setBody] =
    useState(pageState?.body || '')

  const [attachments, setAttachments] =
    useState<AttachmentItem[]>(pageState?.attachments || [])

  const [loading, setLoading] = useState(false)
  const [sendingDirect, setSendingDirect] = useState(false)

  const [draftSaved, setDraftSaved] = useState(false)
  const [aiMetadata, setAiMetadata] = useState<{ priority?: string; tags?: string[]; terms?: string[]; rules?: string[]; sourceLanguage?: string; targetLanguage?: string } | null>(null)

  /* 수정하기로 돌아온 경우 기존 데이터 유지 */
  useEffect(() => {
    const applyPageState = async () => {
      if (pageState?.recipients?.length) {
        setSelectedRecipients(pageState.recipients.slice(0, 1))
      } else if (pageState?.recipient) {
        setSelectedRecipients([pageState.recipient])
      }

      if (typeof pageState?.subject === 'string') setSubject(pageState.subject)
      if (typeof pageState?.body === 'string') setBody(pageState.body)
      if (Array.isArray(pageState?.attachments)) setAttachments(pageState.attachments)
    }
    void applyPageState()
  }, [pageState])

  /* 수신자 목록 */
  useEffect(() => {
    const controller = new AbortController()
    void fetchRecipients(controller.signal)
      .then((data) => {
        setRecipients(data.map(toMessageRecipient))
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error(error)
        }
      })
    return () => controller.abort()
  }, [])

  function toggleRecipient(item: Recipient) {
    setSelectedRecipients((current) => {
      const exists = current.some(
        (recipient) => recipient.id === item.id,
      )

      if (exists) {
        return []
      }

      return [item]
    })
    setShowRecipientList(false)
  }

  function removeRecipient(id: string) {
    setSelectedRecipients((current) =>
      current.filter((recipient) => recipient.id !== id),
    )
  }

  async function addQuickRecipient() {
    const email = quickRecipient.email.trim().toLowerCase()
    const role = quickRecipient.role.trim()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setQuickRecipientError('올바른 이메일 주소를 입력해주세요.')
      return
    }
    if (!role) {
      setQuickRecipientError('수신자의 직책을 입력해주세요.')
      return
    }

    const existing = recipients.find((recipient) => recipient.email?.toLowerCase() === email)
    if (existing) {
      setSelectedRecipients([existing])
      setQuickRecipient({ email: '', role: '' })
      setQuickRecipientError('')
      setShowRecipientList(false)
      return
    }

    setQuickRecipientSaving(true)
    setQuickRecipientError('')
    const emailName = email.split('@')[0]
    const company = email.split('@')[1]?.split('.')[0] || ''
    const recipient = {
      name: emailName,
      email,
      role,
      company,
      country: 'South Korea',
      language: 'Korean',
      timezone: 'Asia/Seoul',
      organizationRelation: '외부 수신자',
      responseSpeed: '보통',
      averageResponseMinutes: 0,
      collaborationActivity: 'Medium',
      isOnline: false,
      isFavorite: false,
      isRecent: true,
      verifiedExpert: false,
      fullTime: false,
      avatar: emailName.slice(0, 1).toUpperCase(),
    }

    try {
      const saved = await createRecipient(recipient)
      const messageRecipient = toMessageRecipient(saved)
      setRecipients((current) => [messageRecipient, ...current.filter((item) => item.id !== messageRecipient.id)])
      setSelectedRecipients([messageRecipient])
      setQuickRecipient({ email: '', role: '' })
      setShowRecipientList(false)
    } catch {
      setQuickRecipientError('수신자를 추가하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setQuickRecipientSaving(false)
    }
  }

  useEffect(() => {
    if (!showRecipientList) return
    const handlePointerDown = (event: MouseEvent) => {
      if (recipientPickerRef.current && !recipientPickerRef.current.contains(event.target as Node)) {
        setShowRecipientList(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [showRecipientList])

  useEffect(() => {
    if (!subject.trim() && !body.trim()) { setAiMetadata(null); return }
    const timer = window.setTimeout(() => {
      void analyzeMessageMetadata({
        recipients: selectedRecipients,
        subject,
        body,
        sourceLanguage: detectMessageLanguage(`${subject} ${body}`),
        targetLanguages: selectedRecipients.map((recipient) => recipient.language),
      }).then((metadata) => {
        if (!metadata) { setAiMetadata(null); return }
        setAiMetadata(metadata)
      })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [selectedRecipients, subject, body])

  /* 임시 저장 */
  async function saveDraft() {
    try {
      await saveDraftToServer({
        recipients: selectedRecipients,
        subject,
        body,
        attachments,
      })
    } catch {
      // ignore
    }

    setDraftSaved(true)

    window.setTimeout(() => {
      setDraftSaved(false)
    }, 1800)
  }

  /* AI 최적화 */
  async function handleOptimizeMessage() {
    if (selectedRecipients.length === 0) {
      alert('수신자를 선택해주세요.')
      return
    }
    if (!subject.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (!body.trim()) {
      alert('메시지를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const optimized = await optimizeMessage({
        recipients: selectedRecipients.map((item) => ({
          id: Number(item.id),
          name: item.name,
          email: item.email,
          role: item.position,
          company: item.company,
          country: item.country || '',
          language: item.language,
          timezone: item.timezone,
          organizationRelation: item.relationship,
          responseSpeed: item.speed === '빠름' || item.speed === '느림' ? item.speed : '보통',
          averageResponseMinutes: item.responseTime || 0,
          collaborationActivity: item.collaboration === 'High' || item.collaboration === 'Low' ? item.collaboration : 'Medium',
          isOnline: false,
          isFavorite: false,
          isRecent: false,
          verifiedExpert: false,
          fullTime: false,
          avatar: item.name.slice(0, 1),
        })),
        subject,
        body,
      })

      const optimizedMetadata = await analyzeMessageMetadata({
        recipients: selectedRecipients,
        subject: optimized.subject,
        body: optimized.body,
        optimized: true,
        sourceLanguage: detectMessageLanguage(`${optimized.subject} ${optimized.body}`),
        targetLanguages: selectedRecipients.map((recipient) => recipient.language),
      })
      navigate('/messages/optimized', {
        state: {
          recipients: selectedRecipients,
          messageId: optimized.messageId,
          messageResultId: optimized.messageResultId,
          subject: optimized.subject,
          body: optimized.body,
          originalSubject: subject,
          originalBody: body,
          attachments,
          score: optimized.score,
          explanation: optimized.explanation,
          aiContext: optimizedMetadata,
        },
      })
    } catch (error) {
      console.error(error)
      try {
        const detectedSource = aiMetadata?.sourceLanguage || detectMessageLanguage(`${subject} ${body}`)
        const targetLang = selectedRecipients[0]?.language || 'en'
        const fallbackSub = await translateAndSpellCheck(subject, targetLang, detectedSource)
        const fallbackBody = await translateAndSpellCheck(body, targetLang, detectedSource)
        navigate('/messages/optimized', {
          state: {
            recipients: selectedRecipients,
            subject: fallbackSub.translatedText || subject,
            body: fallbackBody.translatedText || body,
            originalSubject: subject,
            originalBody: body,
            attachments,
            fallbackMode: true,
            fallbackMessage: 'AI 연결에 실패해서 맞춤법 및 언어 변환만 진행했습니다.',
            spellCorrections: [...(fallbackSub.corrections || []), ...(fallbackBody.corrections || [])],
            detectedSourceLanguage: fallbackBody.sourceLanguage,
            targetLanguage: fallbackBody.targetLanguage,
            aiContext: { tags: [], terms: [], rules: [] },
          },
        })
      } catch {
        alert('AI 최적화에 실패했습니다. 무료 번역/맞춤법 검사도 사용할 수 없습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDirectSendGmail() {
    if (!selectedRecipients.length) {
      alert('받는 사람을 1명 선택해주세요.')
      return
    }
    if (!subject.trim()) {
      alert('메시지 제목을 입력해주세요.')
      return
    }
    if (!body.trim()) {
      alert('메시지 본문을 입력해주세요.')
      return
    }

    const recipient = selectedRecipients[0]
    if (!window.confirm(`[${recipient.name}] 님에게 Gmail로 메시지를 바로 발송하시겠습니까?`)) {
      return
    }

    setSendingDirect(true)
    try {
      await sendMessage({
        recipients: selectedRecipients.map((item) => ({
          id: Number(item.id),
          name: item.name,
          email: item.email || '',
          role: item.position,
          company: item.company,
          country: item.country || '',
          language: item.language,
          timezone: item.timezone,
          organizationRelation: item.relationship,
          responseSpeed: item.speed === '빠름' || item.speed === '느림' ? item.speed : '보통',
          averageResponseMinutes: item.responseTime || 0,
          collaborationActivity: item.collaboration === 'High' || item.collaboration === 'Low' ? item.collaboration : 'Medium',
          isOnline: false,
          isFavorite: false,
          isRecent: false,
          verifiedExpert: false,
          fullTime: false,
          avatar: item.name.slice(0, 1),
        })),
        subject,
        body,
        originalSubject: subject,
        originalBody: body,
        attachments,
      })

      await saveConversation({
        id: `conversation-${Date.now()}`,
        title: subject || '메시지',
        updatedAt: new Date().toISOString(),
        messages: [
          {
            role: 'user',
            content: body,
            createdAt: new Date().toISOString(),
          },
        ],
        analysisStatus: 'completed',
      })

      alert('Gmail을 통해 메시지가 성공적으로 발송되었습니다!')
      navigate('/history')
    } catch (error) {
      console.error(error)
      const raw = error instanceof Error ? error.message : String(error)
      if (raw.includes('GMAIL_NOT_CONNECTED') || raw.includes('연동되지 않았습니다') || raw.includes('Gmail')) {
        alert('Gmail 계정이 연동되지 않았습니다. [설정] 메뉴 또는 구글 로그인으로 계정을 연동해주세요.')
      } else {
        alert(raw || '메시지 전송에 실패했습니다. 백엔드 연결 상태를 확인해주세요.')
      }
    } finally {
      setSendingDirect(false)
    }
  }

  const normalizedSearch = search.trim().toLowerCase()
  const visibleRecipients = recipients.filter((item) =>
    !normalizedSearch
      || `${item.name} ${item.email || ''} ${item.position} ${item.company} ${item.country || ''}`
        .toLowerCase()
        .includes(normalizedSearch),
  )

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {openedConversation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 p-6" onMouseDown={() => { setOpenedConversation(null); setSearchParams((current) => { current.delete('conversation'); return current }) }}>
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#eeeef1] px-6 py-5">
              <div><h2 className="text-[15px] font-semibold">{openedConversation.title}</h2><p className="mt-1 text-[11px] text-[#999]">메시지 {openedConversation.messages.length}개</p></div>
              <button type="button" onClick={() => { setOpenedConversation(null); setSearchParams((current) => { current.delete('conversation'); return current }) }} className="text-xl text-[#888]">×</button>
            </div>
            <div className="space-y-3 overflow-y-auto p-6">
              {openedConversation.messages.map((message, index) => <div key={`${openedConversation.id}-${index}`} className={`max-w-[80%] rounded-xl px-4 py-3 text-[12px] leading-5 ${message.role === 'user' ? 'ml-auto bg-[#f1edff]' : 'bg-[#f5f5f7]'}`}><p>{message.content}</p>{message.createdAt && <p className="mt-1 text-[9px] text-[#999]">{new Date(message.createdAt).toLocaleString('ko-KR')}</p>}</div>)}
            </div>
          </div>
        </div>
      )}
      <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} />

      {/* PAGE */}
      <div className="min-h-[calc(100vh-68px)]">
        <div className="grid min-h-[calc(100vh-68px)] grid-cols-[minmax(0,1fr)_375px]">
          {/* MAIN */}
          <main className="min-w-0 px-8 pb-12 pt-8">
            <div className="mx-auto w-full max-w-225">
              {/* TITLE */}
              <div className="mb-10 flex items-center justify-between">
                <h1 className="ieum-page-title text-[#2d282c]">
                  새 메시지 작성
                </h1>

                <div className="flex items-center gap-2">
                  {/* 임시 저장 */}
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="flex items-center gap-2 rounded-lg border border-[#dddde3] bg-white px-4 py-3 text-[13px] transition hover:bg-[#f7f7f9]"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 5h16v14H4z" />
                      <path d="M8 3v4M16 3v4M4 9h16" />
                    </svg>

                    {draftSaved ? '저장됨' : '임시 저장'}
                  </button>

                  {/* 임시저장함 */}
                  <button
                    type="button"
                    onClick={() => navigate('/messages/drafts')}
                    className="flex items-center gap-2 rounded-lg border border-[#dddde3] bg-white px-4 py-3 text-[13px] transition hover:bg-[#f7f7f9]"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 6h16v13H4z" />
                      <path d="M8 3h8l1 3H7l1-3Z" />
                    </svg>

                    임시저장함
                  </button>
                </div>
              </div>

              {/* RECIPIENT */}
              <div ref={recipientPickerRef} className="relative mb-5 flex items-center">
                <span className="w-[115px] shrink-0 text-[13px] text-[#5e5960]">
                  받는 사람
                </span>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {selectedRecipients.map((item) => (
                    <div
                      key={item.id}
                      className="flex h-10 items-center rounded-lg border border-[#ddd5ff] bg-[#f4f1ff] px-3 text-[13px]"
                    >
                      <div className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#c8c8c8] text-[9px]">
                        {item.name.slice(0, 1)}
                      </div>

                      <span className="whitespace-nowrap">
                        {item.name} · {item.position} · {item.company}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeRecipient(item.id)}
                        className="ml-3 text-[18px] leading-none text-[#777] transition hover:text-[#333]"
                        aria-label={`${item.name} 제거`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* + 버튼 */}
                <button
                  type="button"
                  onClick={() =>
                    setShowRecipientList(!showRecipientList)
                  }
                  className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#5c5149] transition hover:bg-[#f2edff] hover:text-[#4338ca]"
                  aria-label="수신자 추가"
                >
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </button>

                {/* RECIPIENT LIST */}
                {showRecipientList && (
                  <div className="absolute left-28.75 top-12 z-50 max-h-[75vh] w-90 overflow-y-auto rounded-xl border border-[#dedde4] bg-white shadow-lg">
                    <div className="border-b border-[#eeeeef] px-4 py-3">
                      <p className="text-[12px] font-semibold">
                        수신자 선택
                      </p>

                      <p className="mt-1 text-[10px] text-[#999]">
                        AI 최적화를 위해 한 명만 선택할 수 있습니다.
                      </p>
                    </div>

                    {visibleRecipients.map((item) => {
                      const selected = selectedRecipients.some(
                        (recipient) => recipient.id === item.id,
                      )

                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => toggleRecipient(item)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f7f5ff]"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ddd] text-[12px]">
                            {item.name.slice(0, 1)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold">
                              {item.name}
                            </p>

                            <p className="truncate text-[11px] text-[#888]">
                              {item.position} · {item.company}
                            </p>
                          </div>

                          <div
                            className={[
                              'flex h-5 w-5 items-center justify-center rounded border',
                              selected
                                ? 'border-[#6339ed] bg-[#6339ed] text-white'
                                : 'border-[#d7d5dc] bg-white',
                            ].join(' ')}
                          >
                            {selected && (
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="m5 12 4 4L19 6" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}

                    {visibleRecipients.length === 0 && (
                      <p className="px-4 py-4 text-center text-[11px] text-[#999]">등록된 수신자가 없습니다.</p>
                    )}

                    <div className="border-t border-[#eeeeef] bg-[#faf9ff] px-4 py-4">
                      <p className="text-[11px] font-semibold text-[#4f4657]">새 수신자 바로 추가</p>
                      <p className="mt-1 text-[10px] leading-4 text-[#8c8592]">등록되지 않은 사람도 이메일과 직책만으로 메시지를 작성할 수 있습니다.</p>
                      <div className="mt-3 grid gap-2">
                        <input
                          type="email"
                          value={quickRecipient.email}
                          onChange={(event) => { setQuickRecipient((current) => ({ ...current, email: event.target.value })); setQuickRecipientError('') }}
                          placeholder="이메일 (name@company.com)"
                          className="h-9 rounded-lg border border-[#dddde3] bg-white px-3 text-[11px] outline-none focus:border-[#6650df]"
                        />
                        <input
                          value={quickRecipient.role}
                          onChange={(event) => { setQuickRecipient((current) => ({ ...current, role: event.target.value })); setQuickRecipientError('') }}
                          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void addQuickRecipient() } }}
                          placeholder="직책 (예: 마케팅 팀장)"
                          className="h-9 rounded-lg border border-[#dddde3] bg-white px-3 text-[11px] outline-none focus:border-[#6650df]"
                        />
                      </div>
                      {quickRecipientError && <p className="mt-2 text-[10px] text-[#d04a5a]">{quickRecipientError}</p>}
                      <button
                        type="button"
                        onClick={() => void addQuickRecipient()}
                        disabled={quickRecipientSaving}
                        className="mt-3 w-full rounded-lg border border-[#6650df] bg-white py-2 text-[11px] font-semibold text-[#5531e8] transition hover:bg-[#f3f0ff] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {quickRecipientSaving ? '추가 중...' : '추가하고 받는 사람으로 선택'}
                      </button>
                    </div>

                    <div className="border-t border-[#eeeeef] px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setShowRecipientList(false)
                        }
                        className="w-full rounded-lg bg-[#5531e8] py-2.5 text-[12px] font-semibold text-white"
                      >
                        선택 완료
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 수신자 선택 즉시 선호 스타일 및 협업 정보 표시 배너 */}
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e5e1f8] bg-[#f8f7ff] px-4 py-3 text-[12px] shadow-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#5531e8]">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>선호 소통 스타일:</span>
                    <span className="rounded-md bg-[#eeeaff] px-2 py-0.5 font-bold text-[#4f46e5]">
                      {selectedRecipients[0].relationship || '명확하고 간결하게'}
                    </span>
                  </div>

                  <div className="hidden h-3.5 w-[1px] bg-[#d9d5f0] sm:block" />

                  <div className="flex items-center gap-1.5 text-[#555]">
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>응답 속도:</span>
                    <span className="font-medium text-[#333]">
                      {selectedRecipients[0].speed || '보통'} ({selectedRecipients[0].responseTime ? `약 ${selectedRecipients[0].responseTime}분` : '평균 속도'})
                    </span>
                  </div>

                  <div className="hidden h-3.5 w-[1px] bg-[#d9d5f0] sm:block" />

                  <div className="flex items-center gap-1.5 text-[#555]">
                    <svg className="h-3.5 w-3.5 shrink-0 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <span>조직 관계:</span>
                    <span className="font-medium text-[#333]">
                      {selectedRecipients[0].relationship || '팀원'}
                    </span>
                  </div>
                </div>
              )}

              {/* MESSAGE FORM */}
              <div className="overflow-hidden rounded-xl border border-[#e1e0e5] bg-white">
                {/* SUBJECT */}
                <div className="flex border-b border-[#eeeeef]">
                  <span className="w-22.5 shrink-0 px-6 py-5 text-[13px] text-[#777]">
                    제목
                  </span>

                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 px-3 py-5 text-[15px] font-semibold outline-none"
                    placeholder="제목을 입력하세요"
                  />
                </div>

                {/* BODY */}
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="h-70 w-full resize-none px-6 py-6 text-[15px] leading-10 text-[#454049] outline-none"
                  placeholder="메시지를 입력하세요"
                />

                {/* ATTACHMENT PREVIEW (compact) */}
                {attachments.length > 0 && (
                  <div className="border-t border-[#eeeeef] bg-[#fafaff] px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="group flex items-center gap-2 rounded-lg border border-[#e5e3ec] bg-white px-3 py-2 text-[12px]">
                          {file.type?.startsWith('image/') && file.data ? (
                            <img src={file.data} alt={file.name} className="h-6 w-6 rounded object-cover" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                              <path d="M14 2v6h6" />
                            </svg>
                          )}
                          <span className="max-w-[120px] truncate text-[#555]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                            className="ml-1 text-[#bbb] transition hover:text-[#d04a5a]"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TIME INFO */}
                <div className="flex items-center gap-2 border-t border-[#eeeeef] px-5 py-3 text-[12px] text-[#a2a0a7]">
                  <ClockIcon />

                  {getRecipientTimeNotice(selectedRecipients[0])}
                </div>

                {/* BOTTOM */}
                <div className="flex items-center justify-between border-t border-[#eeeeef] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        files.forEach((file) => {
                          if (file.size > 10 * 1024 * 1024) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            setAttachments((prev) => [
                              ...prev,
                              { id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: file.name, type: file.type, size: file.size, data: reader.result as string },
                            ])
                          }
                          reader.readAsDataURL(file)
                        })
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      aria-label="파일 첨부"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#777] transition hover:text-[#4338ca]"
                    >
                      <PaperclipIcon />
                    </button>

                    {aiMetadata && (
                      <div className="flex max-w-[520px] flex-wrap gap-1.5">
                        {aiMetadata.priority && <span className="rounded bg-[#ffe5e8] px-2 py-1 text-[11px] text-[#9e4653]">PRIORITY {aiMetadata.priority}</span>}
                        {(aiMetadata.tags || []).map((tag) => <span key={tag} className="rounded bg-[#f1edff] px-2 py-1 text-[10px] font-medium text-[#6244db]">{tag}</span>)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDirectSendGmail}
                      disabled={loading || sendingDirect}
                      className="flex items-center gap-2 rounded-lg border border-[#dedde5] bg-white px-5 py-4 text-[14px] font-semibold text-[#37353f] transition hover:bg-[#f6f6f9] hover:border-[#c5c3d4] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
                      title="AI 변환 단계 없이 작성한 내용을 바로 Gmail로 발송합니다"
                    >
                      <svg className="h-4 w-4 text-[#ea4335]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      {sendingDirect ? '발송 중...' : 'Gmail로 보내기'}
                    </button>

                    <button
                      type="button"
                      onClick={handleOptimizeMessage}
                      disabled={loading || sendingDirect}
                      className="flex items-center gap-2 rounded-lg bg-[#4f2ee0] px-6 py-4 text-[14px] font-semibold text-white transition hover:bg-[#4525d0] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      <SparkleIcon />

                      {loading
                        ? '최적화 중...'
                        : 'AI로 최적화하기'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* RIGHT CONTEXT */}
          <aside className="min-h-full border-l border-[#e3e2e7] bg-white px-6 py-8">
            <h2 className="text-[14px] font-bold text-[#302d32]">
              AI 협업 CONTEXT
            </h2>

            {selectedRecipients.length > 0 ? (
              <>
                {/* 수신자별 컴포넌트 */}
                <div className="mt-5 space-y-6">
                  {selectedRecipients.map((recipient) => (
                    <RecipientContextCard
                      key={recipient.id}
                      recipient={recipient}
                      aiTags={aiMetadata?.tags || []}
                    />
                  ))}
                </div>

                {/* AI 제안은 여기 하나만 */}
                <div className="mt-6 rounded-xl bg-[#f2edff] p-5">
                  <div className="flex items-center gap-2">
                    <SparkleIcon />

                    <p className="text-[12px] font-semibold text-[#5b35db]">
                      AI 제안
                    </p>
                  </div>

                  <p className="mt-3 text-[12px] leading-5 text-[#625c6b]">
                    선택한 수신자의 언어, 시간대, 직무와 조직 관계를
                    고려하여 이해하기 쉬운 방식으로
                    메시지를 작성해보세요.
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#8a8494]">
                    {aiMetadata?.terms?.length ? `자주 사용하는 용어: ${aiMetadata.terms.join(', ')}` : 'AI가 메시지와 수신자 정보를 분석합니다.'}<br />AI 최적화를 실행하면 수신자 Context를 반영한
                    메시지를 생성합니다.
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-8 text-[13px] text-[#999]">
                수신자를 선택하면 협업 Context가 표시됩니다.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function toMessageRecipient(item: UserRecipient): Recipient {
  return {
    id: String(item.id), name: item.name, email: item.email, position: item.role,
    company: item.company, country: item.country, language: item.language,
    timezone: item.timezone, relationship: item.organizationRelation,
    responseTime: item.averageResponseMinutes, speed: item.responseSpeed,
    collaboration: item.collaborationActivity,
  }
}
