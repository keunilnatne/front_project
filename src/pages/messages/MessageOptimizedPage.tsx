import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Recipient = {
  id: string
  name: string
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
  subject: string
  body: string

  // 기존 단일 수신자 방식
  recipient?: Recipient

  // 여러 수신자 방식
  recipients?: Recipient[]

  originalSubject: string
  originalBody: string
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

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9.9-1.9 1.3-1.9 2.8" />
      <path d="M12 17h.01" />
    </svg>
  )
}

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
}: {
  recipient: Recipient
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

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded bg-[#f0ebff] px-2 py-1 text-[10px] text-[#6343dd]">
            명확한 표현 선호
          </span>

          <span className="rounded bg-[#f0ebff] px-2 py-1 text-[10px] text-[#6343dd]">
            짧은 단락
          </span>

          <span className="rounded bg-[#f0ebff] px-2 py-1 text-[10px] text-[#6343dd]">
            직접 소통
          </span>
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

  if (!state) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        {/* HEADER */}
        <header className="flex h-17 shrink-0 items-center justify-between border-b border-[#e5e5e8] bg-white px-10">
          <div className="min-w-0 flex-1">
            <div className="relative w-full max-w-111.25">
              <SearchIcon />

              <input
                className="h-11 w-full rounded-lg border border-[#dedee3] bg-white pl-10 pr-3 text-[14px] outline-none"
                placeholder="메시지 또는 팀 멤버 검색"
              />
            </div>
          </div>

          <div className="ml-8 flex shrink-0 items-center gap-6 text-[#555]">
            <button
              type="button"
              aria-label="알림"
              className="transition hover:text-[#4338ca]"
            >
              <BellIcon />
            </button>

            <button
              type="button"
              aria-label="도움말"
              className="transition hover:text-[#4338ca]"
            >
              <HelpIcon />
            </button>
          </div>
        </header>

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
  } = state

  const primaryRecipient = recipients[0]

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(
        `${subject}\n\n${body}`,
      )

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
    setSending(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          subject,
          body,
          originalSubject,
          originalBody,
        }),
      })
      if (!response.ok) throw new Error('메시지 전송에 실패했습니다.')
      window.alert('메시지가 전송되었습니다.')
    } catch (error) {
      console.error(error)
      window.alert('메시지 전송에 실패했습니다. 백엔드 서버 연결을 확인해주세요.')
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
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="flex h-17 shrink-0 items-center justify-between border-b border-[#e5e5e8] bg-white px-10">
        {/* 검색창
            flex-1 + max-width를 사용해서 화면 크기가 달라도
            검색창이 찌그러지지 않도록 함.
        */}
        <div className="min-w-0 flex-1">
          <div className="relative w-full max-w-111.25">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#777]">
              <SearchIcon />
            </div>

            <input
              className="h-11 w-full rounded-lg border border-[#dedee3] bg-white pl-10 pr-3 text-[14px] outline-none transition focus:border-[#cfc7f5] focus:ring-2 focus:ring-[#6343dd]/5"
              placeholder="메시지 또는 팀 멤버 검색"
            />
          </div>
        </div>

        {/* 오른쪽 아이콘 */}
        <div className="ml-8 flex shrink-0 items-center gap-6 text-[#555]">
          <button
            type="button"
            aria-label="알림"
            className="transition hover:text-[#4338ca]"
          >
            <BellIcon />
          </button>

          <button
            type="button"
            aria-label="도움말"
            className="transition hover:text-[#4338ca]"
          >
            <HelpIcon />
          </button>
        </div>
      </header>

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

                  <p className="whitespace-pre-wrap text-[14px] leading-8 text-[#454049]">
                    {originalBody}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="border-t border-[#e5e1f3] px-5 py-3 text-[11px] text-[#aaa5b2]">
                  언어: Korean
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

                  <p className="whitespace-pre-wrap text-[14px] leading-8 text-[#454049]">
                    {body}
                  </p>
                </div>

                {/* FOOTER */}
                <div className="border-t border-[#eeeeef] px-5 py-3 text-[11px] text-[#aaa5b2]">
                  언어: {primaryRecipient?.language || 'Korean'} · 시간:{' '}
                  {primaryRecipient?.timezone || '-'} 기준
                </div>
              </div>
            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={copyMessage}
                className="flex items-center gap-2 rounded-lg border border-[#dddde3] bg-white px-5 py-3 text-[13px] transition hover:bg-[#f7f7f9]"
              >
                <CopyIcon />

                {copied ? '복사됨' : '복사'}
              </button>

              <button
                type="button"
                onClick={sendMessage}
                disabled={sending}
                className="flex items-center gap-2 rounded-lg bg-[#5531e8] px-6 py-3 text-[13px] font-semibold text-white transition hover:bg-[#4926d6] disabled:cursor-not-allowed disabled:opacity-60"
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
                    Korean → {primaryRecipient?.language || 'Korean'}
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
    </div>
  )
}