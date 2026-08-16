// src/pages/TeamMemoryPage.tsx

import { useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader'

const API_URL = import.meta.env.VITE_API_URL || ''

type Pattern = {
  id: string
  title: string
  purpose: string
  reason: string
  request: string
  deadline: string
  attachmentName?: string
  updatedAt?: string
  unread?: boolean
}

type Candidate = {
  id: string
  text: string
  suggestion: string
  confidence: number
}

type LearningLog = {
  id: string
  action: string
  description: string
  time: string
}

const defaultPatterns: Pattern[] = [
  {
    id: '1',
    title: '디자인 피드백 요청',
    purpose:
      '신규 UI 컴포넌트의 시각적 일관성 검토 및 브랜드 가이드 준수 확인',
    reason:
      '사용자 데이터 밀도 최적화를 위해 기존 카드 시스템의 패딩 값을 24px에서 16px로 축소함',
    request: '가독성 저하 여부 확인\n모바일 해상도 대응 확인',
    deadline: '2024-11-20 (수) 15:00까지',
    updatedAt: '2시간 전',
    unread: true,
  },
  {
    id: '2',
    title: '주간 보고 템플릿',
    purpose:
      '팀 내 성과 지표와 이슈 및 계획을 요약하는 정형화된 보고 체계입니다.',
    reason: '',
    request: '',
    deadline: '',
    updatedAt: '1일 전',
    unread: false,
  },
  {
    id: '3',
    title: 'QA 버그 리포트',
    purpose:
      '재현 경로와 스크린샷 링크를 포함한 기술적 이슈 보고 형식입니다.',
    reason: '',
    request: '',
    deadline: '',
    updatedAt: '1일 전',
    unread: false,
  },
]

const defaultCandidates: Candidate[] = [
  {
    id: 'candidate-1',
    text: '"최근 5회 협업에서 동일한 표현이 반복되었습니다."',
    suggestion: '"문건에 대해 데이터 정합성 확인 부탁드립니다."',
    confidence: 94,
  },
  {
    id: 'candidate-2',
    text: '"확인 부탁드립니다" 표현이 반복적으로 사용되었습니다.',
    suggestion: '"확인 부탁드립니다"를 기본 표현으로 학습합니다.',
    confidence: 91,
  },
  {
    id: 'candidate-3',
    text: '보고 메시지에서 결론을 먼저 전달하는 패턴이 발견되었습니다.',
    suggestion: '결론 → 근거 → 요청 순서의 보고 패턴을 저장합니다.',
    confidence: 89,
  },
]

const defaultLogs: LearningLog[] = [
  {
    id: 'log-1',
    action: '패턴 학습 완료',
    description: '디자인 피드백 요청 패턴이 팀 메모리에 저장되었습니다.',
    time: '오늘 05:21',
  },
  {
    id: 'log-2',
    action: 'AI 패턴 감지',
    description: '협업 메시지에서 반복 표현이 감지되었습니다.',
    time: '오늘 04:52',
  },
  {
    id: 'log-3',
    action: '패턴 업데이트',
    description: '디자인 피드백 요청 패턴의 변경 이유가 업데이트되었습니다.',
    time: '어제 18:30',
  },
  {
    id: 'log-4',
    action: '패턴 학습 완료',
    description: '주간 보고 템플릿 패턴이 팀 메모리에 저장되었습니다.',
    time: '어제 14:12',
  },
]

/* =========================================================
   Icons
========================================================= */

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function PatternIcon() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#efedff] text-[#4c35d4]">
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 4h10v16H7z" />
        <path d="M9.5 8h5M9.5 12h5M9.5 16h3" />
      </svg>
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z" />
      <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" />
      <path d="M5 18a2 2 0 0 0 2 2" />
      <path d="M9 8h7M9 12h7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

/* =========================================================
   Helpers
========================================================= */

function getUpdatedTimeValue(value?: string) {
  if (!value) return 0

  if (value.includes('방금')) return 0
  if (value.includes('분 전')) {
    const minute = Number(value.replace(/[^0-9]/g, ''))
    return minute
  }

  if (value.includes('시간 전')) {
    const hour = Number(value.replace(/[^0-9]/g, ''))
    return hour * 60
  }

  if (value.includes('일 전')) {
    const day = Number(value.replace(/[^0-9]/g, ''))
    return day * 24 * 60
  }

  if (value.includes('주 전')) {
    const week = Number(value.replace(/[^0-9]/g, ''))
    return week * 7 * 24 * 60
  }

  return 999999
}

/* =========================================================
   Page
========================================================= */

export default function TeamMemoryPage() {
  const [patterns, setPatterns] = useState<Pattern[]>(defaultPatterns)
  const [selectedId, setSelectedId] = useState('1')
  const [tab, setTab] = useState<'saved' | 'candidates'>('saved')

  const [candidates, setCandidates] =
    useState<Candidate[]>(defaultCandidates)

  const [learningLogs, setLearningLogs] =
    useState<LearningLog[]>(defaultLogs)

  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // 버튼이 눌렸을 때만 true
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // 버튼이 눌렸을 때만 true
  const [sortActive, setSortActive] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showLearningLog, setShowLearningLog] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newPurpose, setNewPurpose] = useState('')
  const [newReason, setNewReason] = useState('')
  const [newRequest, setNewRequest] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selected =
    patterns.find((pattern) => pattern.id === selectedId) ||
    patterns[0]

  /* =========================================================
     API
  ========================================================= */

  useEffect(() => {
    fetch(`${API_URL}/api/team-memory`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setPatterns(data)
          setSelectedId(data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  /* =========================================================
     Filter + Sort
  ========================================================= */

  const filteredPatterns = useMemo(() => {
    let result = [...patterns]

    if (search.trim()) {
      const keyword = search.toLowerCase().trim()

      result = result.filter((item) => {
        return (
          item.title.toLowerCase().includes(keyword) ||
          item.purpose.toLowerCase().includes(keyword) ||
          item.reason.toLowerCase().includes(keyword) ||
          item.request.toLowerCase().includes(keyword) ||
          item.deadline.toLowerCase().includes(keyword)
        )
      })
    }

    // 읽지 않은 항목 버튼이 눌린 경우에만 필터링
    if (showUnreadOnly) {
      result = result.filter((item) => item.unread === true)
    }

    // 정렬 버튼이 눌린 경우에만 정렬
    // false일 때는 patterns의 원래 순서를 그대로 유지
    if (sortActive) {
      result.sort((a, b) => {
        return (
          getUpdatedTimeValue(a.updatedAt) -
          getUpdatedTimeValue(b.updatedAt)
        )
      })
    }

    return result
  }, [
    patterns,
    search,
    showUnreadOnly,
    sortActive,
  ])

  /*
   * 사진처럼:
   * 첫 번째 카드는 큰 카드
   * 나머지는 아래 2열 카드
   *
   * 정렬을 하지 않은 기본 상태에서는 기존 배열 순서를 그대로 사용한다.
   * 선택한 카드를 클릭하면 그 카드를 상세 카드로 보여준다.
   */
  const displayPatterns = useMemo(() => {
    if (!filteredPatterns.length) return []

    if (!sortActive) {
      const selectedIndex = filteredPatterns.findIndex(
        (item) => item.id === selectedId,
      )

      if (selectedIndex > 0) {
        const copied = [...filteredPatterns]
        const [selectedPattern] = copied.splice(selectedIndex, 1)
        copied.unshift(selectedPattern)
        return copied
      }
    }

    return filteredPatterns
  }, [filteredPatterns, selectedId, sortActive])

  const featuredPattern = displayPatterns[0]
  const secondaryPatterns = displayPatterns.slice(1)

  /* =========================================================
     Logs
  ========================================================= */

  function addLearningLog(
    action: string,
    description: string,
  ) {
    const now = new Date()

    const time = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    setLearningLogs((current) => [
      {
        id: `log-${Date.now()}`,
        action,
        description,
        time: `오늘 ${time}`,
      },
      ...current,
    ])
  }

  /* =========================================================
     Add
  ========================================================= */

  function openAddModal() {
    setNewTitle('')
    setNewPurpose('')
    setNewReason('')
    setNewRequest('')
    setNewDeadline('')
    setShowAddModal(true)
  }

  async function addPattern() {
    if (!newTitle.trim()) return

    const newPattern: Pattern = {
      id: `pattern-${Date.now()}`,
      title: newTitle.trim(),
      purpose: newPurpose.trim(),
      reason: newReason.trim(),
      request: newRequest.trim(),
      deadline: newDeadline.trim(),
      updatedAt: '방금 전',
      unread: true,
    }

    setPatterns((current) => [newPattern, ...current])
    setSelectedId(newPattern.id)
    setShowAddModal(false)

    addLearningLog(
      '패턴 추가',
      `"${newPattern.title}" 패턴이 추가되었습니다.`,
    )

    await fetch(`${API_URL}/api/team-memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPattern),
    }).catch(() => {})
  }

  /* =========================================================
     Edit
  ========================================================= */

  function openEditModal() {
    if (!selected) return

    setNewTitle(selected.title)
    setNewPurpose(selected.purpose)
    setNewReason(selected.reason)
    setNewRequest(selected.request)
    setNewDeadline(selected.deadline)

    setShowEditModal(true)
    setShowMenu(false)
  }

  async function updatePattern() {
    if (!selected || !newTitle.trim()) return

    const updated: Pattern = {
      ...selected,
      title: newTitle.trim(),
      purpose: newPurpose.trim(),
      reason: newReason.trim(),
      request: newRequest.trim(),
      deadline: newDeadline.trim(),
      updatedAt: '방금 전',
    }

    setLoading(true)
    setPatterns((current) =>
      current.map((item) =>
        item.id === updated.id ? updated : item,
      ),
    )

    setShowEditModal(false)

    addLearningLog(
      '패턴 업데이트',
      `"${updated.title}" 패턴이 수정되었습니다.`,
    )

    await fetch(`${API_URL}/api/team-memory/${updated.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updated),
    }).catch(() => {})
    setLoading(false)
  }

  /* =========================================================
     Delete
  ========================================================= */

  async function deleteSelected() {
    if (!selected) return

    const confirmed = window.confirm(
      `"${selected.title}" 패턴을 삭제하시겠습니까?`,
    )

    if (!confirmed) return

    const deletedTitle = selected.title

    const remaining = patterns.filter(
      (item) => item.id !== selected.id,
    )

    setPatterns(remaining)
    setSelectedId(remaining[0]?.id || '')
    setShowMenu(false)

    addLearningLog(
      '패턴 삭제',
      `"${deletedTitle}" 패턴이 삭제되었습니다.`,
    )

    await fetch(`${API_URL}/api/team-memory/${selected.id}`, {
      method: 'DELETE',
    }).catch(() => {})
  }

  /* =========================================================
     Candidate
  ========================================================= */

  async function saveCandidate(candidate: Candidate) {
    const newPattern: Pattern = {
      id: `candidate-pattern-${Date.now()}`,
      title: 'AI 학습 패턴',
      purpose: candidate.suggestion,
      reason: '',
      request: '',
      deadline: '',
      updatedAt: '방금 전',
      unread: false,
    }

    setPatterns((current) => [newPattern, ...current])

    setCandidates((current) =>
      current.filter((item) => item.id !== candidate.id),
    )

    addLearningLog(
      'AI 패턴 저장',
      `신뢰도 ${candidate.confidence}%의 AI 학습 후보가 저장되었습니다.`,
    )

    await fetch(`${API_URL}/api/team-memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPattern),
    }).catch(() => {})
  }

  function ignoreCandidate(candidateId: string) {
    const candidate = candidates.find(
      (item) => item.id === candidateId,
    )

    setCandidates((current) =>
      current.filter((item) => item.id !== candidateId),
    )

    if (candidate) {
      addLearningLog(
        'AI 패턴 무시',
        `신뢰도 ${candidate.confidence}%의 학습 후보를 무시했습니다.`,
      )
    }
  }

  /* =========================================================
     File
  ========================================================= */

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file || !selected) return

    setPatterns((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              attachmentName: file.name,
            }
          : item,
      ),
    )

    addLearningLog(
      '첨부파일 추가',
      `"${file.name}" 파일이 "${selected.title}"에 첨부되었습니다.`,
    )

    event.target.value = ''
  }

  /* =========================================================
     Read
  ========================================================= */

  function markAsRead(patternId: string) {
    setPatterns((current) =>
      current.map((item) =>
        item.id === patternId
          ? { ...item, unread: false }
          : item,
      ),
    )
  }

  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#2d292b]">
      {/* =====================================================
          Header
      ===================================================== */}

      <PageHeader searchValue={search} onSearchChange={setSearch} />

      {/* =====================================================
          Main
      ===================================================== */}

      <main className="px-8 pb-12 pt-8">
        <div className="mb-7">
          <h1 className="ieum-page-title text-[#292527]">팀 메모리</h1>
          <p className="ieum-page-subtitle text-[#777079]">팀의 커뮤니케이션 패턴과 학습된 업무 방식을 관리하세요.</p>
        </div>
        {/* ===================================================
            Tabs
        =================================================== */}

        <div className="flex items-end justify-between border-b border-[#e4e1e7]">
          <div className="flex h-[47px] items-start gap-8">
            <button
              type="button"
              onClick={() => setTab('saved')}
              className={`relative h-[47px] px-2 text-[15px] ${
                tab === 'saved'
                  ? 'font-medium text-[#5037d7]'
                  : 'text-[#6f6b70]'
              }`}
            >
              저장된 패턴

              {tab === 'saved' && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#5037d7]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTab('candidates')}
              className={`relative h-[47px] px-2 text-[15px] ${
                tab === 'candidates'
                  ? 'font-medium text-[#5037d7]'
                  : 'text-[#6f6b70]'
              }`}
            >
              학습 후보

              <span className="ml-1 inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#5037d7] px-1 text-[11px] font-semibold text-white">
                {candidates.length}
              </span>

              {tab === 'candidates' && (
                <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#5037d7]" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="mb-3 flex h-[37px] items-center gap-2 rounded-lg bg-[#5037d7] px-4 text-[13px] font-medium text-white shadow-sm transition hover:bg-[#432bc9]"
          >
            <PlusIcon />
            패턴 추가
          </button>
        </div>

        {tab === 'saved' ? (
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_312px] items-start gap-5">
            {/* =================================================
                LEFT
            ================================================= */}

            <section className="min-w-0">
              {/* =================================================
                  Filters

                  기본 상태 = 흰색
                  활성화 상태 = 보라색
              ================================================= */}

              <div className="mb-6 flex items-center gap-2">
                {/* 읽지 않은 항목 */}
                <button
                  type="button"
                  aria-pressed={showUnreadOnly}
                  onClick={() =>
                    setShowUnreadOnly((current) => !current)
                  }
                  className={`h-[31px] rounded border px-3 text-[12px] transition ${
                    showUnreadOnly
                      ? 'border-[#a99ce8] bg-[#f2efff] text-[#5037d7]'
                      : 'border-[#d4d1d6] bg-white text-[#4f4a50] hover:bg-[#fafafa]'
                  }`}
                >
                  읽지 않은 항목
                </button>

                {/* 정렬 */}
                <button
                  type="button"
                  aria-pressed={sortActive}
                  onClick={() =>
                    setSortActive((current) => !current)
                  }
                  className={`flex h-[31px] items-center gap-2 rounded border px-3 text-[12px] transition ${
                    sortActive
                      ? 'border-[#a99ce8] bg-[#f2efff] text-[#5037d7]'
                      : 'border-[#d4d1d6] bg-white text-[#4f4a50] hover:bg-[#fafafa]'
                  }`}
                >
                  <SortIcon />
                  정렬
                </button>
              </div>

              {/* =================================================
                  Pattern Cards
              ================================================= */}

              {displayPatterns.length === 0 ? (
                <div className="rounded-xl border border-[#dedce2] bg-white px-6 py-14 text-center text-[13px] text-[#88848a]">
                  {showUnreadOnly
                    ? '읽지 않은 패턴이 없습니다.'
                    : '조건에 맞는 패턴이 없습니다.'}
                </div>
              ) : (
                <div className="space-y-5">
                  {/* ================================
                      Featured / Large Card
                  ================================= */}

                  {featuredPattern && (
                    <PatternCard
                      pattern={featuredPattern}
                      isSelected={
                        selected?.id === featuredPattern.id
                      }
                      isFeatured
                      showMenu={
                        showMenu &&
                        selected?.id === featuredPattern.id
                      }
                      onSelect={() => {
                        setSelectedId(featuredPattern.id)
                        markAsRead(featuredPattern.id)
                      }}
                      onEdit={openEditModal}
                      onToggleMenu={() =>
                        setShowMenu((current) => !current)
                      }
                      onDelete={deleteSelected}
                      onUpload={() =>
                        fileInputRef.current?.click()
                      }
                      fileInputRef={fileInputRef}
                      onFileChange={handleFileChange}
                    />
                  )}

                  {/* ================================
                      Bottom 2 Cards
                  ================================= */}

                  {secondaryPatterns.length > 0 && (
                    <div className="grid grid-cols-2 gap-5">
                      {secondaryPatterns.map((pattern) => (
                        <PatternCard
                          key={pattern.id}
                          pattern={pattern}
                          isSelected={
                            selected?.id === pattern.id
                          }
                          isFeatured={false}
                          showMenu={
                            showMenu &&
                            selected?.id === pattern.id
                          }
                          onSelect={() => {
                            setSelectedId(pattern.id)
                            markAsRead(pattern.id)
                          }}
                          onEdit={openEditModal}
                          onToggleMenu={() =>
                            setShowMenu((current) => !current)
                          }
                          onDelete={deleteSelected}
                          onUpload={() =>
                            fileInputRef.current?.click()
                          }
                          fileInputRef={fileInputRef}
                          onFileChange={handleFileChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* =================================================
                RIGHT AI
            ================================================= */}

            <aside className="rounded-xl border border-[#dedce2] bg-white p-6">
              <div className="flex items-center gap-2">
                <div className="text-[#5037d7]">
                  <SparkleIcon />
                </div>

                <h2 className="text-[17px] font-semibold text-[#332e32]">
                  AI 학습 후보
                </h2>
              </div>

              {candidates.length > 0 ? (
                <div className="mt-5">
                  {/* 첫 번째 후보 - 사진과 동일하게 크게 */}
                  <CandidatePreview
                    candidate={candidates[0]}
                    onIgnore={() =>
                      ignoreCandidate(candidates[0].id)
                    }
                    onSave={() =>
                      saveCandidate(candidates[0])
                    }
                  />

                  {/* 나머지 후보는 사진 레이아웃을 유지하면서 아래에 표시 */}
                  {candidates.length > 1 && (
                    <div className="mt-3 space-y-2">
                      {candidates.slice(1).map((candidate) => (
                        <div
                          key={candidate.id}
                          className="rounded-lg border border-[#ebe9ed] p-3"
                        >
                          <p className="text-[11px] leading-5 text-[#656067]">
                            {candidate.text}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] text-[#8b858b]">
                              신뢰도 {candidate.confidence}%
                            </span>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  ignoreCandidate(candidate.id)
                                }
                                className="text-[10px] text-[#888]"
                              >
                                무시
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  saveCandidate(candidate)
                                }
                                className="text-[10px] font-medium text-[#5037d7]"
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-[#e3e0e5] px-4 py-8 text-center text-[12px] text-[#8c878d]">
                  새로운 학습 후보가 없습니다.
                </div>
              )}

              {/* =================================================
                  Statistics
              ================================================= */}

              <div className="mt-4 rounded-xl bg-[#efedff] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-[#77717a]">
                      학습 완료 패턴
                    </p>

                    <strong className="mt-1 block text-[20px] font-semibold text-[#5037d7]">
                      {124 +
                        (defaultCandidates.length -
                          candidates.length)}
                      개
                    </strong>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] text-[#77717a]">
                      성장률
                    </p>

                    <strong className="mt-1 block text-[20px] font-semibold text-[#087fa7]">
                      +12%
                    </strong>
                  </div>
                </div>
              </div>

              {/* =================================================
                  Learning Log
              ================================================= */}

              <button
                type="button"
                onClick={() => setShowLearningLog(true)}
                className="mt-5 h-[40px] w-full rounded-lg border border-[#dfbda8] bg-white text-[12px] text-[#665c57] transition hover:bg-[#fffaf7]"
              >
                학습 로그 보기
              </button>
            </aside>
          </div>
        ) : (
          /* ===================================================
             Candidate Tab
          =================================================== */

          <section className="mt-6 grid max-w-[920px] grid-cols-1 gap-4">
            {candidates.length === 0 ? (
              <div className="rounded-xl border border-[#dedce2] bg-white px-6 py-14 text-center text-[13px] text-[#88848a]">
                현재 학습 후보가 없습니다.
              </div>
            ) : (
              candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="rounded-xl border border-[#dedce2] bg-white p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#efedff] text-[#5037d7]">
                        <SparkleIcon />
                      </div>

                      <div>
                        <h3 className="text-[16px] font-semibold">
                          AI 학습 후보
                        </h3>

                        <p className="mt-1 text-[11px] text-[#89838a]">
                          신뢰도 {candidate.confidence}%
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          ignoreCandidate(candidate.id)
                        }
                        className="rounded-full bg-[#e4e3e4] px-4 py-2 text-[11px] text-[#6b676b]"
                      >
                        무시
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveCandidate(candidate)
                        }
                        className="rounded-full bg-[#5037d7] px-4 py-2 text-[11px] text-white"
                      >
                        저장
                      </button>
                    </div>
                  </div>

                  <p className="mt-5 text-[13px] leading-6">
                    {candidate.text}
                  </p>

                  <div className="mt-3 rounded-lg bg-[#f0edff] p-4 text-[13px] leading-6 text-[#5f5963]">
                    {candidate.suggestion}
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </main>

      {/* =====================================================
          Add Pattern Modal
      ===================================================== */}

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
          onMouseDown={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-[620px] rounded-xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold">
                새로운 패턴 추가
              </h2>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#777]"
              >
                <CloseIcon />
              </button>
            </div>

            <PatternForm
              title={newTitle}
              purpose={newPurpose}
              reason={newReason}
              request={newRequest}
              deadline={newDeadline}
              setTitle={setNewTitle}
              setPurpose={setNewPurpose}
              setReason={setNewReason}
              setRequest={setNewRequest}
              setDeadline={setNewDeadline}
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-[#d9d6dc] px-5 py-3 text-[12px]"
              >
                취소
              </button>

              <button
                type="button"
                onClick={addPattern}
                className="rounded-lg bg-[#5037d7] px-5 py-3 text-[12px] font-medium text-white"
              >
                패턴 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Edit Pattern Modal
      ===================================================== */}

      {showEditModal && selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
          onMouseDown={() => setShowEditModal(false)}
        >
          <div
            className="w-full max-w-[620px] rounded-xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold">
                패턴 수정
              </h2>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[#777]"
              >
                <CloseIcon />
              </button>
            </div>

            <PatternForm
              title={newTitle}
              purpose={newPurpose}
              reason={newReason}
              request={newRequest}
              deadline={newDeadline}
              setTitle={setNewTitle}
              setPurpose={setNewPurpose}
              setReason={setNewReason}
              setRequest={setNewRequest}
              setDeadline={setNewDeadline}
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-[#d9d6dc] px-5 py-3 text-[12px]"
              >
                취소
              </button>

              <button
                type="button"
                onClick={updatePattern}
                disabled={loading}
                className="rounded-lg bg-[#5037d7] px-5 py-3 text-[12px] font-medium text-white disabled:opacity-50"
              >
                {loading ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          Learning Log Modal
      ===================================================== */}

      {showLearningLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
          onMouseDown={() => setShowLearningLog(false)}
        >
          <div
            className="w-full max-w-[560px] overflow-hidden rounded-xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e8e5e9] px-6 py-5">
              <div>
                <h2 className="text-[17px] font-semibold text-[#332e32]">
                  학습 로그
                </h2>

                <p className="mt-1 text-[11px] text-[#89838a]">
                  팀 메모리에 반영된 최근 학습 활동입니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLearningLog(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#777] hover:bg-[#f6f4f7]"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Logs */}
            <div className="max-h-[440px] overflow-y-auto px-6 py-4">
              {learningLogs.length === 0 ? (
                <div className="py-12 text-center text-[12px] text-[#8c878d]">
                  학습 로그가 없습니다.
                </div>
              ) : (
                <div className="space-y-1">
                  {learningLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-3 rounded-lg px-2 py-4 hover:bg-[#faf9fb]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#efedff] text-[#5037d7]">
                        <CheckIcon />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[12px] font-semibold text-[#403b40]">
                            {log.action}
                          </p>

                          <span className="shrink-0 text-[10px] text-[#aaa4aa]">
                            {log.time}
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] leading-5 text-[#777178]">
                          {log.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#e8e5e9] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLearningLog(false)}
                className="h-[38px] w-full rounded-lg border border-[#d9d5da] bg-white text-[12px] text-[#5e585e] hover:bg-[#fafafa]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* =========================================================
   Pattern Card
========================================================= */

function PatternCard({
  pattern,
  isSelected,
  isFeatured,
  showMenu,
  onSelect,
  onEdit,
  onToggleMenu,
  onDelete,
  onUpload,
  fileInputRef,
  onFileChange,
}: {
  pattern: Pattern
  isSelected: boolean
  isFeatured: boolean
  showMenu: boolean
  onSelect: () => void
  onEdit: () => void
  onToggleMenu: () => void
  onDelete: () => void
  onUpload: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-xl border bg-white text-left transition ${
        isSelected
          ? 'border-[#ddd9e5] shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
          : 'border-[#dedce2] hover:border-[#c9c5cf]'
      }`}
    >
      {/* 사진의 왼쪽 세로선 */}
      {isSelected && (
        <span className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-xl bg-[#e7e4ea]" />
      )}

      <div
        className={
          isFeatured
            ? 'p-6'
            : 'min-h-[182px] p-6'
        }
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <PatternIcon />

            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={
                    isFeatured
                      ? 'text-[18px] font-semibold leading-8 text-[#302c2f]'
                      : 'text-[17px] font-semibold leading-7 text-[#302c2f]'
                  }
                >
                  {pattern.title}
                </h2>

                {pattern.unread && (
                  <span className="h-[6px] w-[6px] rounded-full bg-[#5436da]" />
                )}
              </div>

              <p className="text-[11px] text-[#858087]">
                마지막 업데이트 ·{' '}
                {pattern.updatedAt || '1일 전'}
              </p>
            </div>
          </div>

          {/* Edit / More */}
          <div
            className="relative flex items-center gap-4 text-[#332e32]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onEdit}
              className="hover:text-[#5136d9]"
              aria-label="패턴 수정"
            >
              <EditIcon />
            </button>

            <button
              type="button"
              onClick={onToggleMenu}
              className="hover:text-[#5136d9]"
              aria-label="더보기"
            >
              <MoreIcon />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 z-20 w-[125px] overflow-hidden rounded-lg border border-[#dedbe1] bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={onEdit}
                  className="block w-full px-4 py-2 text-left text-[12px] hover:bg-[#f6f4ff]"
                >
                  수정
                </button>

                <button
                  type="button"
                  onClick={onDelete}
                  className="block w-full px-4 py-2 text-left text-[12px] text-[#d13d4b] hover:bg-[#fff5f5]"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            Featured card contents
        =================================================== */}

        {isFeatured ? (
          <>
            {/* 목적 + 첨부파일 */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="min-h-[95px] rounded-lg border border-[#dddbe0] p-4">
                <p className="text-[11px] font-medium text-[#5136d8]">
                  목적
                </p>

                <p className="mt-2 text-[13px] leading-5 text-[#383338]">
                  {pattern.purpose || '-'}
                </p>
              </div>

              <div className="min-h-[95px] rounded-lg border border-[#dddbe0] p-4">
                <p className="text-[11px] font-medium text-[#5136d8]">
                  첨부파일
                </p>

                {pattern.attachmentName ? (
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-[#666168]">
                    <BookIcon />

                    <span className="truncate">
                      {pattern.attachmentName}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onUpload()
                    }}
                    className="mt-3 flex items-center gap-2 text-[13px] text-[#aaa5aa] hover:text-[#5037d7]"
                  >
                    <UploadIcon />
                    파일 업로드
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </div>

            {/* 변경 이유 */}
            <div className="mt-4 rounded-lg border border-[#dddbe0] p-4">
              <p className="text-[11px] font-medium text-[#5136d8]">
                변경 이유
              </p>

              <p className="mt-2 text-[13px] leading-5 text-[#393438]">
                {pattern.reason || '-'}
              </p>
            </div>

            {/* 요청사항 + 마감 */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="min-h-[98px] rounded-lg border border-[#dddbe0] p-4">
                <p className="text-[11px] font-medium text-[#5136d8]">
                  요청사항
                </p>

                <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-[#393438]">
                  {pattern.request || '-'}
                </p>
              </div>

              <div className="min-h-[98px] rounded-lg border border-[#dddbe0] p-4">
                <p className="text-[11px] font-medium text-[#5136d8]">
                  마감
                </p>

                <p className="mt-2 text-[13px] text-[#e13e51]">
                  {pattern.deadline || '-'}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* =================================================
             Secondary cards
          ================================================= */

          <div className="mt-5">
            <p className="text-[13px] leading-6 text-[#6f696f]">
              {pattern.purpose}
            </p>

            <div className="mt-4 flex gap-2">
              {pattern.title.includes('QA') ? (
                <>
                  <span className="rounded bg-[#efedff] px-2 py-1 text-[10px] text-[#5037d7]">
                    #TECH
                  </span>

                  <span className="rounded bg-[#efedff] px-2 py-1 text-[10px] text-[#5037d7]">
                    #QA
                  </span>
                </>
              ) : (
                <>
                  <span className="rounded bg-[#efedff] px-2 py-1 text-[10px] text-[#5037d7]">
                    #REPORT
                  </span>

                  <span className="rounded bg-[#efedff] px-2 py-1 text-[10px] text-[#5037d7]">
                    #WEEKLY
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================
   Candidate Preview
========================================================= */

function CandidatePreview({
  candidate,
  onIgnore,
  onSave,
}: {
  candidate: Candidate
  onIgnore: () => void
  onSave: () => void
}) {
  return (
    <div className="rounded-xl border border-[#dcd9de] p-4">
      <p className="text-[12px] leading-6 text-[#373236]">
        {candidate.text
          .split('동일한 표현')
          .map((part, index) => (
            <span key={index}>
              {index > 0 && (
                <span className="bg-[#cdeeff] px-1">
                  동일한 표현
                </span>
              )}

              {part}
            </span>
          ))}
      </p>

      <div className="mt-3 rounded bg-[#f0edff] p-3 text-[12px] leading-5 text-[#656068]">
        {candidate.suggestion}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-[#5e575c]">
          신뢰도 {candidate.confidence}%
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onIgnore}
            className="rounded-full bg-[#e4e3e4] px-4 py-2 text-[11px] text-[#6b676b] transition hover:bg-[#d9d8da]"
          >
            무시
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-full bg-[#5037d7] px-4 py-2 text-[11px] text-white transition hover:bg-[#432bc9]"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Pattern Form
========================================================= */

function PatternForm({
  title,
  purpose,
  reason,
  request,
  deadline,
  setTitle,
  setPurpose,
  setReason,
  setRequest,
  setDeadline,
}: {
  title: string
  purpose: string
  reason: string
  request: string
  deadline: string
  setTitle: (value: string) => void
  setPurpose: (value: string) => void
  setReason: (value: string) => void
  setRequest: (value: string) => void
  setDeadline: (value: string) => void
}) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-[#5d565e]">
          패턴 이름
        </label>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-10 w-full rounded-lg border border-[#ddd9df] px-3 text-[13px] outline-none focus:border-[#7561dc]"
          placeholder="예: 디자인 피드백 요청"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-[#5d565e]">
          목적
        </label>

        <textarea
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-[#ddd9df] p-3 text-[13px] outline-none focus:border-[#7561dc]"
          placeholder="이 패턴의 목적을 입력하세요."
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-[#5d565e]">
          변경 이유
        </label>

        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-[#ddd9df] p-3 text-[13px] outline-none focus:border-[#7561dc]"
          placeholder="변경 이유를 입력하세요."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-[#5d565e]">
            요청사항
          </label>

          <textarea
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-[#ddd9df] p-3 text-[13px] outline-none focus:border-[#7561dc]"
            placeholder="요청사항을 입력하세요."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-[#5d565e]">
            마감
          </label>

          <input
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            className="h-10 w-full rounded-lg border border-[#ddd9df] px-3 text-[13px] outline-none focus:border-[#7561dc]"
            placeholder="2024-11-20 (수) 15:00까지"
          />
        </div>
      </div>
    </div>
  )
}