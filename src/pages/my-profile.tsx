import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile, resetUserProfile } from '../users/userProfile'

function Icon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}

function MyProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(getUserProfile)
  const [isPublic, setIsPublic] = useState(true)
  const preferences = profile.communicationPreferences
  const cards = [
    ['선호 문체', preferences.includes('concise') ? '간결한 편' : preferences.includes('detailed') ? '자세한 편' : '균형 잡힌 문체'],
    ['정보 순서', preferences.includes('conclusion') ? '결론 → 근거 → 요청사항' : preferences.includes('context') ? '맥락 → 결론' : '핵심 내용 중심'],
    ['선호 톤', preferences.includes('polite') ? '정중하지만 직접적으로' : preferences.includes('casual') ? '편안하고 친근하게' : '상황에 맞는 톤'],
    ['상세 수준', preferences.includes('detailed') ? '상세 중심' : preferences.includes('concise') ? '핵심 중심' : '적절한 상세 수준'],
  ]
  const initials = profile.name.trim().slice(0, 1) || '나'

  const handleReset = () => {
    if (window.confirm('저장된 프로필과 학습 데이터를 초기화할까요?')) {
      resetUserProfile()
      setProfile(getUserProfile())
    }
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#f8f9fc] px-8 pt-7.75 pb-8 text-[#292524]" style={{ fontFamily: 'Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="mx-auto w-full max-w-244">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold leading-[31.2px]">마이페이지</h1>
          <p className="mt-0.75 text-base leading-[25.6px] text-[#564334]">나의 프로필과 커뮤니케이션 스타일을 관리하세요.</p>
        </header>

        <div className="grid grid-cols-[312px_minmax(0,1fr)] gap-5 max-xl:grid-cols-1">
          <div className="flex flex-col gap-5">
            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6">
              <div className="flex flex-col items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#5b3df5] text-[38px] font-semibold text-white">{initials}</div>
                <strong className="mt-4 text-base">{profile.name}</strong>
                <span className="text-xs text-[#7b736e]">{profile.role || 'Administrator'}</span>
                <button onClick={() => navigate('/profile-setup')} className="mt-3 h-[35px] w-full rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] text-xs hover:bg-[#4338ca26]">프로필 수정</button>
              </div>
              <dl className="mt-4 space-y-2 border-t border-[#d5d5d5] pt-6 text-xs">
                {[['이메일', profile.email], ['회사', profile.company], ['직무', profile.role], ['직급', profile.position]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd className="truncate text-right">{value || '-'}</dd></div>)}
              </dl>
            </section>

            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6">
              <h2 className="pb-1 text-lg leading-[25.2px]">내 데이터 관리</h2>
              <button className="mt-4 flex h-10 w-full items-center justify-between text-sm hover:text-[#4338ca]"><span className="flex items-center gap-2"><Icon><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></Icon>학습 데이터 확인</span><span>›</span></button>
              <button onClick={handleReset} className="flex h-10 w-full items-center justify-between text-sm text-[#ba1a1a] hover:opacity-70"><span className="flex items-center gap-2"><Icon><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></Icon>데이터 초기화/삭제</span><span className="text-[#777]">›</span></button>
              <div className="mt-4 flex min-h-14.5 items-center justify-between border-t border-[#eee] pt-4 text-sm"><span className="flex items-center gap-2"><Icon><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></Icon>프로필 공개 범위</span><button onClick={() => setIsPublic((value) => !value)} className="rounded-full bg-[#ffdcc3] px-2 py-1 text-xs text-[#904d00]">{isPublic ? '사내 공개' : '비공개'}</button></div>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6">
              <div className="flex h-8.75 items-start justify-between border-b border-[#d5d5d5]">
                <h2 className="flex items-center gap-2 text-lg font-medium"><Icon className="text-[#4338ca]"><path d="M9 18h6M10 22h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2Z"/></Icon>나의 커뮤니케이션 프로파일</h2>
                <span className="rounded-md bg-[#ffdcc3] px-2 py-1 text-[11px] text-[#904d00]">학습 데이터 84개</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 max-md:grid-cols-1">
                {cards.map(([label, value]) => <div key={label} className="min-h-20 rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] p-4"><p className="text-xs font-medium text-[#4338ca]">{label}</p><p className="mt-1 text-sm">{value}</p></div>)}
              </div>
              {profile.customStyle && <p className="mt-3 rounded-lg bg-[#f8f7ff] p-3 text-xs text-[#675f5a]">추가 스타일: {profile.customStyle}</p>}
              <div className="mt-4 rounded-lg px-4 pt-6 pb-4">
                <div className="flex justify-between text-xs"><span>AI 스타일 모델 완성도</span><strong className="text-[#4338ca]">84%</strong></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ddc1ae4d]"><div className="h-full w-[84%] rounded-full bg-[#4338ca]" /></div>
                <p className="pt-3 text-xs text-[#786f69]">최근 30일 동안 작성한 메시지 데이터를 기반으로 프로파일이 최적화되었습니다.</p>
                <div className="pt-3 text-right"><button className="h-8 rounded-lg bg-[#4338ca] px-4 text-xs text-white shadow-sm">학습 데이터 관리 →</button></div>
              </div>
            </section>

            <section className="rounded-xl border border-[#d5d5d5] bg-white p-6">
              <h2 className="flex h-8.75 items-start gap-2 border-b border-[#d5d5d5] text-lg font-medium">
                <Icon className="text-[#4338ca]"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3M2 21h20"/>
                </Icon>최근 활동 및 성과</h2>
              <div className="mt-4 grid grid-cols-3 gap-4 max-md:grid-cols-1">
                {[['평균 메시지 적합도', '91', '%'], 
                ['이번 달 최적화 메시지', '24', '개'], 
                ['가장 많이 협업한 직군', profile.role || '디자이너', '']].map(([label, value, unit]) => <div key={label} 
                className="flex h-32 flex-col justify-between rounded-lg border border-[#d5d5d5] bg-[#4338ca1a] p-4"><p 
                className="text-xs text-[#736b66]">{label}</p><p className="text-[28px] font-semibold">{value}
                <span className="ml-1 text-xs font-normal text-[#736b66]">{unit}</span></p></div>)}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyProfilePage