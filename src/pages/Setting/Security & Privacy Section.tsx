import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type Conversation = {
  id: string
  title: string
  updatedAt: string
  messages: { role: 'user' | 'assistant'; content: string }[]
}

const CONVERSATIONS_KEY = 'ieum.conversations'
const ACCOUNT_KEYS = ['ieum.userProfile', 'ieum.accountPassword']

function SecurityPrivacySection() {
  const navigate = useNavigate()
  const [showConversations, setShowConversations] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(getConversations)

  const deleteConversation = (conversation: Conversation) => {
    if (!window.confirm(`“${conversation.title}” 대화를 삭제하시겠습니까?`)) return

    const remainingConversations = conversations.filter((item) => item.id !== conversation.id)
    setConversations(remainingConversations)
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(remainingConversations))
  }

  const resetData = () => {
    if (!window.confirm('모든 활동 및 학습 데이터를 정말 삭제하시겠습니까?')) return

    getAppStorageKeys()
      .filter((key) => !ACCOUNT_KEYS.includes(key))
      .forEach((key) => localStorage.removeItem(key))

    setConversations([])
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

      <div className="mt-6 grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <SecurityCard icon="▣" title="내 학습 데이터 관리" onClick={() => setShowConversations(true)}>
          지금까지 생성된 대화 목록을 확인하고 관리
        </SecurityCard>
        <SecurityCard icon="⇩" title="개인 데이터 다운로드" onClick={downloadPersonalData}>
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

      {showConversations && (
        <ConversationDialog
          conversations={conversations}
          onDelete={deleteConversation}
          onClose={() => setShowConversations(false)}
        />
      )}
    </section>
  )
}

function SecurityCard({ icon, title, children, onClick }: {
  icon: string
  title: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-23 flex-col items-start rounded-lg border border-[#e1e1e5] p-4 text-left hover:bg-[#fafaff]">
      <span aria-hidden="true">{icon}</span>
      <span className="mt-2 text-[12px] font-medium">{title}</span>
      <span className="mt-1 text-[10px] text-[#7a7c84]">{children}</span>
    </button>
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

function ConversationDialog({ conversations, onDelete, onClose }: {
  conversations: Conversation[]
  onDelete: (conversation: Conversation) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="conversation-title" onMouseDown={(event) => event.stopPropagation()} className="flex max-h-[75vh] w-full max-w-140 flex-col rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="conversation-title" className="text-[16px] font-semibold">내 학습 데이터</h3>
            <p className="mt-1 text-[11px] text-[#777981]">메시지 작성 과정에서 생성된 대화 목록입니다.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="rounded-md px-2 py-1 text-[#777981] hover:bg-[#f2f2f4]">×</button>
        </div>

        <div className="mt-5 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#d7d7dc] px-5 py-10 text-center">
              <p className="text-[13px] font-medium">저장된 대화가 없습니다.</p>
              <p className="mt-1 text-[11px] text-[#85878e]">메시지 기능에서 대화를 시작하면 이곳에 표시됩니다.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="flex items-center gap-3 rounded-lg border border-[#e1e1e5] p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{conversation.title}</p>
                    <p className="mt-1 text-[10px] text-[#7a7c84]">{formatDate(conversation.updatedAt)} · 메시지 {conversation.messages.length}개</p>
                  </div>
                  <button type="button" onClick={() => onDelete(conversation)} className="shrink-0 rounded-md border border-[#e8b1b1] px-3 py-2 text-[10px] font-semibold text-[#d44c4c] hover:bg-[#fff0f0]">삭제</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function getConversations(): Conversation[] {
  try {
    const savedData = localStorage.getItem(CONVERSATIONS_KEY)
    return savedData ? JSON.parse(savedData) : []
  } catch {
    return []
  }
}

function getAppStorageKeys() {
  return Object.keys(localStorage).filter((key) => key.startsWith('ieum.') || key.startsWith('onboarding.'))
}

function downloadPersonalData() {
  const data = getAppStorageKeys().reduce<Record<string, unknown>>((result, key) => {
    if (key === 'ieum.accountPassword') return result

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

function formatDate(date: string) {
  const parsedDate = new Date(date)
  return Number.isNaN(parsedDate.getTime()) ? '날짜 정보 없음' : parsedDate.toLocaleString('ko-KR')
}

export default SecurityPrivacySection
