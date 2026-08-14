import { useEffect } from 'react'
import { normalizeAnalysisConfidence, type Conversation } from '../users/conversationArchive'
import { useConversations } from '../users/useConversations'

type ConversationLearningDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

const analysisStatus = {
  pending: { label: '분석 대기', className: 'bg-[#f1f1f3] text-[#6f7078]' },
  analyzing: { label: '분석 중', className: 'bg-[#fff0d9] text-[#9a5b00]' },
  completed: { label: '분석 완료', className: 'bg-[#e9f8ef] text-[#247347]' },
  failed: { label: '분석 실패', className: 'bg-[#fff0f0] text-[#c23e3e]' },
} as const

export function ConversationLearningDrawer({ isOpen, onClose }: ConversationLearningDrawerProps) {
  const { conversations, isLoading, errorMessage, removeConversation } = useConversations(isOpen)
  const completedCount = conversations.filter(({ analysisStatus: status, styleAnalysis }) => status === 'completed' && styleAnalysis).length
  const waitingCount = conversations.length - completedCount

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  const handleDelete = async (conversation: Conversation) => {
    if (!window.confirm(`“${conversation.title}” 대화를 학습 데이터에서 삭제하시겠습니까?`)) return
    await removeConversation(conversation.id)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onMouseDown={onClose}>
      <aside role="dialog" aria-modal="true" aria-labelledby="learning-manager-title" onMouseDown={(event) => event.stopPropagation()} className="ml-auto flex h-full w-full max-w-180 flex-col bg-[#f8f9fc] shadow-[-12px_0_30px_rgba(0,0,0,0.12)]">
        <header className="border-b border-[#e1e1e5] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id="learning-manager-title" className="text-lg font-semibold">학습 데이터 관리</h2><p className="mt-1 text-xs text-[#777981]">대화별 커뮤니케이션 스타일 분석 결과를 확인하고 관리합니다.</p></div>
            <button type="button" onClick={onClose} aria-label="학습 데이터 관리 닫기" className="flex h-8 w-8 items-center justify-center rounded-md text-xl text-[#777981] hover:bg-[#f2f2f4]">×</button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <SummaryCard label="전체 대화" value={conversations.length} unit="개" />
            <SummaryCard label="분석 완료" value={completedCount} unit="개" />
            <SummaryCard label="분석 대기" value={waitingCount} unit="개" />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isLoading ? <p className="py-16 text-center text-sm text-[#85878e]">분석 데이터를 불러오는 중입니다.</p> : errorMessage ? <p className="py-16 text-center text-sm text-[#d44c4c]">{errorMessage}</p> : conversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d7d7dc] bg-white px-6 py-16 text-center"><p className="text-sm font-medium">분석할 대화가 없습니다.</p><p className="mt-2 text-xs text-[#85878e]">대화를 시작하면 AI가 커뮤니케이션 스타일을 분석합니다.</p></div>
          ) : (
            <ul className="space-y-3">{conversations.map((conversation) => <ConversationAnalysisCard key={conversation.id} conversation={conversation} onDelete={() => void handleDelete(conversation)} />)}</ul>
          )}
        </div>
      </aside>
    </div>
  )
}

function ConversationAnalysisCard({ conversation, onDelete }: { conversation: Conversation; onDelete: () => void }) {
  const statusKey = conversation.analysisStatus ?? (conversation.styleAnalysis ? 'completed' : 'pending')
  const status = analysisStatus[statusKey]
  const analysis = conversation.styleAnalysis
  const confidence = normalizeAnalysisConfidence(analysis?.confidence ?? 0)

  return (
    <li className="rounded-xl border border-[#dfdfe4] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold">{conversation.title || '제목 없는 대화'}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${status.className}`}>{status.label}</span></div><p className="mt-1 text-[10px] text-[#7a7c84]">{formatDate(conversation.updatedAt)} · 메시지 {conversation.messages.length}개</p></div>
        <button type="button" onClick={onDelete} className="shrink-0 rounded-md border border-[#e8b1b1] px-3 py-2 text-[10px] font-semibold text-[#d44c4c] hover:bg-[#fff0f0]">삭제</button>
      </div>

      {analysis ? <>
        <dl className="mt-4 grid grid-cols-2 gap-2 max-sm:grid-cols-1">
          <AnalysisItem label="문체" value={analysis.writingStyle} />
          <AnalysisItem label="대화 톤" value={analysis.tone} />
          <AnalysisItem label="정보 순서" value={analysis.informationOrder} />
          <AnalysisItem label="상세 수준" value={analysis.detailLevel} />
        </dl>
        <div className="mt-4"><div className="flex justify-between text-[11px]"><span className="text-[#686870]">분석 신뢰도</span><strong className="text-[#4338ca]">{confidence}%</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eceaf8]" role="progressbar" aria-label={`${conversation.title} 분석 신뢰도`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={confidence}><div className="h-full rounded-full bg-[#5b3df5] transition-[width] duration-500" style={{ width: `${confidence}%` }} /></div></div>
      </> : <div className="mt-4 rounded-lg bg-[#f7f7f9] px-4 py-5 text-center"><p className="text-xs font-medium text-[#666872]">아직 스타일 분석 결과가 없습니다.</p><p className="mt-1 text-[10px] text-[#8a8c93]">백엔드 분석이 완료되면 문체와 대화 성향이 이곳에 표시됩니다.</p></div>}
    </li>
  )
}

function SummaryCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <div className="rounded-lg border border-[#e1e1e5] bg-[#fafaff] px-4 py-3"><p className="text-[10px] text-[#777981]">{label}</p><p className="mt-1 text-lg font-semibold">{value}<span className="ml-1 text-[10px] font-normal text-[#777981]">{unit}</span></p></div>
}

function AnalysisItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-[#e5e3f3] bg-[#f8f7ff] px-3 py-2"><dt className="text-[10px] font-medium text-[#5b3df5]">{label}</dt><dd className="mt-1 text-xs text-[#34343a]">{value || '분석 정보 없음'}</dd></div>
}

function formatDate(date: string) {
  const parsedDate = new Date(date)
  return Number.isNaN(parsedDate.getTime()) ? '날짜 정보 없음' : parsedDate.toLocaleString('ko-KR')
}
