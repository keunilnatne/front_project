import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

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

type MessagePageState = {
  recipients?: Recipient[]
  recipient?: Recipient
  subject?: string
  body?: string
}

const mockRecipients: Recipient[] = [
  {
    id: '1',
    name: 'Aditya Putra',
    position: 'Backend Developer',
    company: 'PT. Maju Digital',
    country: 'Indonesia',
    language: 'English',
    timezone: 'WIB (UTC+7)',
    relationship: 'External Partner',
  },
  {
    id: '2',
    name: '김민수',
    position: 'Product Designer',
    company: 'ABC Company',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'External Partner',
  },
  {
    id: '3',
    name: '이서윤',
    position: 'Marketing Lead',
    company: 'Nova Inc.',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'Partner',
  },
  {
    id: '4',
    name: '박준호',
    position: 'Backend Engineer',
    company: 'ABC Company',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'Internal',
  },
  {
    id: '5',
    name: '최유리',
    position: 'CEO',
    company: 'Studio Bright',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'External Partner',
  },
]

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
      width="18"
      height="18"
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
      width="18"
      height="18"
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

/* -------------------------------------------------------
 * 수신자 Context 컴포넌트
 * 사진에서 보이는 1명 단위
 * ----------------------------------------------------- */

function RecipientContextCard({
  recipient,
}: {
  recipient: Recipient
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

          <span className="max-w-[180px] text-right font-medium text-[#29292d]">
            {recipient.position || '-'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-[#999]">조직 관계</span>

          <span className="max-w-[180px] text-right font-medium text-[#29292d]">
            {recipient.relationship || '-'}
          </span>
        </div>
      </div>

      {/* 커뮤니케이션 스타일 */}
      <div className="mt-5">
        <p className="text-[10px] text-[#999]">
          커뮤니케이션 스타일
        </p>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded bg-[#f0ebff] px-2 py-1 text-[9px] text-[#6343dd]">
            명확한 표현 선호
          </span>

          <span className="rounded bg-[#f0ebff] px-2 py-1 text-[9px] text-[#6343dd]">
            짧은 단락
          </span>

          <span className="rounded bg-[#f0ebff] px-2 py-1 text-[9px] text-[#6343dd]">
            직접 소통
          </span>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------
 * Messages Page
 * ----------------------------------------------------- */

export default function MessagesPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const pageState = location.state as MessagePageState | null

  const [recipients, setRecipients] =
    useState<Recipient[]>(mockRecipients)

  // 처음에는 비어있음
  const [selectedRecipients, setSelectedRecipients] =
    useState<Recipient[]>([])

  const [showRecipientList, setShowRecipientList] =
    useState(false)

  const [subject, setSubject] =
    useState(pageState?.subject || '')

  const [body, setBody] =
    useState(pageState?.body || '')

  const [loading, setLoading] = useState(false)

  const [draftSaved, setDraftSaved] = useState(false)

  /* 수정하기로 돌아온 경우 기존 데이터 유지 */
  useEffect(() => {
    if (pageState?.recipients?.length) {
      setSelectedRecipients(pageState.recipients)
    } else if (pageState?.recipient) {
      setSelectedRecipients([pageState.recipient])
    }

    if (typeof pageState?.subject === 'string') {
      setSubject(pageState.subject)
    }

    if (typeof pageState?.body === 'string') {
      setBody(pageState.body)
    }
  }, [pageState])

  /* 수신자 목록 */
  useEffect(() => {
    fetch(`${API_URL}/api/recipients`)
      .then((res) => {
        if (!res.ok) {
          throw new Error()
        }

        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecipients(data)
        }
      })
      .catch(() => {
        setRecipients(mockRecipients)
      })
  }, [])

  function toggleRecipient(item: Recipient) {
    setSelectedRecipients((current) => {
      const exists = current.some(
        (recipient) => recipient.id === item.id,
      )

      if (exists) {
        return current.filter(
          (recipient) => recipient.id !== item.id,
        )
      }

      return [...current, item]
    })
  }

  function removeRecipient(id: string) {
    setSelectedRecipients((current) =>
      current.filter((recipient) => recipient.id !== id),
    )
  }

  /* 임시 저장 */
  function saveDraft() {
    const drafts = JSON.parse(
      localStorage.getItem('message-drafts') || '[]',
    )

    const newDraft = {
      id: Date.now().toString(),
      recipients: selectedRecipients,
      subject,
      body,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(
      'message-drafts',
      JSON.stringify([newDraft, ...drafts]),
    )

    setDraftSaved(true)

    window.setTimeout(() => {
      setDraftSaved(false)
    }, 1800)
  }

  /* AI 최적화 */
  async function optimizeMessage() {
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
      const response = await fetch(
        `${API_URL}/api/messages/optimize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipients: selectedRecipients,
            subject,
            body,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('AI optimization failed')
      }

      const data = await response.json()

      navigate('/messages/optimized', {
        state: {
          recipients: selectedRecipients,
          subject: data.subject,
          body: data.body,
          originalSubject: subject,
          originalBody: body,
        },
      })
    } catch (error) {
      console.error(error)

      /*
       * 백엔드 연결 전 테스트용.
       * 절대로 [최적화됨] 같은 가짜 문구를 붙이지 않음.
       */
      navigate('/messages/optimized', {
        state: {
          recipients: selectedRecipients,
          subject,
          body,
          originalSubject: subject,
          originalBody: body,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* HEADER */}
      <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-[#e5e5e8] bg-white px-10">
        <div className="relative w-[445px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]">
            <SearchIcon />
          </div>

          <input
            className="h-11 w-full rounded-lg border border-[#dedee3] bg-white pl-10 text-[14px] outline-none"
            placeholder="메시지 또는 팀 멤버 검색"
          />
        </div>

        <div className="flex items-center gap-6 text-[#555]">
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

      {/* PAGE */}
      <div className="min-h-[calc(100vh-68px)]">
        <div className="grid min-h-[calc(100vh-68px)] grid-cols-[minmax(0,1fr)_375px]">
          {/* MAIN */}
          <main className="min-w-0 px-8 py-10">
            <div className="mx-auto w-full max-w-[900px]">
              {/* TITLE */}
              <div className="mb-10 flex items-center justify-between">
                <h1 className="text-[25px] font-bold text-[#2d282c]">
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
              <div className="relative mb-5 flex items-center">
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
                  <div className="absolute left-[115px] top-[48px] z-50 w-[360px] overflow-hidden rounded-xl border border-[#dedde4] bg-white shadow-lg">
                    <div className="border-b border-[#eeeeef] px-4 py-3">
                      <p className="text-[12px] font-semibold">
                        수신자 선택
                      </p>

                      <p className="mt-1 text-[10px] text-[#999]">
                        여러 명을 선택할 수 있습니다.
                      </p>
                    </div>

                    {recipients.map((item) => {
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

              {/* MESSAGE FORM */}
              <div className="overflow-hidden rounded-xl border border-[#e1e0e5] bg-white">
                {/* SUBJECT */}
                <div className="flex border-b border-[#eeeeef]">
                  <span className="w-[90px] shrink-0 px-6 py-5 text-[13px] text-[#777]">
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
                  className="h-[280px] w-full resize-none px-6 py-6 text-[15px] leading-10 text-[#454049] outline-none"
                  placeholder="메시지를 입력하세요"
                />

                {/* TIME INFO */}
                <div className="flex items-center gap-2 border-t border-[#eeeeef] px-5 py-3 text-[12px] text-[#a2a0a7]">
                  <ClockIcon />

                  수신자 현지 시간을 기준으로 메시지를 확인할 수 있습니다.
                </div>

                {/* BOTTOM */}
                <div className="flex items-center justify-between border-t border-[#eeeeef] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="파일 첨부"
                      className="text-[#777] transition hover:text-[#4338ca]"
                    >
                      <PaperclipIcon />
                    </button>

                    <span className="rounded bg-[#ffe5e8] px-2 py-1 text-[11px] text-[#9e4653]">
                      PRIORITY HIGH
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={optimizeMessage}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-[#4f2ee0] px-6 py-4 text-[14px] font-semibold text-white transition hover:bg-[#4525d0] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <SparkleIcon />

                    {loading
                      ? '최적화 중...'
                      : 'AI로 최적화하기'}
                  </button>
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
                    여러 수신자의 언어, 시간대, 직무와 조직 관계를
                    고려하여 모든 수신자가 이해하기 쉬운 방식으로
                    메시지를 작성해보세요.
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#8a8494]">
                    AI 최적화를 실행하면 수신자별 Context를 반영한
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