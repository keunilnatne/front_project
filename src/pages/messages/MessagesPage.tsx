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

const mockRecipients: Recipient[] = [
  {
    id: '1',
    name: '김민수',
    position: 'Product Designer',
    company: 'ABC Company',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'External Partner',
  },
  {
    id: '2',
    name: '이서윤',
    position: 'Marketing Lead',
    company: 'Nova Inc.',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'Partner',
  },
  {
    id: '3',
    name: '박준호',
    position: 'Backend Engineer',
    company: 'ABC Company',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'Internal',
  },
  {
    id: '4',
    name: '최유리',
    position: 'CEO',
    company: 'Studio Bright',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'KST (UTC+9)',
    relationship: 'External Partner',
  },
]

export default function MessagesPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const passedRecipient = location.state?.recipient as Recipient | undefined

  const [recipients, setRecipients] = useState<Recipient[]>(mockRecipients)

  const [recipient, setRecipient] = useState<Recipient | null>(
    passedRecipient || null,
  )

  const [showRecipientList, setShowRecipientList] = useState(false)

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/recipients`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecipients(data)

          if (!passedRecipient) {
            setRecipient(data[0])
          }
        }
      })
      .catch(() => {
        if (!passedRecipient) {
          setRecipient(mockRecipients[0])
        }
      })
  }, [passedRecipient])

  function selectRecipient(item: Recipient) {
    setRecipient(item)
    setShowRecipientList(false)
  }

  async function optimizeMessage() {
    if (!recipient) {
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
      const response = await fetch(`${API_URL}/api/messages/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient,
          subject,
          body,
        }),
      })

      if (!response.ok) {
        throw new Error('AI optimization failed')
      }

      const data = await response.json()

      // 백엔드 연결 성공 시 넘겨받은 optimized 데이터를 사용
      navigate('/messages/optimized', {
        state: {
          recipient,
          subject: data.subject,
          body: data.body,
          originalSubject: subject,
          originalBody: body,
        },
      })
    } catch (error) {
      console.error(error)
      // 백엔드가 연결되어 있지 않거나 에러 발생 시 테스트용 목업 처리
      // API 연결 성공 시 alert만 남기거나 아래 fallback 라우팅을 제거하시면 됩니다.
      navigate('/messages/optimized', {
        state: {
          recipient,
          subject: `[최적화됨] ${subject}`,
          body: `안녕하세요 ${recipient.name}님,\n\n${body}\n\n감사합니다.`,
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
      <header className="flex h-[68px] items-center justify-between border-b border-[#e5e5e8] bg-white px-10">
        <div className="relative w-[445px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#777"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <input
            className="h-11 w-full rounded-lg border border-[#dedee3] pl-10 text-[14px] outline-none"
            placeholder="메시지 또는 팀 멤버 검색"
          />
        </div>

        <div className="flex gap-6 text-[#555]">
          <span>♧</span>
          <span>?</span>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_375px]">
        {/* MAIN */}
        <main className="px-8 py-10">
          <div className="mx-auto max-w-[700px]">
            <div className="mb-10 flex items-center justify-between">
              <h1 className="text-[25px] font-bold text-[#2d282c]">
                새 메시지 작성
              </h1>

              <button className="rounded-lg border border-[#dddde3] bg-white px-4 py-3 text-[13px]">
                ✉ 임시 저장
              </button>
            </div>

            {/* RECIPIENT */}
            <div className="relative mb-5 flex items-center">
              <span className="w-[115px] text-[13px] text-[#5e5960]">
                받는 사람
              </span>

              {recipient ? (
                <div className="flex h-10 items-center rounded-lg border border-[#ddd5ff] bg-[#f4f1ff] px-3 text-[13px]">
                  <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#c8c8c8] text-[9px]">
                    {recipient.name.slice(0, 1)}
                  </div>

                  {recipient.name} · {recipient.position} · {recipient.company}

                  <button
                    onClick={() => setRecipient(null)}
                    className="ml-3 text-[#777]"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="text-[13px] text-[#999]">
                  수신자를 선택해주세요.
                </div>
              )}

              {/* + 버튼 */}
              <button
                onClick={() => setShowRecipientList(!showRecipientList)}
                className="ml-3 text-[25px] leading-none text-[#555]"
              >
                ⊕
              </button>

              {/* 수신자 목데이터 목록 */}
              {showRecipientList && (
                <div className="absolute left-[115px] top-[48px] z-50 w-[340px] overflow-hidden rounded-xl border border-[#dedde4] bg-white shadow-lg">
                  <div className="border-b border-[#eeeeef] px-4 py-3">
                    <p className="text-[12px] font-semibold">수신자 선택</p>
                  </div>

                  {recipients.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectRecipient(item)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f7f5ff]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ddd] text-[12px]">
                        {item.name.slice(0, 1)}
                      </div>

                      <div>
                        <p className="text-[13px] font-semibold">{item.name}</p>

                        <p className="text-[11px] text-[#888]">
                          {item.position} · {item.company}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MESSAGE FORM */}
            <div className="overflow-hidden rounded-xl border border-[#e1e0e5] bg-white">
              <div className="flex border-b border-[#eeeeef]">
                <span className="w-[90px] px-6 py-5 text-[13px] text-[#777]">
                  제목
                </span>

                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 px-3 py-5 text-[15px] font-semibold outline-none"
                  placeholder="제목을 입력하세요"
                />
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="h-[280px] w-full resize-none px-6 py-6 text-[15px] leading-10 text-[#454049] outline-none"
                placeholder="메시지를 입력하세요"
              />

              <div className="border-t border-[#eeeeef] px-5 py-3 text-[12px] text-[#a2a0a7]">
                ◷ 수신자 현지 시간을 기준으로 메시지를 확인할 수 있습니다.
              </div>

              <div className="flex items-center justify-between border-t border-[#eeeeef] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-[20px]">📎</span>

                  <span className="rounded bg-[#ffe5e8] px-2 py-1 text-[11px] text-[#9e4653]">
                    PRIORITY HIGH
                  </span>
                </div>

                <button
                  onClick={optimizeMessage}
                  disabled={loading}
                  className="rounded-lg bg-[#4f2ee0] px-6 py-4 text-[14px] font-semibold text-white disabled:opacity-60"
                >
                  ✨ {loading ? '최적화 중...' : 'AI로 최적화하기'}
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT CONTEXT */}
        <aside className="border-l border-[#e3e2e7] bg-white px-6 py-8">
          <h2 className="text-[14px] font-bold text-[#302d32]">
            AI 협업 CONTEXT
          </h2>

          {recipient ? (
            <>
              <div className="mt-5 flex items-center gap-3 border-b border-[#eeeef0] pb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ddd] text-[12px]">
                  {recipient.name.slice(0, 2)}
                </div>

                <div>
                  <p className="font-semibold">{recipient.name}</p>

                  <p className="text-[12px] text-[#999]">
                    {recipient.company}
                  </p>
                </div>
              </div>

              <div className="space-y-5 pt-6 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#999]">언어</span>
                  <span>{recipient.language}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#999]">시간대</span>
                  <span>{recipient.timezone}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#999]">직무</span>
                  <span>{recipient.position}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#999]">조직 관계</span>
                  <span>{recipient.relationship}</span>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-[12px] text-[#999]">커뮤니케이션 스타일</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded bg-[#f0ebff] px-2 py-1 text-[11px] text-[#6343dd]">
                    명확한 표현 선호
                  </span>

                  <span className="rounded bg-[#f0ebff] px-2 py-1 text-[11px] text-[#6343dd]">
                    짧은 단락
                  </span>

                  <span className="rounded bg-[#f0ebff] px-2 py-1 text-[11px] text-[#6343dd]">
                    직접 소통
                  </span>
                </div>
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
  )
}