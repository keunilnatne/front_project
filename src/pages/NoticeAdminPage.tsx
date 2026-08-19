import { useState, useEffect } from 'react'
import { fetchNotices, getNotices, saveNotice, deleteNotice, type NoticeItem } from '../users/notices'

export default function NoticeAdminPage() {
  const [notices, setNotices] = useState<NoticeItem[]>(getNotices())
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [tag, setTag] = useState('new')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reloadNotices = async () => {
    const data = await fetchNotices()
    setNotices(data)
  }

  useEffect(() => {
    void reloadNotices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('공지 제목을 입력해주세요.')
      return
    }

    setSubmitting(true)
    try {
      await saveNotice({
        title: title.trim(),
        subtitle: subtitle.trim() || '새로운 소식을 확인해보세요.',
        tag: tag.trim() || 'new',
        content: content.trim() || title.trim(),
      })

      await reloadNotices()
      setTitle('')
      setSubtitle('')
      setContent('')
      setMessage('공지사항이 데이터베이스에 성공적으로 등록되었습니다! 대시보드에 즉시 반영됩니다.')
      setTimeout(() => setMessage(''), 4000)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '공지사항을 등록하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('이 공지사항을 삭제하시겠습니까?')) return
    try {
      await deleteNotice(id)
      await reloadNotices()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '공지사항을 삭제하지 못했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8fb] p-6 lg:p-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#eee9ff] px-2.5 py-1 text-[11px] font-bold text-[#6844e2]">
              Admin Only
            </span>
            <span className="text-[12px] text-[#888]">직접 링크 전용 페이지</span>
          </div>
          <h1 className="mt-2 text-[26px] font-bold text-[#1f1e24]">
            📢 공지사항 / 새로운 소식 등록 및 관리
          </h1>
          <p className="mt-1 text-[13px] text-[#666]">
            이곳에서 등록한 공지는 메인 대시보드의 <strong>[새로운 소식]</strong> 카드와 팝업 모달에 실시간으로 노출됩니다.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-[13px] font-semibold text-[#16a34a] shadow-xs">
            ✓ {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#e5e5eb] bg-white p-6 shadow-sm">
              <h2 className="text-[17px] font-bold text-[#222]">새 공지 작성</h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#444]">
                    공지 제목 *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 더 편리해진 이음을 만나보세요 🎉"
                    className="h-10 w-full rounded-xl border border-[#dedee5] px-3.5 text-[13px] outline-none focus:border-[#6844e2]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#444]">
                    카드 요약 설명 (2줄 이내)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="예: 성능 개선과 새로운 기능으로 더 나은 경험을 제공합니다."
                    className="h-10 w-full rounded-xl border border-[#dedee5] px-3.5 text-[13px] outline-none focus:border-[#6844e2]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#444]">
                    태그 배지 텍스트
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="예: new, 업데이트, 필독"
                    className="h-10 w-full rounded-xl border border-[#dedee5] px-3.5 text-[13px] outline-none focus:border-[#6844e2]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#444]">
                    상세 팝업 내용 (줄바꿈 및 글머리 기호 가능)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    placeholder={`• 실시간 비즈니스 메시지 AI 최적화 지원\n• 수신자별 맞춤형 문체 및 어조 조율 강화`}
                    className="w-full rounded-xl border border-[#dedee5] p-3.5 text-[13px] leading-relaxed outline-none focus:border-[#6844e2]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#5035dc] py-3 text-[13px] font-semibold text-white transition hover:bg-[#432ec4] disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {submitting ? '등록 중...' : '공지 등록하기'}
                </button>
              </form>
            </div>
          </div>

          {/* List & Preview */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Card Preview */}
            <div className="rounded-2xl border border-[#dedee4] bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold text-[#888]">미리보기 (대시보드 카드 형태)</span>
              <div className="mt-3 rounded-xl border border-[#dedee4] bg-white p-5">
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-[#282328]">
                    새로운 소식
                  </h3>
                  <span className="rounded-full bg-[#eee9ff] px-2 py-0.5 text-[10px] font-semibold text-[#6844e2]">
                    {tag || 'new'}
                  </span>
                </div>
                <div className="mt-3 w-full rounded-lg bg-[#f0edff] p-5 text-left">
                  <p className="text-[13px] font-semibold text-[#4b4650]">
                    {title || '공지 제목 미리보기'}
                  </p>
                  <p className="mt-2 text-[12px] leading-5 text-[#999]">
                    {subtitle || '성능 개선과 새로운 기능으로\n더 나은 경험을 제공합니다.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Existing Notices List */}
            <div className="rounded-2xl border border-[#e5e5eb] bg-white p-5 shadow-sm">
              <h3 className="text-[14px] font-bold text-[#222]">
                등록된 공지 목록 ({notices.length}개)
              </h3>
              <div className="mt-3 divide-y divide-[#f0f0f5]">
                {notices.map((n) => (
                  <div key={n.id} className="flex items-start justify-between py-3">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5">
                        {n.tag && (
                          <span className="rounded bg-[#eee9ff] px-1.5 py-0.5 text-[9px] font-bold text-[#6844e2]">
                            {n.tag}
                          </span>
                        )}
                        <p className="truncate text-[13px] font-semibold text-[#333]">
                          {n.title}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[#888]">
                        {n.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="shrink-0 rounded-md border border-[#fca5a5] px-2 py-1 text-[10px] font-semibold text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
