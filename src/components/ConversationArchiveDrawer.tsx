import { useEffect, useMemo, useState } from 'react'
import type { Conversation } from '../users/conversationArchive'
import { useConversations } from '../users/useConversations'

type ConversationArchiveDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

export function ConversationArchiveDrawer({ isOpen, onClose }: ConversationArchiveDrawerProps) {
  const { conversations, isLoading, errorMessage, removeConversation } = useConversations(isOpen)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  const filteredConversations = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase('ko-KR')
    if (!keyword) return conversations
    return conversations.filter((conversation) => (
      conversation.title.toLocaleLowerCase('ko-KR').includes(keyword)
      || conversation.messages.some(({ content }) => content.toLocaleLowerCase('ko-KR').includes(keyword))
    ))
  }, [conversations, searchTerm])

  const selectedConversation = conversations.find(({ id }) => id === selectedId) ?? null

  const handleDelete = async (conversation: Conversation) => {
    if (!window.confirm(`“${conversation.title}” 대화를 삭제하시겠습니까?`)) return
    await removeConversation(conversation.id)
    if (selectedId === conversation.id) setSelectedId(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onMouseDown={onClose}>
      <aside role="dialog" aria-modal="true" aria-labelledby="archive-title" onMouseDown={(event) => event.stopPropagation()} className="ml-auto flex h-full w-full max-w-180 flex-col bg-[#f8f9fc] shadow-[-12px_0_30px_rgba(0,0,0,0.12)]">
        <header className="flex items-start justify-between border-b border-[#e1e1e5] bg-white px-6 py-5">
          <div><h2 id="archive-title" className="text-lg font-semibold">대화 보관함</h2><p className="mt-1 text-xs text-[#777981]">지금까지 진행한 대화를 한곳에서 확인할 수 있습니다.</p></div>
          <button type="button" onClick={onClose} aria-label="대화 보관함 닫기" className="flex h-8 w-8 items-center justify-center rounded-md text-xl text-[#777981] hover:bg-[#f2f2f4]">×</button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] max-md:grid-cols-1">
          <section className={`${selectedConversation ? 'max-md:hidden' : ''} flex min-h-0 flex-col border-r border-[#e1e1e5] bg-white`} aria-label="대화 목록">
            <div className="border-b border-[#eeeeef] p-4">
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="search" placeholder="대화 제목이나 내용 검색" className="h-10 w-full rounded-lg border border-[#d9d9df] px-3 text-xs outline-none focus:border-[#5b3df5] focus:ring-2 focus:ring-[#5b3df5]/10" />
              <p className="mt-2 text-[11px] text-[#85878e]">총 {filteredConversations.length}개의 대화</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {isLoading ? <p className="py-10 text-center text-xs text-[#85878e]">대화 목록을 불러오는 중입니다.</p> : errorMessage ? <p className="py-10 text-center text-xs text-[#d44c4c]">{errorMessage}</p> : filteredConversations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d7d7dc] px-4 py-10 text-center"><p className="text-sm font-medium">저장된 대화가 없습니다.</p><p className="mt-2 text-xs leading-5 text-[#85878e]">새로운 대화를 시작하면<br />이곳에 차곡차곡 저장됩니다.</p></div>
              ) : (
                <ul className="space-y-2">{filteredConversations.map((conversation) => (
                  <li key={conversation.id}><button type="button" onClick={() => setSelectedId(conversation.id)} className={`w-full rounded-lg border p-3 text-left transition ${selectedId === conversation.id ? 'border-[#6a54ee] bg-[#efedff]' : 'border-[#e1e1e5] hover:bg-[#fafaff]'}`}>
                    <p className="truncate text-xs font-semibold">{conversation.title || '제목 없는 대화'}</p>
                    <p className="mt-1 text-[10px] text-[#7a7c84]">{formatDate(conversation.updatedAt)} · 메시지 {conversation.messages.length}개</p>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-[#686870]">{conversation.messages.at(-1)?.content || '대화 내용이 없습니다.'}</p>
                  </button></li>
                ))}</ul>
              )}
            </div>
          </section>

          <section className={`${selectedConversation ? 'flex' : 'hidden md:flex'} min-h-0 flex-col`} aria-label="선택한 대화 내용">
            {selectedConversation ? <>
              <div className="flex items-center justify-between gap-3 border-b border-[#e1e1e5] bg-white px-5 py-4">
                <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setSelectedId(null)} className="hidden rounded-md px-2 py-1 text-sm hover:bg-[#f2f2f4] max-md:block" aria-label="대화 목록으로 돌아가기">←</button><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{selectedConversation.title || '제목 없는 대화'}</h3><p className="mt-1 text-[10px] text-[#7a7c84]">{formatDate(selectedConversation.updatedAt)}</p></div></div>
                <button type="button" onClick={() => void handleDelete(selectedConversation)} className="shrink-0 rounded-md border border-[#e8b1b1] px-3 py-2 text-[10px] font-semibold text-[#d44c4c] hover:bg-[#fff0f0]">대화 삭제</button>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">{selectedConversation.messages.map((message, index) => (
                <article key={`${selectedConversation.id}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-5 ${message.role === 'user' ? 'bg-[#5b3df5] text-white' : 'border border-[#e1e1e5] bg-white text-[#292524]'}`}><p className="mb-1 text-[10px] font-semibold opacity-70">{message.role === 'user' ? '나' : 'AI'}</p><p className="whitespace-pre-wrap break-words">{message.content}</p></div></article>
              ))}</div>
            </> : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-[#85878e]"><span className="text-4xl" aria-hidden="true">▤</span><p className="mt-4 text-sm font-medium text-[#4a4b52]">대화를 선택해 주세요.</p><p className="mt-2 text-xs">왼쪽 목록에서 저장된 대화를 선택하면 전체 내용을 볼 수 있습니다.</p></div>
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}

function formatDate(date: string) {
  const parsedDate = new Date(date)
  return Number.isNaN(parsedDate.getTime()) ? '날짜 정보 없음' : parsedDate.toLocaleString('ko-KR')
}
