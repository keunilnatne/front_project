import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''

type Recipient = {
  id: string
  name: string
  position: string
  company: string
  country: string
  language: string
  timezone: string
  relationship: string
  responseTime: number
  speed: string
  collaboration: string
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
    responseTime: 14,
    speed: 'Fast',
    collaboration: 'High',
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
    responseTime: 28,
    speed: 'Normal',
    collaboration: 'Medium',
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
    responseTime: 45,
    speed: 'Slow',
    collaboration: 'Medium',
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
    responseTime: 11,
    speed: 'Fast',
    collaboration: 'High',
  },
]

export default function RecipientsPage() {
  const navigate = useNavigate()

  const [recipients, setRecipients] = useState<Recipient[]>(mockRecipients)
  const [selected, setSelected] = useState<Recipient>(mockRecipients[0])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/recipients`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecipients(data)
          setSelected(data[0])
        }
      })
      .catch(() => {
        // 백엔드가 없거나 실패하면 목데이터 사용
      })
  }, [])

  const filteredRecipients = recipients.filter((item) =>
    `${item.name} ${item.company} ${item.position}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  function sendMessage() {
    navigate('/messages', {
      state: {
        recipient: selected,
      },
    })
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#29262b]">
      {/* HEADER */}
      <header className="h-[62px] border-b border-[#e5e5e8] bg-white">
        <div className="flex h-full items-center justify-between px-[28px]">
          <div className="relative w-[420px]">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#777"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>

            <input
              className="h-[40px] w-full rounded-[8px] border border-[#dedee3] bg-white pl-[42px] text-[13px] outline-none"
              placeholder="메시지 또는 팀 멤버 검색"
            />
          </div>

          <div className="flex items-center gap-6 text-[#4d4a4f]">
            <span className="text-[21px]">♧</span>
            <span className="text-[20px]">?</span>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="px-[30px] pb-[60px] pt-[30px]">
        <div className="w-full">
          {/* TITLE */}
          <h1 className="text-[24px] font-bold tracking-[-0.5px]">
            수신자
          </h1>

          <p className="mt-[6px] text-[13px] text-[#88858d]">
            자주 소통하는 상대의 커뮤니케이션 성향을 확인하고 관리하세요
          </p>

          {/* TWO COLUMN */}
          <div className="mt-[28px] grid grid-cols-[298px_minmax(0,1fr)] gap-[28px]">
            {/* LEFT LIST */}
            <section className="h-fit overflow-hidden rounded-[22px] border border-[#e1e0e6] bg-white">
              {/* SEARCH */}
              <div className="border-b border-[#eeeeef] p-[14px]">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-[38px] w-full rounded-full bg-[#f1f1f3] px-[15px] text-[12px] outline-none"
                  placeholder="이름, 회사로 검색"
                />
              </div>

              {/* TABS */}
              <div className="flex items-center border-b border-[#eeeeef] px-[14px] py-[10px]">
                <span className="rounded-full bg-[#eee8ff] px-[12px] py-[6px] text-[11px] font-medium text-[#603de0]">
                  전체 {recipients.length}
                </span>

                <span className="px-[11px] py-[6px] text-[11px] text-[#77747b]">
                  즐겨찾기 4
                </span>

                <span className="px-[11px] py-[6px] text-[11px] text-[#77747b]">
                  최근 연락 6
                </span>
              </div>

              {/* RECIPIENT LIST */}
              <div className="p-[8px]">
                {filteredRecipients.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`mb-[3px] flex w-full items-center gap-[11px] rounded-[15px] px-[11px] py-[10px] text-left transition ${
                      selected.id === item.id
                        ? 'bg-[#f0edff]'
                        : 'bg-white hover:bg-[#f8f8fa]'
                    }`}
                  >
                    <div className="relative flex h-[39px] w-[39px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d9d9dc] text-[12px] font-medium">
                      {item.name.slice(0, 1)}

                      {item.speed === 'Fast' && (
                        <span className="absolute bottom-0 right-0 h-[9px] w-[9px] rounded-full border-2 border-white bg-[#20c477]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold">
                        {item.name}
                      </p>

                      <p className="mt-[2px] truncate text-[10px] text-[#85818a]">
                        {item.position} · {item.company}
                      </p>

                      <span
                        className={`mt-[4px] inline-block rounded-full px-[7px] py-[2px] text-[9px] ${
                          item.speed === 'Fast'
                            ? 'bg-[#dcf9e9] text-[#24945a]'
                            : item.speed === 'Slow'
                              ? 'bg-[#eeeeee] text-[#777]'
                              : 'bg-[#f1edff] text-[#6948dc]'
                        }`}
                      >
                        {item.speed === 'Fast'
                          ? '응답 빠름'
                          : item.speed === 'Slow'
                            ? '느림'
                            : '보통'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* RIGHT DETAIL */}
            <section className="min-w-0 overflow-hidden rounded-[22px] border border-[#e1e0e6] bg-white">
              {/* PROFILE HEADER */}
              <div className="px-[26px] pb-[22px] pt-[24px]">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-[17px]">
                    <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[18px] bg-[#d5d5d7]">
                      <div className="flex h-full w-full items-center justify-center text-[25px] text-[#777]">
                        {selected.name.slice(0, 1)}
                      </div>

                      <span className="absolute bottom-[6px] right-[6px] h-[10px] w-[10px] rounded-full border-2 border-white bg-[#20c477]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-[7px]">
                        <span className="rounded-[5px] bg-[#ece7ff] px-[8px] py-[4px] text-[9px] font-medium text-[#5539d6]">
                          🛡 VERIFIED EXPERT
                        </span>

                        <span className="rounded-[5px] bg-[#f3eee8] px-[8px] py-[4px] text-[9px] text-[#665e58]">
                          FULL-TIME
                        </span>
                      </div>

                      <h2 className="mt-[8px] text-[27px] font-semibold leading-none">
                        {selected.name}
                      </h2>

                      <p className="mt-[8px] text-[15px] font-semibold text-[#4c4850]">
                        {selected.position}
                        <span className="font-normal text-[#85818a]">
                          {' '}
                          · {selected.company}
                        </span>
                      </p>

                      {/* BUTTONS — 사진처럼 프로필 아래 */}
                      <div className="mt-[17px] flex gap-[10px]">
                        <button
                          onClick={sendMessage}
                          className="rounded-[10px] border border-[#d8d8df] bg-white px-[25px] py-[10px] text-[12px] font-medium shadow-sm"
                        >
                          메시지 보내기
                        </button>

                        <button className="rounded-[10px] bg-[#5134dd] px-[25px] py-[10px] text-[12px] font-semibold text-white">
                          협업 요청
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLLABORATION CONTEXT */}
              <div className="border-t border-[#eeeef0] bg-[#f0edff] px-[26px] py-[22px]">
                <h3 className="flex items-center gap-[8px] text-[16px] font-bold">
                  <span className="text-[#5737dd]">✎</span>
                  Collaboration Context
                </h3>

                <div className="mt-[18px] grid grid-cols-[80px_1fr] gap-y-[11px] text-[12px]">
                  <span className="text-[#77747b]">국가</span>
                  <span>{selected.country}</span>

                  <span className="text-[#77747b]">언어</span>
                  <span>{selected.language}</span>

                  <span className="text-[#77747b]">시간대</span>
                  <span>{selected.timezone}</span>

                  <span className="text-[#77747b]">직무</span>
                  <span>{selected.position}</span>

                  <span className="text-[#77747b]">조직 관계</span>
                  <span>{selected.relationship}</span>
                </div>
              </div>

              {/* 사진의 빈 공간 */}
              <div className="h-[305px]" />

              {/* RESPONSE TIME */}
              <div className="border-t border-[#eeeeef] px-[26px] pb-[27px] pt-[23px]">
                <h3 className="flex items-center gap-[8px] text-[16px] font-bold">
                  <span className="text-[#5737dd]">◔</span>
                  Response Time Metrics
                </h3>

                <div className="mt-[20px] grid grid-cols-3 gap-[18px]">
                  <div className="rounded-[18px] bg-[#fafafd] px-[10px] py-[20px] text-center">
                    <p className="text-[27px] leading-none text-[#5b40df]">
                      {selected.responseTime}
                      <span className="ml-[2px] text-[12px]">min</span>
                    </p>
                    <p className="mt-[7px] text-[11px] text-[#999]">
                      평균 응답 시간
                    </p>
                  </div>

                  <div className="rounded-[18px] bg-[#fafafd] px-[10px] py-[20px] text-center">
                    <p className="text-[27px] leading-none text-[#8b57f0]">
                      {selected.speed}
                    </p>
                    <p className="mt-[7px] text-[11px] text-[#999]">
                      상대적 응답 속도
                    </p>
                  </div>

                  <div className="rounded-[18px] bg-[#fafafd] px-[10px] py-[20px] text-center">
                    <p className="text-[27px] leading-none text-[#9957e8]">
                      {selected.collaboration}
                    </p>
                    <p className="mt-[7px] text-[11px] text-[#999]">
                      협업 적극성
                    </p>
                  </div>
                </div>

                <div className="mt-[18px] rounded-full bg-[#f5f5f7] py-[11px] text-center text-[11px] text-[#777]">
                  오전 10시~11시 사이에 가장 높은 확률로 즉각 응답합니다.
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}