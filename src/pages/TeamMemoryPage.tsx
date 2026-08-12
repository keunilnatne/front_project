// src/pages/TeamMemoryPage.tsx

import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

type Pattern = {
  id: string
  title: string
  purpose: string
  reason: string
  request: string
  deadline: string
}

const defaultPatterns: Pattern[] = [
  {
    id: '1',
    title: '디자인 피드백 요청',
    purpose: '신규 UI 컴포넌트의 시각적 일관성 검토 및 브랜드 가이드 준수 확인',
    reason: '사용자 데이터 밀도 최적화를 위해 기존 카드 시스템의 패딩 값을 24px에서 16px로 축소함',
    request: '가독성 저하 여부 확인\n모바일 해상도 대응 확인',
    deadline: '2024-11-20 (수) 15:00까지',
  },
  {
    id: '2',
    title: '주간 보고 템플릿',
    purpose: '팀 내 성과 지표와 이슈 및 계획을 요약하는 정형화된 보고 체계',
    reason: '',
    request: '',
    deadline: '',
  },
  {
    id: '3',
    title: 'QA 버그 리포트',
    purpose: '재현 경로와 스크린샷 링크를 포함한 기술적 이슈 보고 형식',
    reason: '',
    request: '',
    deadline: '',
  },
]

export default function TeamMemoryPage() {
  const [patterns, setPatterns] = useState<Pattern[]>(defaultPatterns)
  const [selected, setSelected] = useState(defaultPatterns[0])
  const [tab, setTab] = useState<'saved' | 'candidates'>('saved')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/team-memory`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setPatterns(data)
          setSelected(data[0])
        }
      })
      .catch(() => {})
  }, [])

  async function savePattern() {
    setLoading(true)

    await fetch(`${API_URL}/api/team-memory/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selected),
    }).catch(() => {})

    setPatterns((current) =>
      current.map((item) => (item.id === selected.id ? selected : item)),
    )

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <header className="flex h-[68px] items-center justify-between border-b border-[#e5e5e8] bg-white px-10">
        <input
          className="h-11 w-[445px] rounded-lg border border-[#dedee3] px-4 text-[14px] outline-none"
          placeholder="메시지 또는 팀 멤버 검색"
        />

        <div className="flex gap-6 text-[#555]">
          <span>♧</span>
          <span>?</span>
        </div>
      </header>

      <main className="px-8 py-10">
        <div className="flex items-center justify-between border-b border-[#dddce4]">
          <div className="flex gap-8">
            <button
              onClick={() => setTab('saved')}
              className={`border-b-2 px-2 pb-5 text-[14px] ${
                tab === 'saved'
                  ? 'border-[#5134df] text-[#5134df]'
                  : 'border-transparent text-[#777]'
              }`}
            >
              저장된 패턴
            </button>

            <button
              onClick={() => setTab('candidates')}
              className={`px-2 pb-5 text-[14px] ${
                tab === 'candidates'
                  ? 'border-b-2 border-[#5134df] text-[#5134df]'
                  : 'text-[#777]'
              }`}
            >
              학습 후보 <span className="rounded-full bg-[#5536dd] px-1.5 py-0.5 text-[10px] text-white">3</span>
            </button>
          </div>

          <button className="mb-3 rounded-lg bg-[#5234dc] px-5 py-3 text-[13px] font-semibold text-white">
            ＋ 패턴 추가
          </button>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_300px] gap-5">
          <section>
            <div className="mb-5 flex gap-2">
              <button className="rounded border border-[#bdb2ee] bg-[#f4f1ff] px-3 py-2 text-[12px] text-[#5c40d6]">
                읽지 않은 항목
              </button>

              <button className="rounded border border-[#d9d8dd] bg-white px-3 py-2 text-[12px]">
                ☰ 정렬
              </button>
            </div>

            {patterns.map((pattern, index) => (
              <button
                key={pattern.id}
                onClick={() => setSelected(pattern)}
                className={`mb-5 block w-full rounded-xl border bg-white text-left ${
                  selected.id === pattern.id
                    ? 'border-[#ddd9e8]'
                    : 'border-[#dedee5]'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[20px] text-[#5b3de1]">▣</span>
                    <div>
                      <h2 className="text-[18px] font-bold">{pattern.title}</h2>
                      <p className="text-[11px] text-[#888]">
                        마지막 업데이트 · {index === 0 ? '2시간 전' : '1일 전'}
                      </p>
                    </div>
                  </div>

                  {index === 0 ? (
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-[#dddce2] p-5">
                        <p className="text-[11px] text-[#6546dc]">목적</p>
                        <p className="mt-2 text-[13px] leading-5">
                          {pattern.purpose}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#dddce2] p-5">
                        <p className="text-[11px] text-[#6546dc]">첨부파일</p>
                        <p className="mt-3 text-[13px] text-[#aaa]">↑ 파일 업로드</p>
                      </div>

                      <div className="col-span-2 rounded-lg border border-[#dddce2] p-5">
                        <p className="text-[11px] text-[#6546dc]">변경 이유</p>
                        <p className="mt-2 text-[13px]">{pattern.reason}</p>
                      </div>

                      <div className="rounded-lg border border-[#dddce2] p-5">
                        <p className="text-[11px] text-[#6546dc]">요청사항</p>
                        <p className="mt-2 whitespace-pre-line text-[13px] leading-6">
                          {pattern.request}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#dddce2] p-5">
                        <p className="text-[11px] text-[#6546dc]">마감</p>
                        <p className="mt-2 text-[13px] text-[#e24b55]">
                          {pattern.deadline}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-5 text-[13px] text-[#777]">
                      {pattern.purpose}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </section>

          <aside className="h-fit rounded-xl border border-[#dedee5] bg-white p-6">
            <h2 className="text-[16px] font-bold">✦ AI 학습 후보</h2>

            <div className="mt-5 rounded-xl border border-[#dedee5] p-5">
              <p className="text-[12px]">
                "최근 5회 협업에서
                <span className="bg-[#cdeeff] px-1">동일한 표현</span>이 반복되었습니다."
              </p>

              <div className="mt-4 rounded bg-[#f0edff] p-3 text-[12px] text-[#666]">
                "문건에 대해 데이터 정합성 확인 부탁드립니다."
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px]">신뢰도 94%</span>

                <div className="flex gap-2">
                  <button className="rounded-full bg-[#e4e4e4] px-4 py-2 text-[11px]">
                    무시
                  </button>
                  <button className="rounded-full bg-[#5435df] px-4 py-2 text-[11px] text-white">
                    저장
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#f0edff] p-5">
              <div className="flex justify-between">
                <div>
                  <p className="text-[11px] text-[#777]">학습 완료 패턴</p>
                  <strong className="text-[22px] text-[#5136db]">124개</strong>
                </div>

                <div className="text-right">
                  <p className="text-[11px] text-[#777]">성장률</p>
                  <strong className="text-[22px] text-[#17945b]">+12%</strong>
                </div>
              </div>
            </div>

            <button className="mt-5 w-full rounded-lg border border-[#dfbda8] py-3 text-[12px]">
              학습 로그 보기
            </button>
          </aside>
        </div>
      </main>
    </div>
  )
}