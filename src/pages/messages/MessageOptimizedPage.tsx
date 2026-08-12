import { useLocation, useNavigate } from 'react-router-dom'

type Recipient = {
  id: string
  name: string
  position: string
  company: string
  language: string
  timezone: string
  relationship: string
}

type OptimizedState = {
  subject: string
  body: string
  recipient: Recipient
  originalSubject: string
  originalBody: string
}

export default function MessageOptimizedPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as OptimizedState | null

  // 직접 URL로 들어왔을 때
  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc]">
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
    )
  }

  const { subject, body, recipient, originalSubject, originalBody } = state

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* 상단 */}
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
            className="h-11 w-full rounded-lg border border-[#dedee3] bg-white pl-10 text-[14px] outline-none"
            placeholder="메시지 또는 팀 멤버 검색"
          />
        </div>

        <div className="flex gap-6 text-[#555]">
          <span>♧</span>
          <span>?</span>
        </div>
      </header>

      <div className="grid grid-cols-[1fr_375px]">
        {/* 왼쪽 */}
        <main className="px-8 py-10">
          <div className="mx-auto max-w-[750px]">
            {/* 제목 */}
            <div className="mb-8">
              <h1 className="text-[25px] font-bold text-[#2d282c]">
                AI 최적화 결과
              </h1>

              <p className="mt-2 text-[14px] text-[#88838b]">
                AI가 수신자의 협업 Context를 반영하여 메시지를 최적화했어요.
              </p>
            </div>

            {/* Before / After */}
            <div className="grid grid-cols-[1fr_55px_1fr] items-center gap-3">
              {/* Before */}
              <div className="overflow-hidden rounded-xl border border-[#e1def4] bg-[#f7f5ff]">
                <div className="flex items-center justify-between border-b border-[#e5e1f3] px-5 py-4">
                  <h2 className="text-[14px] font-bold text-[#302d32]">
                    내가 작성한 내용 (Before)
                  </h2>

                  <span className="text-[15px] text-[#6343dd]">✎</span>
                </div>

                <div className="min-h-[350px] px-5 py-6">
                  <p className="mb-5 text-[13px] font-semibold text-[#555]">
                    {originalSubject}
                  </p>

                  <p className="whitespace-pre-wrap text-[14px] leading-8 text-[#454049]">
                    {originalBody}
                  </p>
                </div>

                <div className="border-t border-[#e5e1f3] px-5 py-3 text-[11px] text-[#aaa5b2]">
                  언어: 한국어
                </div>
              </div>

              {/* 화살표 */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6339ed] text-[24px] text-white">
                →
              </div>

              {/* After */}
              <div className="overflow-hidden rounded-xl border border-[#e1e0e5] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#eeeeef] px-5 py-4">
                  <h2 className="text-[14px] font-bold text-[#302d32]">
                    <span className="mr-2 text-[#5b35ee]">★</span>
                    AI가 최적화한 메시지 (After)
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${subject}\n\n${body}`,
                      )
                    }}
                    className="rounded-lg border border-[#e0e0e5] px-3 py-2 text-[12px] text-[#666]"
                  >
                    □ 복사
                  </button>
                </div>

                <div className="min-h-[350px] px-5 py-6">
                  <p className="mb-5 text-[14px] font-semibold text-[#333]">
                    {subject}
                  </p>

                  <p className="whitespace-pre-wrap text-[14px] leading-8 text-[#454049]">
                    {body}
                  </p>
                </div>

                <div className="border-t border-[#eeeeef] px-5 py-3 text-[11px] text-[#aaa5b2]">
                  언어: {recipient.language || 'English'} · 시간:{' '}
                  {recipient.timezone || '-'} 기준
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`${subject}\n\n${body}`)
                }}
                className="rounded-lg border border-[#dddde3] bg-white px-5 py-3 text-[13px]"
              >
                □ 복사
              </button>

              <button
                type="button"
                className="rounded-lg bg-[#5531e8] px-6 py-3 text-[13px] font-semibold text-white"
              >
                ✉ Gmail로 전송
              </button>
            </div>

            {/* Context */}
            <div className="mt-10">
              <h2 className="mb-4 text-[14px] font-semibold text-[#39343b]">
                이번 메시지에 반영한 Context
              </h2>

              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <p className="text-[12px] text-[#999]">언어</p>

                  <p className="mt-4 text-[13px] font-semibold">
                    Korean → {recipient.language || 'English'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    수신자가 이해하기 쉬운 언어로 메시지를 작성했어요.
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <p className="text-[12px] text-[#999]">시간대</p>

                  <p className="mt-4 text-[13px] font-semibold">
                    {recipient.timezone || '-'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    수신자의 현지 시간을 고려했어요.
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <p className="text-[12px] text-[#999]">직무</p>

                  <p className="mt-4 text-[13px] font-semibold">
                    {recipient.position || '-'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    직무에 맞게 필요한 내용을 명확하게 전달했어요.
                  </p>
                </div>

                <div className="rounded-xl border border-[#e4e3e8] bg-white p-4">
                  <p className="text-[12px] text-[#999]">조직 관계</p>

                  <p className="mt-4 text-[13px] font-semibold">
                    {recipient.relationship || '-'}
                  </p>

                  <p className="mt-2 text-[11px] leading-5 text-[#999]">
                    관계에 맞는 표현으로 메시지를 조정했어요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* 오른쪽 */}
        <aside className="border-l border-[#e3e2e7] bg-white px-6 py-8">
          <h2 className="text-[14px] font-bold text-[#302d32]">
            AI 협업 CONTEXT
          </h2>

          <div className="mt-5 flex items-center gap-3 border-b border-[#eeeef0] pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ddd] text-[12px] font-semibold">
              {recipient.name
                ? recipient.name
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .slice(0, 2)
                : '?'}
            </div>

            <div>
              <p className="font-semibold">
                {recipient.name || '수신자'}
              </p>

              <p className="text-[12px] text-[#999]">
                {recipient.company || '-'}
              </p>
            </div>
          </div>

          <div className="space-y-5 pt-6 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#999]">국가</span>
              <span>Indonesia</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#999]">언어</span>
              <span>{recipient.language || '-'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#999]">시간대</span>
              <span>{recipient.timezone || '-'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#999]">직무</span>
              <span>{recipient.position || '-'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#999]">조직 관계</span>
              <span>{recipient.relationship || '-'}</span>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-[#f2edff] p-5">
            <p className="text-[12px] font-semibold text-[#5b35db]">
              추가 제안
            </p>

            <ul className="mt-3 space-y-3 text-[12px] leading-5 text-[#625c6b]">
              <li>
                • 요청 범위를 조금 더 구체적으로 작성하면 상대방이 더
                정확하게 이해할 수 있어요.
              </li>

              <li>
                • 관련 문서나 API 링크가 있다면 함께 전달하는 것이 좋아요.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}