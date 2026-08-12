// src/pages/CompanyDnaPage.tsx

import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

type CompanyDNA = {
  decisionStructure: string
  channels: string
  reporting: string
  terms: { from: string; to: string }[]
  rules: {
    title: string
    description: string
  }[]
  accuracy: number
}

const defaultDNA: CompanyDNA = {
  decisionStructure: '수평적 자율성 기반',
  channels: 'Slack & Notion',
  reporting: '상시 공유 (Always Sync)',
  terms: [
    { from: '검토 요청', to: '피드백 요청' },
    { from: '부장님/차장님', to: "'님' 호칭" },
    { from: '신속하게', to: '우선순위 높음' },
    { from: 'ASAP', to: '~까지 확인' },
  ],
  rules: [
    {
      title: '이메일 형식',
      description: '제목 앞머리에 [말머리] 필수 사용. 본문은 핵심 위주로 3문장 이내 요약 선호.',
    },
    {
      title: '공지 사항',
      description: '전체 공지 시 @channel 사용 지양. 긴급도가 낮은 경우 스레드 활용 권장.',
    },
    {
      title: '보고 스타일',
      description: '성과(Outcome) 중심 보고. 문제 발생 시 해결 방안과 함께 보고하는 Solution First 문화.',
    },
  ],
  accuracy: 92,
}

export default function CompanyDnaPage() {
  const [dna, setDNA] = useState<CompanyDNA>(defaultDNA)
  const [aiEnabled, setAIEnabled] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/company-dna`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => setDNA({ ...defaultDNA, ...data }))
      .catch(() => {})
  }, [])

  async function saveDNA() {
    await fetch(`${API_URL}/api/company-dna`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dna),
    }).catch(() => {})
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

      <main className="px-8 py-8">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="text-[27px] font-bold text-[#2b282b]">
              기업 커뮤니케이션 정보
            </h1>
            <p className="mt-2 text-[13px] text-[#77737b]">
              ABC 컴퍼니의 조직 문화와 언어 습관을 AI가 학습하여,
              모든 메시지 생성 시 일관된 목소리를 유지하도록 돕습니다.
            </p>
          </div>

          <button className="rounded-lg bg-[#5031dd] px-5 py-4 text-[13px] font-semibold text-white">
            ＋ 새로운 DNA 규칙 추가
          </button>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-5">
          <section className="rounded-xl border border-[#dedee5] bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[16px] font-bold">▦ 조직 정보 (Org Info)</h2>

              <button
                onClick={() => setAIEnabled(!aiEnabled)}
                className={`h-7 w-12 rounded-full p-1 ${
                  aiEnabled ? 'bg-[#5335df]' : 'bg-[#ccc]'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition ${
                    aiEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                ['의사결정 구조', dna.decisionStructure],
                ['주요 채널', dna.channels],
                ['보고 체계', dna.reporting],
              ].map(([title, value]) => (
                <div
                  key={title}
                  className="rounded-lg border border-[#dddce2] p-5"
                >
                  <p className="text-[13px] text-[#777]">{title}</p>
                  <p className="mt-2 font-semibold">{value}</p>
                  <p className="mt-3 text-[12px] leading-5 text-[#85818a]">
                    결론 중심의 빠른 피드백 문화를 지향하며, 직급 전문성을 존중합니다.
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 h-[145px] overflow-hidden rounded-lg bg-[#ddd]">
              <div className="flex h-full items-center justify-center bg-gradient-to-r from-[#d8d7d2] to-[#eeeae1] text-[22px] font-semibold text-[#817b72]">
                Company DNA
              </div>
            </div>
          </section>

          <aside className="rounded-xl border border-[#e8cbbd] bg-white p-7 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[9px] border-[#6041e4]">
              <span className="text-[26px] font-bold">{dna.accuracy}%</span>
            </div>

            <p className="mt-6 font-semibold">AI 최적화 상태</p>

            <p className="mt-4 text-[12px] leading-5 text-[#777]">
              작성된 규칙들이 AI의 메시지 생성 알고리즘에 매우 높은 정확도로 반영되고 있습니다.
            </p>

            <button className="mt-7 text-[13px] font-semibold text-[#5b3ce0]">
              분석 리포트 보기 →
            </button>
          </aside>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-5">
          <section className="rounded-xl border border-[#dedee5] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold">A 자주 사용하는 용어 (Terms)</h2>
              <span className="text-[12px] text-[#777]">AI 학습 완료 ●</span>
            </div>

            <div className="mt-5 space-y-2">
              {dna.terms.map((term) => (
                <div
                  key={term.from}
                  className="flex items-center rounded-lg border border-[#eeeef1] px-4 py-3 text-[13px]"
                >
                  <span className="w-[120px] text-[#999]">{term.from}</span>
                  <span>→</span>
                  <strong className="ml-4 text-[#5a3de1]">{term.to}</strong>
                  <span className="ml-auto rounded bg-[#f1edff] px-2 py-1 text-[10px] text-[#6744df]">
                    권장
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-dashed border-[#b5a9dc] bg-[#f5f1ff] p-4 text-[12px] leading-5 text-[#6e6877]">
              사내에서는 '검토 요청'보다 '피드백 요청'이라는 표현을 선호합니다.
              AI는 이 규칙을 바탕으로 정중하면서도 협력적인 톤앤매너를 제안합니다.
            </div>
          </section>

          <section className="rounded-xl border border-[#dedee5] bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-bold">⚖ 커뮤니케이션 규칙</h2>
              <span className="text-[12px] text-[#777]">규칙 12개 적용 중</span>
            </div>

            <div className="mt-5 space-y-4">
              {dna.rules.map((rule) => (
                <div
                  key={rule.title}
                  className="rounded-lg border border-[#cfc5f7] p-4"
                >
                  <p className="font-semibold text-[#3f3a42]">
                    {rule.title}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[#77737a]">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <span className="rounded bg-[#f2efff] px-2 py-1 text-[10px]">
                TONE: PROFESSIONAL
              </span>
              <span className="rounded bg-[#f2efff] px-2 py-1 text-[10px]">
                STYLE: CONCISE
              </span>
              <span className="rounded bg-[#f2efff] px-2 py-1 text-[10px]">
                EMOJI: CONSERVATIVE
              </span>
            </div>
          </section>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e3d6ca] bg-white px-7 py-5">
          <div>
            <p className="font-semibold text-[#5137d7]">🤖 AI 메시지 가이드 작동 중</p>
            <p className="mt-1 text-[12px] text-[#777]">
              위 모든 설정값들이 실시간으로 학습되어, 임직원들이 메시지를 작성할 때
              하단에 자동 제안됩니다.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveDNA}
              className="rounded-lg border border-[#6246df] bg-white px-5 py-3 text-[12px] text-[#5438d9]"
            >
              설정 저장
            </button>

            <button className="rounded-lg bg-[#5335df] px-5 py-3 text-[12px] font-semibold text-white">
              실시간 시뮬레이션
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}