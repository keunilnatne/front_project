import { useState, type ReactNode } from 'react'
import PageHeader from '../components/PageHeader'
import { ConversationArchiveDrawer } from '../components/ConversationArchiveDrawer'
import { ConversationLearningDrawer } from '../components/ConversationLearningDrawer'
import { resetProfileAnalytics } from '../users/profileAnalytics'
import { getUserProfile, saveUserProfile, resetUserProfile } from '../users/userProfile'
import { useProfileAnalytics } from '../users/useProfileAnalytics'

const allPreferences = [
  ['concise', '간결하게'],
  ['detailed', '자세하게'],
  ['conclusion', '결론부터'],
  ['context', '맥락부터'],
  ['polite', '정중하게'],
  ['casual', '편하게'],
] as const

function Icon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}

function MyProfilePage() {
  const [profile, setProfile] = useState(getUserProfile)
  const [isPublic, setIsPublic] = useState(true)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isLearningManagerOpen, setIsLearningManagerOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [editName, setEditName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [editPreferences, setEditPreferences] = useState<string[]>([])
  const [editCustomStyle, setEditCustomStyle] = useState('')

  const analytics = useProfileAnalytics()
  const preferences = profile.communicationPreferences
  const hasPreferences = preferences.length > 0

  const openEditModal = () => {
    const p = getUserProfile()
    setEditName(p.name || '')
    setEditCompany(p.company || '')
    setEditRole(p.role || '')
    setEditPosition(p.position || '')
    setEditPreferences(p.communicationPreferences || [])
    setEditCustomStyle(p.customStyle || '')
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveUserProfile({
      name: editName.trim(),
      company: editCompany.trim(),
      role: editRole.trim(),
      position: editPosition.trim(),
      communicationPreferences: editPreferences,
      customStyle: editCustomStyle.trim(),
    })
    setProfile(getUserProfile())
    setIsEditModalOpen(false)
  }

  const togglePref = (id: string) => {
    setEditPreferences((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const cards = [
    [
      '선호 문체',
      hasPreferences
        ? preferences.includes('concise') ? '간결한 편' : '자세한 편'
        : '미설정',
    ],
    [
      '정보 순서',
      hasPreferences
        ? preferences.includes('conclusion') ? '결론 → 근거 → 요청사항' : '맥락 → 결론'
        : '미설정',
    ],
    [
      '선호 톤',
      hasPreferences
        ? preferences.includes('polite') ? '정중하지만 직접적으로' : '편안하고 친근하게'
        : '미설정',
    ],
    [
      '상세 수준',
      hasPreferences
        ? preferences.includes('detailed') ? '상세 중심' : '핵심 중심'
        : '미설정',
    ],
  ]
  const initials = profile.name.trim().slice(0, 1) || '나'

  const handleReset = async () => {
    if (window.confirm('저장된 프로필과 학습 데이터를 초기화할까요?')) {
      await resetProfileAnalytics()
      resetUserProfile()
      setProfile(getUserProfile())
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#f8f9fc] text-[#292524]" style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <PageHeader />

      <div className="mx-auto w-full max-w-244 px-8 pt-7.75 pb-16">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold leading-[31.2px]">마이페이지</h1>
          <p className="mt-0.75 text-base leading-[25.6px] text-[#564334]">나의 프로필과 커뮤니케이션 스타일을 관리하세요.</p>
        </header>

        <div className="grid grid-cols-[312px_minmax(0,1fr)] gap-5 max-xl:grid-cols-1">
          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6 shadow-xs">
              <div className="flex flex-col items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#5b3df5] text-[38px] font-semibold text-white shadow-sm">{initials}</div>
                <strong className="mt-4 text-base">{profile.name || '이름 미설정'}</strong>
                <span className="text-xs text-[#7b736e]">{profile.role || '직무 미설정'}</span>
                <button
                  type="button"
                  onClick={openEditModal}
                  className="mt-3 h-[35px] w-full rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] text-xs font-semibold text-[#4338ca] transition hover:bg-[#4338ca26]"
                >
                  프로필 수정
                </button>
              </div>
              <dl className="mt-4 space-y-2 border-t border-[#d5d5d5] pt-6 text-xs">
                {[['이메일', profile.email], ['회사', profile.company], ['직무', profile.role], ['직급', profile.position]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-[#888]">{label}</dt><dd className="truncate text-right font-medium">{value || '-'}</dd></div>)}
              </dl>
            </section>

            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6 shadow-xs">
              <h2 className="pb-1 text-lg leading-[25.2px] font-semibold">내 데이터 관리</h2>
              <button type="button" onClick={() => setIsArchiveOpen(true)} className="mt-4 flex h-10 w-full items-center justify-between text-sm hover:text-[#4338ca]">
                <span className="flex items-center gap-2"><Icon><ellipse cx="12" cy="6" rx="7" ry="3"/>
                <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></Icon>학습 데이터 확인</span><span>›</span></button>
              <button onClick={handleReset} className="flex h-10 w-full items-center justify-between text-sm text-[#ba1a1a] hover:opacity-70">
                <span className="flex items-center gap-2"><Icon><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></Icon>데이터 초기화/삭제</span>
                <span className="text-[#777]">›</span></button>
              <div className="mt-4 flex min-h-14.5 items-center justify-between border-t border-[#eee] pt-4 text-sm">
                <span className="flex items-center gap-2"><Icon><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>
                </Icon>프로필 공개 범위</span><button onClick={() => setIsPublic((value) => !value)} 
                className="rounded-full bg-[#ffdcc3] px-2 py-1 text-xs font-semibold text-[#904d00]">{isPublic ? '사내 공개' : '비공개'}</button></div>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6 shadow-xs">
              <div className="flex h-8.75 items-start justify-between border-b border-[#d5d5d5]">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon className="text-[#4338ca]">
                  <path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/></Icon>나의 커뮤니케이션 프로파일</h2>
                <span className="rounded-md bg-[#ffdcc3] px-2 py-1 text-[11px] font-semibold text-[#904d00]">
                  학습 데이터 {analytics.analyzedMessageCount}개</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 max-md:grid-cols-1">
                {cards.map(([label, value]) => <div key={label} className="min-h-20 rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] p-4"><p 
                className="text-xs font-semibold text-[#4338ca]">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>)}
              </div>
              {profile.customStyle && <p className="mt-3 rounded-lg bg-[#f8f7ff] p-3 text-xs text-[#675f5a]">
                추가 스타일: {profile.customStyle}</p>}
              <div className="mt-4 rounded-lg px-4 pt-6 pb-4">
                <div className="flex justify-between text-xs"><span>AI 스타일 모델 완성도</span>
                <strong className="text-[#4338ca]">{analytics.modelCompleteness}%</strong></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ddc1ae4d]" role="progressbar" 
                aria-label="AI 스타일 모델 완성도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analytics.modelCompleteness}>
                  <div className="h-full rounded-full bg-[#4338ca] transition-[width] duration-500 ease-out" 
                  style={{ width: `${analytics.modelCompleteness}%` }} />
                </div>
                <p className="pt-3 text-xs text-[#786f69]">{analytics.analyzedMessageCount === 0 ? 
                '대화 데이터가 쌓이면 AI가 커뮤니케이션 스타일을 분석합니다.' : '최근 30일 동안 작성한 메시지 데이터를 기반으로 프로파일이 최적화되었습니다.'}</p>
                <div className="pt-3 text-right">
                  <button type="button" onClick={() => setIsLearningManagerOpen(true)} className="h-8 rounded-lg bg-[#4338ca] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#35248f]">학습 데이터 관리 →</button></div>
              </div>
            </section>

            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6 shadow-xs">
              <h2 className="flex h-8.75 items-start gap-2 border-b border-[#d5d5d5] text-lg font-semibold">
                <Icon className="text-[#4338ca]"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3M2 21h20"/>
                </Icon>최근 활동 및 성과</h2>
              <div className="mt-4 grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div className="flex h-32 flex-col justify-between rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-[#736b66]">평균 메시지 적합도</p>
                    <span className="cursor-help text-[11px] text-[#888] hover:text-[#5531e8]" title="AI 최적화가 성공한 메시지의 문맥 일치도, 톤앤매너 적합도, 수신자 맞춤성을 종합 평가한 점수입니다.">ⓘ</span>
                  </div>
                  <p className="text-[28px] font-semibold">{analytics.averageMessageFit}<span className="ml-1 text-xs font-normal text-[#736b66]">%</span></p>
                </div>
                <div className="flex h-32 flex-col justify-between rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] p-4">
                  <p className="text-xs font-medium text-[#736b66]">이번 달 최적화 메시지</p>
                  <p className="text-[28px] font-semibold">{analytics.optimizedMessageCount}<span className="ml-1 text-xs font-normal text-[#736b66]">개</span></p>
                </div>
                <div className="flex h-32 flex-col justify-between rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] p-4">
                  <p className="text-xs font-medium text-[#736b66]">가장 많이 협업한 직군</p>
                  <p className="text-[24px] font-semibold truncate" title={analytics.topCollaboratedRole || '현재 없음'}>{analytics.topCollaboratedRole || '현재 없음'}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 프로필 및 커뮤니케이션 스타일 전용 수정 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eee] pb-4 mb-4">
              <h2 className="text-[17px] font-bold text-[#222]">프로필 & 커뮤니케이션 스타일 수정</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#999] hover:text-[#333] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-semibold text-[#555] block mb-1">이름</span>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full h-9 rounded-lg border border-[#ddd] px-3 text-xs outline-none focus:border-[#5531e8]"
                  />
                </label>
                <label className="block">
                  <span className="font-semibold text-[#555] block mb-1">회사</span>
                  <input
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#ddd] px-3 text-xs outline-none focus:border-[#5531e8]"
                  />
                </label>
                <label className="block">
                  <span className="font-semibold text-[#555] block mb-1">직무</span>
                  <input
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#ddd] px-3 text-xs outline-none focus:border-[#5531e8]"
                  />
                </label>
                <label className="block">
                  <span className="font-semibold text-[#555] block mb-1">직급</span>
                  <input
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="w-full h-9 rounded-lg border border-[#ddd] px-3 text-xs outline-none focus:border-[#5531e8]"
                  />
                </label>
              </div>

              <div>
                <span className="font-semibold text-[#555] block mb-1.5">선호 소통 스타일</span>
                <div className="grid grid-cols-3 gap-2">
                  {allPreferences.map(([id, label]) => {
                    const active = editPreferences.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => togglePref(id)}
                        className={`h-9 rounded-lg border text-center transition font-medium ${
                          active
                            ? 'border-[#5531e8] bg-[#f0edff] text-[#5531e8] font-semibold'
                            : 'border-[#ddd] bg-white text-[#555] hover:bg-[#f7f7fa]'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#555] block mb-1">추가 스타일 / 어조</span>
                <textarea
                  value={editCustomStyle}
                  onChange={(e) => setEditCustomStyle(e.target.value)}
                  rows={2}
                  placeholder="예: 간결한 글머리 기호를 선호합니다."
                  className="w-full rounded-lg border border-[#ddd] p-2.5 text-xs outline-none focus:border-[#5531e8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-[#eee] pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-[#ddd] px-4 py-2 text-xs font-semibold text-[#666] hover:bg-[#f5f5f7]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#5531e8] px-5 py-2 text-xs font-semibold text-white hover:bg-[#4323cc]"
                >
                  저장 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConversationArchiveDrawer isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} />
      <ConversationLearningDrawer isOpen={isLearningManagerOpen} onClose={() => setIsLearningManagerOpen(false)} />
    </div>
  )
}

export default MyProfilePage