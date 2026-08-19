import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { getUserProfile } from '../users/userProfile'
import { analyzeCompanyDNA, type RecipientAIProfile } from '../ai/aiInsights'
import { emptyCompanyDNA, saveCompanyDNA, fetchCompanyDNA, type CompanyDNA, type CommunicationRule } from '../users/companyDna'
import { authorizationHeaders } from '../users/authStorage'

const API_URL = import.meta.env.VITE_API_URL || ''

type IconName =
  | 'search'
  | 'bell'
  | 'help'
  | 'org'
  | 'terms'
  | 'rules'
  | 'mail'
  | 'notice'
  | 'report'
  | 'edit'
  | 'plus'
  | 'close'
  | 'check'
  | 'reset'
  | 'simulation'
  | 'robot'
  | 'chart'
  | 'chevron'
  | 'save'

function Icon({
  name,
  size = 18,
  stroke = 'currentColor',
}: {
  name: IconName
  size?: number
  stroke?: string
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    )
  }

  if (name === 'bell') {
    return (
      <svg {...common}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    )
  }

  if (name === 'help') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.4 2.4 0 1 1 4.2 1.6c-.9.9-1.9 1.3-1.9 2.8" />
        <path d="M12 17h.01" />
      </svg>
    )
  }

  if (name === 'org') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <path d="M14 14h6v6h-6z" />
        <path d="M10 7h4M7 10v4M17 10v4M10 17h4" />
      </svg>
    )
  }

  if (name === 'terms') {
    return (
      <svg {...common}>
        <path d="M6 4h12v16H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </svg>
    )
  }

  if (name === 'rules') {
    return (
      <svg {...common}>
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M7 7 4 14h6L7 7Z" />
        <path d="m17 7-3 7h6l-3-7Z" />
      </svg>
    )
  }

  if (name === 'mail') {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    )
  }

  if (name === 'notice') {
    return (
      <svg {...common}>
        <path d="M4 11h3l8-4v10l-8-4H4z" />
        <path d="M15 9.5a4 4 0 0 1 0 5" />
        <path d="M7 15v4" />
      </svg>
    )
  }

  if (name === 'report') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="2.5" />
        <circle cx="16" cy="8" r="2.5" />
        <path d="M3.5 19c.4-3.2 2.1-5 4.5-5s4.1 1.8 4.5 5" />
        <path d="M11.5 19c.4-3.2 2.1-5 4.5-5 2.4 0 4.1 1.8 4.5 5" />
      </svg>
    )
  }

  if (name === 'edit') {
    return (
      <svg {...common}>
        <path d="m14 6 4 4" />
        <path d="m5 19 3.5-.8L19 7.7a2 2 0 0 0-2.8-2.8L5.7 15.4 5 19Z" />
      </svg>
    )
  }

  if (name === 'plus') {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }

  if (name === 'close') {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    )
  }

  if (name === 'check') {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    )
  }

  if (name === 'reset') {
    return (
      <svg {...common}>
        <path d="M4 12a8 8 0 1 0 2.3-5.7" />
        <path d="M4 5v5h5" />
      </svg>
    )
  }

  if (name === 'simulation') {
    return (
      <svg {...common}>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    )
  }

  if (name === 'robot') {
    return (
      <svg {...common}>
        <rect x="5" y="7" width="14" height="12" rx="3" />
        <path d="M12 3v4" />
        <circle cx="9" cy="12" r="1" />
        <circle cx="15" cy="12" r="1" />
        <path d="M9 16h6" />
      </svg>
    )
  }

  if (name === 'chart') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }

  if (name === 'chevron') {
    return (
      <svg {...common}>
        <path d="m9 6 6 6-6 6" />
      </svg>
    )
  }

  if (name === 'save') {
    return (
      <svg {...common}>
        <path d="M5 4h12l2 2v14H5z" />
        <path d="M8 4v5h8V4M8 20v-6h8v6" />
      </svg>
    )
  }

  return null
}

export default function CompanyDnaPage() {
  const [dna, setDNA] = useState<CompanyDNA>(emptyCompanyDNA)
  const [search, setSearch] = useState('')
  const profile = getUserProfile()
  const [aiEnabled, setAIEnabled] = useState(true)
  const [aiProfile, setAiProfile] = useState<RecipientAIProfile | null>(null)
  const [aiProfileLoading, setAiProfileLoading] = useState(false)

  useEffect(() => {
    let active = true
    const loadProfile = async () => {
      if (active) setAiProfileLoading(true)
      const result = await analyzeCompanyDNA({ profile: getUserProfile(), dna })
      if (active) { setAiProfile(result); setAiProfileLoading(false) }
    }
    void loadProfile()
    return () => { active = false }
  }, [dna])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [showRuleModal, setShowRuleModal] = useState(false)
  const [showEditRulesModal, setShowEditRulesModal] = useState(false)

  const [newRuleTitle, setNewRuleTitle] = useState('')
  const [newRuleDescription, setNewRuleDescription] = useState('')

  const [editingRules, setEditingRules] = useState<CommunicationRule[]>(
    emptyCompanyDNA.rules,
  )

  // ── AI 자동 분석 State ──
  const [extracting, setExtracting] = useState(false)
  const [extractSource, setExtractSource] = useState<'file' | 'gmail' | null>(null)
  const [extractResult, setExtractResult] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void fetchCompanyDNA(controller.signal)
      .then((data) => {
        setDNA(data)
        setEditingRules(data.rules)
        if (typeof data.aiEnabled === 'boolean') setAIEnabled(data.aiEnabled)
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error(error)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  async function saveDNA(nextDNA = dna) {
    setSaving(true)
    setSaved(false)
    try {
      await saveCompanyDNA({ ...nextDNA, aiEnabled })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2200)
    } catch (error) {
      console.error(error)
      alert('Company DNA 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }


  function resetDNA() {
    const confirmed = window.confirm(
      'Company DNA 설정을 비우시겠습니까?',
    )

    if (!confirmed) return

    setDNA(emptyCompanyDNA)
    setAIEnabled(true)
    void saveDNA(emptyCompanyDNA)
    setSaved(false)
  }

  // ── AI 자동 추출 핸들러 ──

  async function handleFileExtract(file: File) {
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedExtensions.includes(ext)) {
      alert(`지원하지 않는 파일 형식입니다: ${ext}\n지원: PDF, DOCX, TXT, MD`)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기가 10MB를 초과합니다.')
      return
    }

    setExtracting(true)
    setExtractSource('file')
    setExtractResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/company-dna/extract/file`, {
        method: 'POST',
        headers: authorizationHeaders(),
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg =
          (typeof data?.error === 'object' ? data?.error?.message : data?.error) ||
          data?.message ||
          '문서 기반 Company DNA 추출에 실패했습니다.'
        throw new Error(errorMsg)
      }

      // 추출 결과로 DNA 업데이트
      if (data.dna) {
        setDNA({
          ...dna,
          ...data.dna,
          terms: Array.isArray(data.dna.terms) ? data.dna.terms : dna.terms,
          rules: Array.isArray(data.dna.rules) ? data.dna.rules : dna.rules,
        })
        if (typeof data.dna.aiEnabled === 'boolean') {
          setAIEnabled(data.dna.aiEnabled)
        }
      }

      setExtractResult(`✅ "${file.name}"에서 Company DNA가 자동 생성되었습니다! (텍스트 ${data.textLength?.toLocaleString()}자 분석)`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Company DNA 추출에 실패했습니다.'
      setExtractResult(`❌ ${message}`)
    } finally {
      setExtracting(false)
    }
  }

  async function handleGmailExtract() {
    setExtracting(true)
    setExtractSource('gmail')
    setExtractResult(null)

    try {
      const response = await fetch(`${API_URL}/api/company-dna/extract/gmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeaders(),
        },
        body: JSON.stringify({ maxResults: 25 }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg =
          (typeof data?.error === 'object' ? data?.error?.message : data?.error) ||
          data?.message ||
          'Gmail 기반 Company DNA 추출에 실패했습니다.'
        throw new Error(errorMsg)
      }

      if (data.dna) {
        setDNA({
          ...dna,
          ...data.dna,
          terms: Array.isArray(data.dna.terms) ? data.dna.terms : dna.terms,
          rules: Array.isArray(data.dna.rules) ? data.dna.rules : dna.rules,
        })
        if (typeof data.dna.aiEnabled === 'boolean') {
          setAIEnabled(data.dna.aiEnabled)
        }
      }

      setExtractResult(`✅ Gmail 이메일 ${data.emailCount}건을 분석하여 Company DNA가 자동 생성되었습니다!`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gmail 기반 추출에 실패했습니다.'
      setExtractResult(`❌ ${message}`)
    } finally {
      setExtracting(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileExtract(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileExtract(file)
    e.target.value = ''
  }

  function addNewRule() {
    if (!newRuleTitle.trim()) {
      alert('규칙 제목을 입력해주세요.')
      return
    }

    if (!newRuleDescription.trim()) {
      alert('규칙 설명을 입력해주세요.')
      return
    }

    const nextRule: CommunicationRule = {
      id: `custom-${Date.now()}`,
      title: newRuleTitle.trim(),
      description: newRuleDescription.trim(),
      icon: 'notice',
    }

    setDNA((previous) => ({
      ...previous,
      rules: [...previous.rules, nextRule],
    }))

    setNewRuleTitle('')
    setNewRuleDescription('')
    setShowRuleModal(false)
    void saveDNA({ ...dna, rules: [...dna.rules, nextRule] })
  }

  function openRuleEditor() {
    setEditingRules(dna.rules)
    setShowEditRulesModal(true)
  }

  function updateEditingRule(
    id: string,
    field: 'title' | 'description',
    value: string,
  ) {
    setEditingRules((previous) =>
      previous.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              [field]: value,
            }
          : rule,
      ),
    )
  }

  function removeEditingRule(id: string) {
    setEditingRules((previous) =>
      previous.filter((rule) => rule.id !== id),
    )
  }

  function saveEditedRules() {
    const nextDNA = {
      ...dna,
      rules: editingRules,
    }

    setDNA(nextDNA)
    setShowEditRulesModal(false)
    void saveDNA(nextDNA)
  }

  const keyword = search.trim().toLowerCase()
  const matches = (value: string) => !keyword || value.toLowerCase().includes(keyword)
  const visibleTerms = dna.terms.filter((term) => matches(`${term.from} ${term.to}`))
  const visibleRules = dna.rules.filter((rule) => matches(`${rule.title} ${rule.description}`))

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc]">
        <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} />

        <main className="px-8 py-10">
          <div className="text-[14px] text-[#777]">
            Company DNA를 불러오는 중...
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* =========================================================
          TOP HEADER
      ========================================================= */}
      <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} />

      <main className="px-8 pb-12 pt-8">
        <div className="w-full">
          {/* PAGE TITLE */}
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <h1 className="ieum-page-title text-[#292527]">
                기업 커뮤니케이션 정보
              </h1>

              <p className="mt-2 text-[13px] leading-5 text-[#777079]">
                {profile.company || '우리 회사'}의 조직 문화와 언어 습관을 AI가 학습하여,
                모든 메시지 생성 시 일관된 목소리를 유지하도록 돕습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowRuleModal(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-[#5035dc] px-5 py-3.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#452bc9]"
            >
              <Icon
                name="plus"
                size={17}
                stroke="white"
              />

              새로운 DNA 규칙 추가
            </button>
          </div>

          {/* =====================================================
              AI 자동 분석 섹션
          ===================================================== */}
          <section className="mb-5 rounded-xl border border-dashed border-[#b4a7f0] bg-gradient-to-r from-[#f8f5ff] to-[#f0edff] p-5">
            <div className="mb-3 flex items-center gap-2">
              <Icon name="robot" size={20} stroke="#5035dc" />
              <h2 className="text-[14px] font-semibold text-[#5035dc]">
                AI 자동 분석으로 Company DNA 생성
              </h2>
            </div>

            <p className="mb-4 text-[12px] leading-5 text-[#6d6662]">
              회사 문서를 업로드하거나 Gmail 이메일을 연동하면, AI가 조직의 소통 패턴을 자동 분석하여 Company DNA를 생성합니다.
            </p>

            <div className="flex gap-4">
              {/* 파일 업로드 영역 */}
              <div
                className={`flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                  dragOver
                    ? 'border-[#5035dc] bg-[#ede8ff]'
                    : 'border-[#c9c0f0] bg-white hover:border-[#5035dc] hover:bg-[#faf8ff]'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Icon name="simulation" size={28} stroke="#8b7bd4" />
                <p className="mt-2 text-[13px] font-medium text-[#5035dc]">
                  문서를 여기에 드래그하거나
                </p>
                <label className="mt-2 cursor-pointer rounded-md bg-[#5035dc] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#452bc9]">
                  파일 선택
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={extracting}
                  />
                </label>
                <p className="mt-2 text-[11px] text-[#9d95b8]">
                  PDF, DOCX, TXT, MD (최대 10MB)
                </p>
              </div>

              {/* Gmail 분석 버튼 */}
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[#dddce2] bg-white p-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b7bd4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="5" width="17" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <p className="mt-2 text-[13px] font-medium text-[#393438]">
                  Gmail 이메일로 분석하기
                </p>
                <p className="mb-3 text-[11px] text-[#9d95b8]">
                  최근 보낸 이메일 25건을 AI가 분석합니다
                </p>
                <button
                  type="button"
                  onClick={handleGmailExtract}
                  disabled={extracting}
                  className="rounded-md border border-[#5035dc] px-4 py-2 text-[12px] font-semibold text-[#5035dc] transition hover:bg-[#f0edff] disabled:opacity-50"
                >
                  {extracting && extractSource === 'gmail' ? '분석 중...' : 'Gmail 이메일 분석'}
                </button>
              </div>
            </div>

            {/* 분석 진행 중 */}
            {extracting && (
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-white px-4 py-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5035dc] border-t-transparent" />
                <span className="text-[13px] text-[#5035dc]">
                  {extractSource === 'file' ? '문서를 분석하고 있습니다...' : 'Gmail 이메일을 분석하고 있습니다...'} (약 10~30초 소요)
                </span>
              </div>
            )}

            {/* 분석 결과 메시지 */}
            {extractResult && !extracting && (
              <div className={`mt-4 rounded-lg px-4 py-3 text-[13px] ${
                extractResult.startsWith('✅')
                  ? 'bg-[#ecfdf5] text-[#065f46]'
                  : 'bg-[#fef2f2] text-[#991b1b]'
              }`}>
                {extractResult}
              </div>
            )}
          </section>

          {/* =====================================================
              FIRST ROW
          ===================================================== */}
          <div className="grid grid-cols-[minmax(0,1fr)_280px] gap-5">
            {/* ORGANIZATION INFO */}
            <section className="rounded-xl border border-[#dedee5] bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0edff] text-[#5035dc]">
                    <Icon
                      name="org"
                      size={19}
                    />
                  </div>

                  <h2 className="text-[14px] font-semibold text-[#393438]">
                    조직 정보 (Org Info)
                  </h2>
                </div>


              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="min-h-36.5 rounded-lg border border-[#dddce2] p-4">
                  <p className="text-[12px] text-[#7d7775]">
                    의사결정 구조
                  </p>

                  <p className="mt-2 text-[13px] font-semibold text-[#393337]">
                    {dna.decisionStructure}
                  </p>

                  <p className="mt-3 text-[11px] leading-4.5 text-[#817b79]">
                    결론 중심의 빠른 피드백 문화를 지향하며, 직급
                    전문성을 존중합니다.
                  </p>
                </div>

                <div className="min-h-36.5 rounded-lg border border-[#dddce2] p-4">
                  <p className="text-[12px] text-[#7d7775]">
                    주요 채널
                  </p>

                  <p className="mt-2 text-[13px] font-semibold text-[#393337]">
                    {dna.channels}
                  </p>

                  <p className="mt-3 text-[11px] leading-4.5 text-[#817b79]">
                    비동기 협업을 원칙으로 하며, 모든 히스토리는 기록을
                    남깁니다.
                  </p>
                </div>

                <div className="min-h-36.5 rounded-lg border border-[#dddce2] p-4">
                  <p className="text-[12px] text-[#7d7775]">
                    보고 체계
                  </p>

                  <p className="mt-2 text-[13px] font-semibold text-[#393337]">
                    {dna.reporting}
                  </p>

                  <p className="mt-3 text-[11px] leading-4.5 text-[#817b79]">
                    주간 보고 대신 대시보드를 통한 상시 공유 체계를
                    활용합니다.
                  </p>
                </div>
              </div>

              {/* OFFICE IMAGE */}
              <div className="relative mt-5 h-36.25 overflow-hidden rounded-lg bg-[#ddd9d1]">
                <img
                  src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80"
                  alt="Company office"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-linear-to-r from-black/5 via-transparent to-black/10" />

                <div className="absolute bottom-3 right-4 rounded bg-[#b17b45]/80 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                  Company DNA
                </div>
              </div>
            </section>

            {/* AI ACCURACY */}
            <aside className="rounded-xl border border-[#e5c9ba] bg-white px-7 py-8 text-center">
              <div className="mx-auto flex h-27 w-27 items-center justify-center rounded-full border-[9px] border-[#6041e4]">
                <div>
                  <span className="block text-[25px] font-bold leading-none text-[#29252a]">
                    {dna.accuracy}%
                  </span>

                  <span className="mt-1 block text-[11px] text-[#5e5855]">
                    일치도
                  </span>
                </div>
              </div>

              <p className="mt-6 text-[13px] font-semibold text-[#403a3b]">
                AI 최적화 상태
              </p>

              <p className="mt-4 text-[11px] leading-4.75 text-[#77716f]">
                작성된 규칙들이 AI의 메시지 생성 알고리즘에 매우 높은
                정확도로 반영되고 있습니다.
              </p>


            </aside>
          </div>

          {/* =====================================================
              SECOND ROW
          ===================================================== */}
          <div className="mt-5 grid grid-cols-2 gap-5">
            {/* TERMS */}
            <section className="min-h-105 rounded-xl border border-[#dedee5] bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0edff] text-[#5035dc]">
                    <Icon
                      name="terms"
                      size={19}
                    />
                  </div>

                  <h2 className="text-[14px] font-semibold text-[#393438]">
                    자주 사용하는 용어 (Terms)
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#756e6a]">
                  <span>AI 학습 완료</span>

                  <span className="h-2 w-2 rounded-full bg-[#5c46d9]" />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {visibleTerms.map((term) => (
                  <div
                    key={`${term.from}-${term.to}`}
                    className="flex h-9.5 items-center rounded-lg border border-[#eeeef1] px-3 text-[12px]"
                  >
                    <span className="w-28.75 truncate text-[#aaa4a1] line-through">
                      {term.from}
                    </span>

                    <span className="text-[#706b68]">→</span>

                    <strong className="ml-4 text-[#5238d5]">
                      {term.to}
                    </strong>

                    <span className="ml-auto rounded bg-[#f1edff] px-2 py-1 text-[10px] text-[#6744df]">
                      권장
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-dashed border-[#b5a9dc] bg-[#f5f1ff] p-4 text-[11px] leading-4.5 text-[#6e6877]">
                사내에서는 '검토 요청'보다 '피드백 요청'이라는 표현을
                선호합니다.
                <br />
                AI는 이 규칙을 바탕으로 정중하면서도 협력적인
                톤앤매너를 제안합니다.
              </div>
            </section>

            {/* COMMUNICATION RULES */}
            <section className="min-h-105 rounded-xl border border-[#dedee5] bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0edff] text-[#5035dc]">
                    <Icon
                      name="rules"
                      size={19}
                    />
                  </div>

                  <h2 className="text-[14px] font-semibold text-[#393438]">
                    커뮤니케이션 규칙
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#756e6a]">
                    규칙 {dna.rules.length}개 적용 중
                  </span>

                  <button
                    type="button"
                    aria-label="커뮤니케이션 규칙 편집"
                    onClick={openRuleEditor}
                    className="text-[#625950] transition hover:text-[#5035dc]"
                  >
                    <Icon
                      name="edit"
                      size={19}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-5 max-h-97.5 space-y-4 overflow-y-auto pr-2">
                {visibleRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-[#cfc5f7] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 text-[#5035dc]">
                        <Icon
                          name={rule.icon}
                          size={19}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#3f3a42]">
                          {rule.title}
                        </p>

                        <p className="mt-2 text-[11px] leading-4.5 text-[#77737a]">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 max-h-28 overflow-y-auto pr-1">
                {aiProfileLoading ? <p className="text-[10px] text-[#999]">AI가 조직의 커뮤니케이션 패턴을 분석하고 있습니다.</p> : aiProfile ? <div className="flex flex-wrap gap-2">{[aiProfile.tone && `TONE: ${aiProfile.tone}`, aiProfile.style && `STYLE: ${aiProfile.style}`, aiProfile.emoji && `EMOJI: ${aiProfile.emoji}`].filter(Boolean).map((tag) => <span key={tag} className="rounded bg-[#f2efff] px-2 py-1 text-[9px] font-semibold text-[#625b72]">{tag}</span>)}</div> : <p className="text-[10px] text-[#999]">AI 분석 결과가 아직 없습니다.</p>}
              </div>
            </section>
          </div>

          {/* =====================================================
              BOTTOM AI GUIDE
          ===================================================== */}
          <section className="mt-5 flex min-h-28 items-center justify-between rounded-xl border border-[#e3d6ca] bg-white px-7 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#5035dc] text-white">
                <Icon
                  name="robot"
                  size={25}
                  stroke="white"
                />
              </div>

              <div>
                <p className="text-[13px] font-semibold text-[#5137d7]">
                  AI 메시지 가이드 작동 중
                </p>

                <p className="mt-1 max-w-145 text-[11px] leading-4.5 text-[#777]">
                  위 모든 설정값들이 실시간으로 학습되어, 임직원들이
                  메시지를 작성할 때 하단에 자동 제안됩니다.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={resetDNA}
                className="flex items-center gap-2 rounded-lg border border-[#6246df] bg-white px-5 py-3 text-[12px] font-medium text-[#5438d9] transition hover:bg-[#f7f4ff]"
              >
                <Icon
                  name="reset"
                  size={15}
                />

                설정 초기화
              </button>
            </div>
          </section>

          {/* SAVE BAR */}
          <div className="mt-4 flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-[12px] text-[#4b934b]">
                <Icon
                  name="check"
                  size={15}
                />
                저장되었습니다.
              </span>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => saveDNA()}
              className="flex items-center gap-2 rounded-lg border border-[#d8d3e8] bg-white px-4 py-2.5 text-[12px] font-medium text-[#5b4b76] transition hover:border-[#6246df] hover:text-[#5035dc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon
                name="save"
                size={15}
              />

              {saving ? '저장 중...' : '설정 저장'}
            </button>
          </div>
        </div>
      </main>

      {/* =========================================================
          ADD DNA RULE MODAL
      ========================================================= */}
      {showRuleModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-5 backdrop-blur-[1px]">
          <div className="w-full max-w-120 rounded-2xl border border-[#e3e0e7] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-[#302b30]">
                  새로운 DNA 규칙 추가
                </h3>

                <p className="mt-1 text-[12px] text-[#898286]">
                  메시지 생성 시 AI가 참고할 커뮤니케이션 규칙입니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="text-[#777] transition hover:text-[#333]"
              >
                <Icon
                  name="close"
                  size={19}
                />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold text-[#5e575b]">
                  규칙 제목
                </span>

                <input
                  value={newRuleTitle}
                  onChange={(event) =>
                    setNewRuleTitle(event.target.value)
                  }
                  placeholder="예: 회의 보고 방식"
                  className="h-11 w-full rounded-lg border border-[#ddd9df] px-3 text-[13px] outline-none focus:border-[#6246df] focus:ring-2 focus:ring-[#6246df]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-semibold text-[#5e575b]">
                  규칙 설명
                </span>

                <textarea
                  value={newRuleDescription}
                  onChange={(event) =>
                    setNewRuleDescription(event.target.value)
                  }
                  placeholder="AI가 메시지를 작성할 때 적용할 규칙을 입력하세요."
                  className="h-30 w-full resize-none rounded-lg border border-[#ddd9df] p-3 text-[13px] leading-5 outline-none focus:border-[#6246df] focus:ring-2 focus:ring-[#6246df]/10"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRuleModal(false)}
                className="rounded-lg border border-[#ddd9df] bg-white px-4 py-2.5 text-[12px] text-[#666]"
              >
                취소
              </button>

              <button
                type="button"
                onClick={addNewRule}
                className="rounded-lg bg-[#5035dc] px-5 py-2.5 text-[12px] font-semibold text-white"
              >
                규칙 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          EDIT RULES MODAL
      ========================================================= */}
      {showEditRulesModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 p-5 backdrop-blur-[1px]">
          <div className="max-h-[85vh] w-full max-w-155 overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eeeef1] px-6 py-5">
              <div>
                <h3 className="text-[17px] font-bold text-[#302b30]">
                  커뮤니케이션 규칙 편집
                </h3>

                <p className="mt-1 text-[12px] text-[#898286]">
                  AI가 메시지를 생성할 때 적용할 규칙을 관리합니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditRulesModal(false)}
                className="text-[#777]"
              >
                <Icon
                  name="close"
                  size={19}
                />
              </button>
            </div>

            <div className="max-h-[58vh] space-y-4 overflow-y-auto p-6">
              {editingRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-[#ded9e7] p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#756d79]">
                      규칙 {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeEditingRule(rule.id)}
                      className="text-[11px] text-[#b85a67] hover:underline"
                    >
                      삭제
                    </button>
                  </div>

                  <input
                    value={rule.title}
                    onChange={(event) =>
                      updateEditingRule(
                        rule.id,
                        'title',
                        event.target.value,
                      )
                    }
                    className="h-10 w-full rounded-lg border border-[#ddd9df] px-3 text-[13px] font-semibold outline-none focus:border-[#6246df]"
                  />

                  <textarea
                    value={rule.description}
                    onChange={(event) =>
                      updateEditingRule(
                        rule.id,
                        'description',
                        event.target.value,
                      )
                    }
                    className="mt-2 h-24 w-full resize-none rounded-lg border border-[#ddd9df] p-3 text-[12px] leading-5 outline-none focus:border-[#6246df]"
                  />
                </div>
              ))}

              {editingRules.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#d8d1df] py-10 text-center text-[12px] text-[#999]">
                  등록된 규칙이 없습니다.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-[#eeeef1] px-6 py-4">
              <button
                type="button"
                onClick={() => setShowEditRulesModal(false)}
                className="rounded-lg border border-[#ddd9df] px-4 py-2.5 text-[12px] text-[#666]"
              >
                취소
              </button>

              <button
                type="button"
                onClick={saveEditedRules}
                className="rounded-lg bg-[#5035dc] px-5 py-2.5 text-[12px] font-semibold text-white"
              >
                변경사항 적용
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

