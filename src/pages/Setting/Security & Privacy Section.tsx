import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
const ACCOUNT_KEYS = [
  'ieum.accounts',
  'ieum.userProfile',
  'ieum.accountPassword',
]

function SecurityPrivacySection() {
  const navigate = useNavigate()

  const resetData = () => {
    if (!window.confirm('모든 활동 및 학습 데이터를 정말 삭제하시겠습니까?')) return

    getAppStorageKeys()
      .filter((key) => !ACCOUNT_KEYS.includes(key))
      .forEach((key) => localStorage.removeItem(key))

    window.alert('활동 및 학습 데이터가 초기화되었습니다.')
  }

  const deleteAccount = () => {
    if (!window.confirm('계정을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    localStorage.clear()
    sessionStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <section id="security" className="min-h-116.75 scroll-mt-8 rounded-xl border border-[#e1e1e1] bg-white p-6 shadow-sm">
      <h2 className="text-[16px] font-semibold">보안 및 개인정보</h2>
      <p className="mt-1 text-[12px] text-[#777981]">데이터 보안과 계정 및 개인정보 관련 설정을 관리합니다.</p>

      <div className="mt-6">
        <SecurityCard icon={<DownloadIcon />} title="개인 데이터 다운로드" onClick={downloadPersonalData}>
          프로필, 설정, 연동 및 대화를 JSON으로 다운로드
        </SecurityCard>
      </div>

      <div className="mt-7 border-t border-[#eeeeef] pt-6">
        <h3 className="text-[13px] font-semibold">계정 삭제 및 데이터 관리</h3>
        <p className="mt-1 text-[10px] text-[#7a7c84]">삭제 작업은 되돌릴 수 없으므로 신중하게 진행해주세요.</p>

        <DangerRow
          title="모든 데이터 삭제"
          description="계정은 유지하고 메시지, 학습 데이터와 서비스 설정을 초기화합니다."
          button="데이터 삭제"
          onClick={resetData}
        />
        <DangerRow
          title="계정 영구 삭제"
          description="계정과 모든 관련 데이터를 영구적으로 삭제합니다."
          button="계정 삭제"
          onClick={deleteAccount}
          strong
        />
      </div>
    </section>
  )
}

function SecurityCard({ icon, title, children, onClick }: {
  icon: ReactNode
  title: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-23 flex-col items-start rounded-lg border border-[#e1e1e5] p-4 text-left hover:bg-[#fafaff]">
      <span aria-hidden="true" className="flex h-6 items-start">{icon}</span>
      <span className="mt-2 text-[12px] font-medium">{title}</span>
      <span className="mt-1 text-[10px] text-[#7a7c84]">{children}</span>
    </button>
  )
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" width="16" height="24" viewBox="0 0 16 24" fill="none" className="shrink-0 text-[#241912]">
      <path d="M8 1.5v9M4.75 7.5 8 10.75l3.25-3.25M2.25 13.25v2.25h11.5v-2.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DangerRow({ title, description, button, onClick, strong = false }: {
  title: string
  description: string
  button: string
  onClick: () => void
  strong?: boolean
}) {
  return (
    <div className={`mt-3 flex min-h-16.5 items-center justify-between gap-4 rounded-lg border px-4 py-3 ${strong ? 'border-[#ee8f8f] bg-[#fff7f7]' : 'border-[#f3b6b6] bg-[#fffafa]'}`}>
      <div>
        <p className={`text-[12px] font-medium ${strong ? 'text-[#d34848]' : ''}`}>{title}</p>
        <p className="mt-1 text-[10px] text-[#8a7777]">{description}</p>
      </div>
      <button type="button" onClick={onClick} className={`shrink-0 rounded-md px-3 py-2 text-[10px] font-semibold ${strong ? 'bg-[#d53535] text-white hover:bg-[#bb2929]' : 'border border-[#e36a6a] text-[#d44c4c] hover:bg-[#fff0f0]'}`}>
        {button}
      </button>
    </div>
  )
}

function getAppStorageKeys() {
  return Object.keys(localStorage).filter((key) => key.startsWith('ieum.') || key.startsWith('onboarding.'))
}

function downloadPersonalData() {
  const data = getAppStorageKeys().reduce<Record<string, unknown>>((result, key) => {
    if (key === 'ieum.accountPassword' || key === 'ieum.accounts') {
      return result
    }

    const value = localStorage.getItem(key)
    if (value === null) return result

    try {
      result[key] = JSON.parse(value)
    } catch {
      result[key] = value
    }
    return result
  }, {})

  const exportData = {
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    data,
  }
  const file = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8' })
  const fileUrl = URL.createObjectURL(file)
  const link = document.createElement('a')

  link.href = fileUrl
  link.download = `ieum-personal-data-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(fileUrl)
}

export default SecurityPrivacySection