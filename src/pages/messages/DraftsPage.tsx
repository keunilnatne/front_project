import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'

type Draft = {
  id: string
  recipients?: Array<{ id: string; name: string; position: string; company: string }>
  subject: string
  body: string
  createdAt: string
}

export default function DraftsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const drafts = useMemo<Draft[]>(() => {
    try { return JSON.parse(localStorage.getItem('message-drafts') || '[]') } catch { return [] }
  }, [])
  const visible = drafts.filter((draft) => `${draft.subject} ${draft.body}`.toLowerCase().includes(search.toLowerCase()))

  return <div className="min-h-screen bg-[#f8f9fc]">
    <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} />
    <main className="px-8 pb-12 pt-8">
      <div className="mb-7 flex items-center justify-between">
        <div><h1 className="ieum-page-title text-[#27272d]">임시저장함</h1><p className="mt-1 text-[13px] text-[#87888f]">작성 중인 메시지를 다시 이어서 작성할 수 있습니다.</p></div>
        <button type="button" onClick={() => navigate('/messages')} className="rounded-lg bg-[#5531e8] px-4 py-2.5 text-[12px] font-semibold text-white">새 메시지</button>
      </div>
      {visible.length === 0 ? <div className="rounded-2xl border border-[#e7e7eb] bg-white px-6 py-16 text-center text-[13px] text-[#888]">저장된 임시 메시지가 없습니다.</div> : <div className="space-y-3">{visible.map((draft) => <button key={draft.id} type="button" onClick={() => navigate('/messages', { state: draft })} className="block w-full rounded-2xl border border-[#e7e7eb] bg-white p-5 text-left hover:border-[#cfc7ff]"><div className="flex items-center justify-between gap-4"><strong className="truncate text-[14px]">{draft.subject || '(제목 없음)'}</strong><span className="shrink-0 text-[10px] text-[#999]">{new Date(draft.createdAt).toLocaleString('ko-KR')}</span></div><p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#777]">{draft.body || '(내용 없음)'}</p></button>)}</div>}
    </main>
  </div>
}
