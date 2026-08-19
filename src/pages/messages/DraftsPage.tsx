import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { fetchDrafts, deleteDraftFromServer, type DraftItem } from '../../users/drafts'

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}. ${month}. ${day}. ${hours}:${minutes}`
  } catch {
    return dateStr
  }
}

export default function DraftsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<DraftItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadDrafts = async () => {
    try {
      const items = await fetchDrafts()
      setDrafts(items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDrafts()
  }, [])

  const handleDeleteDraft = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('이 임시 저장 메시지를 삭제하시겠습니까?')) return
    try {
      await deleteDraftFromServer(id)
      setDrafts((prev) => prev.filter((d) => d.id !== id))
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '임시저장을 삭제하지 못했습니다.')
    }
  }

  const visible = drafts.filter((draft) =>
    `${draft.subject} ${draft.body}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} />
      <main className="px-8 pb-12 pt-8">
        <div className="mb-7 flex items-center justify-between">
          <div>
            <h1 className="ieum-page-title text-[#27272d]">임시저장함</h1>
            <p className="mt-1 text-[13px] text-[#87888f]">
              작성 중인 메시지를 다시 이어서 작성할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/messages')}
            className="rounded-lg bg-[#5531e8] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#4523d4]"
          >
            새 메시지
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-[#e7e7eb] bg-white px-6 py-16 text-center text-[13px] text-[#888]">
            저장된 임시 메시지가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((draft) => (
              <div
                key={draft.id}
                onClick={() => navigate('/messages', { state: draft })}
                className="group relative block w-full cursor-pointer rounded-2xl border border-[#e7e7eb] bg-white p-5 text-left transition hover:border-[#cfc7ff] hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <strong className="truncate text-[14px] text-[#222]">
                    {draft.subject || '(제목 없음)'}
                  </strong>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-[10px] text-[#999]">
                      {formatDateTime(draft.updatedAt || draft.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDraft(e, draft.id)}
                      className="rounded p-1 text-[12px] text-[#aaa] transition hover:bg-[#fee2e2] hover:text-[#dc2626]"
                      title="삭제"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#777]">
                  {draft.body || '(내용 없음)'}
                </p>
                {draft.recipients && draft.recipients.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {draft.recipients.map((r, i) => (
                      <span key={i} className="rounded bg-[#f0edff] px-2 py-0.5 text-[10px] font-medium text-[#5531e8]">
                        To: {r.name} {r.position ? `(${r.position})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
