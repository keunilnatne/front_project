// src/pages/HistoryPage.tsx

import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

type HistoryItem = {
  id: string
  date: string
  recipient: string
  purpose: string
  score: number
  status: string
}

const fallbackHistory: HistoryItem[] = [
  { id: '1', date: '2026.08.22', recipient: '김민수', purpose: '디자인 피드백', score: 92, status: '전송 완료' },
  { id: '2', date: '2026.08.21', recipient: '이서윤', purpose: '주간 보고', score: 88, status: '대기 중' },
  { id: '3', date: '2026.08.21', recipient: '박현우', purpose: '신규 프로젝트 제안서 검토 요청', score: 95, status: '전송 완료' },
  { id: '4', date: '2026.08.20', recipient: '최지우', purpose: '인사고과 면담 일정 조율', score: 72, status: '전송 완료' },
  { id: '5', date: '2026.08.20', recipient: '정재훈', purpose: '기술 스택 선정 회의록 공유', score: 91, status: '전송 완료' },
  { id: '6', date: '2026.08.19', recipient: '강윤지', purpose: '클라이언트 미팅 피드백', score: 85, status: '전송 완료' },
  { id: '7', date: '2026.08.19', recipient: '송도윤', purpose: '인프라 점검 리포트', score: 94, status: '전송 완료' },
  { id: '8', date: '2026.08.18', recipient: '한유리', purpose: '복지 혜택 안내', score: 99, status: '전송 완료' },
]

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>(fallbackHistory)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/history`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setHistory(data)
      })
      .catch(() => {})
  }, [])

  const filtered = history.filter((item) =>
    `${item.recipient} ${item.purpose} ${item.date}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const average =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + item.score, 0) / history.length,
        )
      : 0

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <header className="flex h-[68px] items-center justify-between border-b border-[#e5e5e8] bg-white px-6">
        <div className="flex items-center gap-7">
          <h1 className="text-[24px] font-bold">기록</h1>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-[260px] rounded-lg border border-[#dedde3] px-4 text-[13px] outline-none"
            placeholder="기록 검색..."
          />
        </div>

        <div className="flex gap-6 text-[#555]">
          <span>♧</span>
          <span>?</span>
        </div>
      </header>

      <main className="grid grid-cols-[1fr_320px] gap-6 p-6">
        <section>
          <div className="grid grid-cols-4 gap-3">
            {[
              ['▥', '총 기록 수', history.length, '전체 누적 기록'],
              ['⌁', '평균 적합도', `${average}%`, '전체 평균 점수'],
              ['⌛', '대기 중', history.filter((x) => x.status === '대기 중').length, '검토 대기'],
              ['➤', '이번 주 전송 완료', 6, '전송 성공'],
            ].map(([icon, title, value, sub]) => (
              <div
                key={String(title)}
                className="rounded-lg border border-[#dedee4] bg-white p-5"
              >
                <div className="text-[#6844e2]">{icon}</div>
                <p className="mt-4 text-[12px] text-[#777]">{title}</p>
                <strong className="mt-1 block text-[26px]">{value}</strong>
                <p className="mt-1 text-[11px] text-[#999]">{sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex border-b border-[#dddde3]">
            <button className="border-b-2 border-[#5033df] px-4 pb-4 text-[13px] font-semibold text-[#5033df]">
              전체
            </button>
            <button className="px-4 pb-4 text-[13px] text-[#777]">
              변환 기록
            </button>
            <button className="px-4 pb-4 text-[13px] text-[#777]">
              전송 기록
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-[#dedee5] bg-white">
            <div className="grid grid-cols-[125px_120px_1fr_100px_100px] border-b border-[#dddde2] px-5 py-4 text-[11px] text-[#777]">
              <span>날짜</span>
              <span>수신자</span>
              <span>목적</span>
              <span>적합도 점수</span>
              <span>상태</span>
            </div>

            {filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[125px_120px_1fr_100px_100px] items-center border-b border-[#eeeef0] px-5 py-5 text-[12px] last:border-0"
              >
                <span>{item.date}</span>

                <span className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4dcca] text-[9px]">
                    {item.recipient.slice(0, 1)}
                  </span>
                  {item.recipient}
                </span>

                <span>{item.purpose}</span>

                <span>
                  <span
                    className={`rounded-full px-3 py-1 ${
                      item.score >= 90
                        ? 'bg-[#e1f7ff] text-[#0086bd]'
                        : item.score >= 80
                          ? 'bg-[#fff0d6] text-[#bc6a00]'
                          : 'bg-[#ffe4e5] text-[#df3340]'
                    }`}
                  >
                    {item.score}%
                  </span>
                </span>

                <span>
                  <span
                    className={`rounded px-2 py-1 text-[10px] ${
                      item.status === '대기 중'
                        ? 'bg-[#eee] text-[#888]'
                        : 'bg-[#dcf8e8] text-[#22955c]'
                    }`}
                  >
                    {item.status}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-[12px] text-[#777]">
            총 {history.length}개의 기록 중 1-8 표시 중
          </p>
        </section>

        <aside>
          <div className="rounded-xl border border-[#dedee5] bg-white p-6">
            <h2 className="text-[16px] font-bold">✦ AI Insight Panel</h2>

            <div className="mt-5 rounded-xl border border-[#dedee5] p-5">
              <p className="text-[12px] text-[#6043d9]">주간 분석</p>
              <h3 className="mt-2 text-[17px] font-bold">높은 소통 효율성</h3>
              <p className="mt-3 text-[12px] leading-5 text-[#777]">
                이번 주 평균 적합도 점수가 {average}%로 지난 주 대비 4% 상승했습니다.
                특히 디자인 팀과의 피드백 루프가 매우 효율적입니다.
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-[#dedee5] p-5">
              <h3 className="text-[13px] font-semibold">점수 분포</h3>

              <div className="mt-5">
                <div className="flex justify-between text-[11px]">
                  <span>90% 이상</span>
                  <span>64%</span>
                </div>

                <div className="mt-2 h-2 rounded-full bg-[#e7e7e8]">
                  <div className="h-full w-[64%] rounded-full bg-[#5335dd]" />
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-[11px]">
                  <span>80% - 90%</span>
                  <span>28%</span>
                </div>

                <div className="mt-2 h-2 rounded-full bg-[#e7e7e8]">
                  <div className="h-full w-[28%] rounded-full bg-[#9b8ce8]" />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-[13px]">추천 액션</h3>

              <div className="mt-5 space-y-5 text-[12px] text-[#666]">
                <p>✓ 이서윤 님의 '주간 보고' 검토 대기 중인 항목을 확인하세요.</p>
                <p>♧ 최지우 님과의 면담 기록을 기반으로 DNA를 업데이트하세요.</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}