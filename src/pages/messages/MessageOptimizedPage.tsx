import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { sendMessage as sendMessageRequest } from '../../users/messageService'
import { saveConversation } from '../../users/conversationArchive'
import MarkdownViewer from '../../components/MarkdownViewer'
import AttachmentPicker, { type AttachmentItem } from '../../components/AttachmentPicker'

function formatSendErrorMessage(rawMessage?: string): string {
  if (!rawMessage) return '메시지 전송에 실패했습니다. 백엔드 서버 연결 상태를 확인해주세요.'
  if (rawMessage.includes('GMAIL_NOT_CONNECTED') || rawMessage.includes('연결된 Gmail 계정이 없습니다')) {
    return 'Gmail 계정이 연결되어 있지 않습니다. 설정 > 연결에서 계정을 연결해 주세요.'
  }
  if (rawMessage.includes('TOKEN_REFRESH_FAILED') || rawMessage.includes('인증이 만료')) {
    return 'Gmail 연결 인증이 만료되었습니다. 설정 > 연결에서 계정을 다시 연결해 주세요.'
  }
  if (rawMessage.includes('RECIPIENT_INVALID') || rawMessage.includes('이메일')) {
    return '수신자 이메일 주소가 올바르지 않습니다. 수신자 정보를 확인해 주세요.'
  }
  if (rawMessage.includes('GMAIL_API_FAILED')) {
    return 'Gmail 서비스 응답 지연으로 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }
  return rawMessage
}

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

type OptimizedState = {
  messageId?: number
  messageResultId?: number
  subject: string
  body: string

  // 기존 단일 수신자 방식
  recipient?: Recipient

  // 여러 수신자 방식
  recipients?: Recipient[]

  originalSubject: string
  originalBody: string
  attachments?: AttachmentItem[]
  aiContext?: { tags?: string[]; terms?: string[]; rules?: string[]; priority?: string; sourceLanguage?: string; targetLanguage?: string }
  fallbackMode?: boolean
  fallbackMessage?: string
  spellCorrections?: Array<{ message: string; replacement: string }>
  detectedSourceLanguage?: string
  targetLanguage?: string
}

function getRecipients(state: OptimizedState): Recipient[] {
  if (Array.isArray(state.recipients) && state.recipients.length > 0) {
    return state.recipients
  }

  if (state.recipient) {
    return [state.recipient]
  }

  return []
}

/* -------------------------------------------------------
 * 공통 아이콘
 * ----------------------------------------------------- */

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.4 3.6 5.4 3.6 9s-1.2 6.6-3.6 9c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function BriefcaseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 12h16" />
    </svg>
  )
}

function RelationshipIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5" />
      <path d="M18 14c2 .5 3 2 3 4" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  )
}

function LanguageContextIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ebff] text-[#6343dd]">
      <GlobeIcon />
    </div>
  )
}

function TimeContextIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ebff] text-[#6343dd]">
      <ClockIcon />
    </div>
  )
}

function JobContextIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ebff] text-[#6343dd]">
      <BriefcaseIcon />
    </div>
  )
}

function RelationshipContextIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0ebff] text-[#6343dd]">
      <RelationshipIcon />
    </div>
  )
}

/* -------------------------------------------------------
 * 수신자 한 명 단위 Context 컴포넌트
 * ----------------------------------------------------- */

function RecipientContextCard({
  recipient,
  aiTags = [],
}: {
  recipient: Recipient
  aiTags?: string[]
}) {
  return (
    <div className="border-b border-[#eeeef0] pb-5">
      {/* 사람 정보 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9e9ec] text-[12px] font-semibold text-[#555]">
          {recipient.name
            ? recipient.name.slice(0, 2)
            : '?'}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#29272c]">
            {recipient.name || '수신자'}
          </p>

          <p className="truncate text-[11px] text-[#999]">
            {recipient.company || '-'} · {recipient.position || '-'}
          </p>
        </div>
      </div>

      {/* 정보 */}
      <div className="mt-5 space-y-4 text-[12px]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#999]">
            <GlobeIcon />
            <span>국가</span>
          </div>

          <span className="text-right font-medium text-[#29292d]">
            {recipient.country || 'South Korea'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#999]">
            <GlobeIcon />
            <span>언어</span>
          </div>

          <span className="text-right font-medium text-[#29292d]">
            {recipient.language || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#999]">
            <ClockIcon />
            <span>시간대</span>
          </div>

          <span className="text-right font-medium text-[#29292d]">
            {recipient.timezone || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#999]">
            <BriefcaseIcon />
            <span>직무</span>
          </div>

          <span className="max-w-45 text-right font-medium text-[#29292d]">
            {recipient.position || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#999]">
            <RelationshipIcon />
            <span>조직 관계</span>
          </div>

          <span className="max-w-45 text-right font-medium text-[#29292d]">
            {recipient.relationship || '-'}
          </span>
        </div>
      </div>

      {/* 커뮤니케이션 스타일 */}
      <div className="mt-6">
        <p className="text-[11px] text-[#999]">
          커뮤니케이션 스타일
        </p>

        <div className="mt-3 max-h-24 overflow-y-auto pr-1">
          {aiTags.length > 0 ? <div className="flex flex-wrap gap-1.5">{aiTags.map((tag) => <span key={tag} className="rounded bg-[#f0ebff] px-2 py-1 text-[10px] text-[#6343dd]">{tag}</span>)}</div> : <p className="text-[10px] text-[#999]">AI 최적화 과정에서 생성된 수신자 스타일 정보가 없습니다.</p>}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------
 * PAGE
 * ----------------------------------------------------- */

export default function MessageOptimizedPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as OptimizedState | null

  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  if (!state) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <PageHeader />
        <div className="flex min-h-[calc(100vh-68px)] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-[15px] text-[#555]">
              최적화된 메시지가 없습니다.
            </p>

            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="rounded-lg bg-[#4f2ee0] px-5 py-3 text-[14px] font-semibold text-white"
            >
              메시지 작성으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  const recipients = getRecipients(state)

  const {
    subject,
    body,
    originalSubject,
    originalBody,
    aiContext,
    detectedSourceLanguage,
    targetLanguage,
  } = state

  const primaryRecipient = recipients[0]

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`)
      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (error) {
      console.error(error)
    }
  }

  async function sendMessage() {
    if (sending || recipients.length === 0) return
    setSendError(null)
    setSending(true)
    try {
      await sendMessageRequest({
        messageId: state?.messageId,
        messageResultId: state?.messageResultId,
        recipients: recipients.map((item) => ({
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
        originalSubject,
        originalBody,
        attachments: state?.attachments || [],
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
      setShowSuccessModal(true)
    } catch (error) {
      console.error(error)
      const raw = error instanceof Error ? error.message : String(error)
      setSendError(formatSendErrorMessage(raw))
    } finally {
      setSending(false)
    }
  }

  function editOriginalMessage() {
    navigate('/messages', {
      state: {
        recipients,
        recipient: primaryRecipient,
        subject: originalSubject,
        body: originalBody,
        attachments: state?.attachments || [],
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* =================================================
          HEADER
      ================================================= */}
      <PageHeader />

      {/* =================================================
          PAGE
      ================================================= */}

      <div className="grid min-h-[calc(100vh-68px)] grid-cols-[minmax(0,1fr)_375px]">
        {/* =================================================
            MAIN
        ================================================= */}

        <main className="min-w-0 px-8 py-10">
          <div className="mx-auto w-full max-w-225">
            {/* TITLE */}
            <div className="mb-8">
              <h1 className="text-[25px] font-bold text-[#2d282c]">
                AI 최적화 결과
              </h1>

              <p className="mt-2 text-[14px] text-[#88838b]">
                AI가 수신자의 협업 Context를 반영하여 메시지를 최적화했어요.
              </p>
            </div>

            {/* =================================================
                BEFORE / AFTER
            ================================================= */}

            <div className="grid grid-cols-[minmax(0,1fr)_55px_minmax(0,1fr)] items-center gap-3">
              {/* BEFORE */}
              <div className="overflow-hidden rounded-xl border border-[#e1def4] bg-[#f7f5ff]">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-[#e5e1f3] px-5 py-4">
                  <h2 className="text-[14px] font-bold text-[#302d32]">
                    내가 작성한 내용 (Before)
                  </h2>

                  {/* 수정 아이콘
                      별도 수정하기 버튼은 없고
                      기존의 아이콘만 실제로 동작하게 함.
                  */}
                  <button
                    type="button"
                    onClick={editOriginalMessage}
                    aria-label="작성한 메시지 수정"
                    className="rounded-md p-1 text-[#6343dd] transition hover:bg-[#ebe6ff]"
                  >
                    <EditIcon />
                  </button>
                </div>

                {/* CONTENT */}
                <div className="min-h-87.5 px-5 py-6">
                  <p className="mb-5 text-[13px] font-semibold text-[#555]">
                    {originalSubject}
                  </p>

                  <MarkdownViewer content={originalBody} className="text-[14px] leading-8 text-[#454049]" />
                </div>

                {/* FOOTER */}
                <div className="border-t border-[#e5e1f3] px-5 py-3 text-[11px] text-[#aaa5b2]">
                  언어: {detectedSourceLanguage || aiContext?.sourceLanguage || '감지 중'}
                </div>
              </div>

              {/* ARROW */}
              <div className="flex h-10 w-10 items-center justify-center justify-self-center rounded-full bg-[#6339ed] text-white">
                <ArrowIcon />
              </div>

              {/* AFTER */}
              <div className="overflow-hidden rounded-xl border border-[#e1e0e5] bg-white shadow-sm">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-[#eeeeef] px-5 py-4">
                  <h2 className="flex items-center text-[14px] font-bold text-[#302d32]">
                    <span className="mr-2 text-[#5b35ee]">
                      <SparkleIcon />
                    </span>

                    AI가 최적화한 메시지 (After)
                  </h2>

                  <button
                    type="button"
                    onClick={copyMessage}
                    className="flex items-center gap-1.5 rounded-lg border border-[#e0e0e5] px-3 py-2 text-[12px] text-[#666] transition hover:bg-[#f7f7f9]"
                  >
                    <CopyIcon />

                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>

                {/* CONTENT */}
                <div className="min-h-87.5 px-5 py-6">
                  <p className="mb-5 text-[14px] font-semibold text-[#333]">
                    {subject}
                  </p>

                  <MarkdownViewer content={body} className="text-[14px] leading-8 text-[#454049]" />

                  {/* ATTACHMENTS PREVIEW */}
                  {state?.attachments && state.attachments.length > 0 && (
                    <div className="mt-6 border-t border-[#f0f0f5] pt-4">
                      <p className="mb-2 text-[12px] font-semibold text-[#666]">첨부된 파일 ({state.attachments.length}개)</p>
                      <AttachmentPicker attachments={state.attachments} onChange={() => {}} readOnly={true} />
                    </div>
                  )}
                </div>

                {/* FOOTER */}
                <div className="border-t border-[#eeeeef] px-5 py-3 text-[11px] text-[#aaa5b2]">
                  언어: {aiContext?.sourceLanguage || detectedSourceLanguage || '감지 중'} → {aiContext?.targetLanguage || targetLanguage || primaryRecipient?.language || '-'} · 시간:{' '}
                  {primaryRecipient?.timezone || '-'} 기준
                </div>
              </div>
            </div>

            {/* ERROR BANNER */}
            {sendError && (
              <div className="mt-6 flex items-center justify-between rounded-xl border border-[#fed7d7] bg-[#fff5f5] p-4 text-[13px] text-[#c53030]">
                <div className="flex items-center gap-2.5">
                  <svg className="h-5 w-5 shrink-0 text-[#e53e3e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{sendError}</span>
                </div>
                <button
                  type="button"
                  onClick={sendMessage}
                  className="shrink-0 rounded-lg bg-[#e53e3e] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#c53030]"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-[#5531e8] px-7 py-3 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#4926d6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="m4 5 8 7 8-7" />
                </svg>

                {sending ? '전송 중...' : 'Gmail로 전송'}
              </button>
            </div>

            {/* =================================================
                이번 메시지에 반영한 Context

                ★ 기존 디자인 유지
                ★ 디자인 임의 변경 X
            ================================================= */}

            <div className="mt-10">
              <h2 className="mb-4 text-[14px] font-semibold text-[#39343b]">
                이번 메시지에 반영한 Context
              </h2>

              <div className="grid grid-cols-4 gap-3">
                {/* 언어 */}
                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <LanguageContextIcon />

                    <p className="text-[12px] text-[#999]">
                      언어
                    </p>
                  </div>

                  <p className="mt-4 text-[13px] font-semibold">
                    {aiContext?.sourceLanguage || detectedSourceLanguage || '감지 중'} → {aiContext?.targetLanguage || targetLanguage || primaryRecipient?.language || '-'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    수신자가 이해하기 쉬운 언어로 메시지를 작성했어요.
                  </p>
                </div>

                {/* 시간대 */}
                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <TimeContextIcon />

                    <p className="text-[12px] text-[#999]">
                      시간대
                    </p>
                  </div>

                  <p className="mt-4 text-[13px] font-semibold">
                    {primaryRecipient?.timezone || '-'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    수신자의 현지 시간을 고려했어요.
                  </p>
                </div>

                {/* 직무 */}
                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <JobContextIcon />

                    <p className="text-[12px] text-[#999]">
                      직무
                    </p>
                  </div>

                  <p className="mt-4 text-[13px] font-semibold">
                    {primaryRecipient?.position || '-'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    직무에 맞게 필요한 내용을 명확하게 전달했어요.
                  </p>
                </div>

                {/* 조직 관계 */}
                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <RelationshipContextIcon />

                    <p className="text-[12px] text-[#999]">
                      조직 관계
                    </p>
                  </div>

                  <p className="mt-4 text-[13px] font-semibold">
                    {primaryRecipient?.relationship || '-'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    관계에 맞는 표현으로 메시지를 조정했어요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* =================================================
            RIGHT SIDEBAR
            width = 375px
        ================================================= */}

        <aside className="min-h-full border-l border-[#e3e2e7] bg-white px-6 py-8">
          <h2 className="text-[14px] font-bold text-[#302d32]">
            AI 협업 CONTEXT
          </h2>

          {/* 수신자별 컴포넌트 */}
          {recipients.length > 0 ? (
            <div className="mt-5 space-y-5">
              {recipients.map((item) => (
                <RecipientContextCard
                  key={item.id}
                  recipient={item}
                  aiTags={aiContext?.tags || []}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 text-[13px] text-[#999]">
              수신자 정보가 없습니다.
            </div>
          )}

          {/* =================================================
              추가 제안
              ★ 수신자마다 생기지 않음
              ★ 맨 아래 하나만 존재
          ================================================= */}

          <div className="mt-8 rounded-xl bg-[#f2edff] p-5">
            <div className="flex items-center gap-2">
              <SparkleIcon />

              <p className="text-[12px] font-semibold text-[#5b35db]">
                추가 제안
              </p>
            </div>

            <ul className="mt-3 space-y-3 text-[12px] leading-5 text-[#625c6b]">
              <li className="flex gap-2">
                <span className="text-[#6343dd]">•</span>

                <span>
                  요청 범위를 조금 더 구체적으로 작성하면 상대방이 더 정확하게
                  이해할 수 있어요.
                </span>
              </li>

              <li className="flex gap-2">
                <span className="text-[#6343dd]">•</span>

                <span>
                  관련 문서나 API 링크가 있다면 함께 전달하는 것이 좋아요.
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* 전송 완료 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0edff] text-[#5531e8] mb-4">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-[#222]">
              메시지가 성공적으로 전송되었습니다!
            </h3>
            <p className="mt-2 text-[13px] text-[#666] leading-relaxed">
              수신자의 Gmail로 최적화된 메시지가 발송되었으며, 기록함에서 전송 상태를 언제든지 확인할 수 있습니다.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/messages')}
                className="rounded-xl border border-[#dedee3] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#555] transition hover:bg-[#f7f7fa]"
              >
                새 메시지 작성
              </button>
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="rounded-xl bg-[#5531e8] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#4926d6] shadow-sm"
              >
                보낸 기록 보기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
