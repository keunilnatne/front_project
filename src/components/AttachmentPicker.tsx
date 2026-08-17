import React, { useRef } from 'react'

export type AttachmentItem = {
  id: string
  name: string
  size: number
  type: string
  data: string // base64 data URL
}

type AttachmentPickerProps = {
  attachments: AttachmentItem[]
  onChange: (items: AttachmentItem[]) => void
  readOnly?: boolean
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentPicker({
  attachments,
  onChange,
  readOnly = false,
}: AttachmentPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      // 10MB limit per file
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} 파일이 너무 큽니다. (최대 10MB)`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result as string
        const newItem: AttachmentItem = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          data,
        }
        onChange([...attachments, newItem])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemove = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (readOnly) return
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="w-full">
      {/* File input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          handleFiles(e.target.files)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
        multiple
        className="hidden"
      />

      {/* Attachment Button & Dropzone trigger */}
      {!readOnly && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex items-center justify-between rounded-xl border border-dashed border-[#d8d8e2] bg-[#fafafc] px-4 py-2.5 transition hover:border-[#6343dd] hover:bg-[#f6f5ff]"
        >
          <div className="flex items-center gap-2 text-[12px] text-[#666]">
            <svg className="h-4 w-4 text-[#4f46e5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l7.88-7.88" />
            </svg>
            <span>파일이나 이미지를 여기에 드래그하거나 첨부하세요</span>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-[#dedee6] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#444] shadow-sm transition hover:bg-[#f0f0f5]"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            파일 선택
          </button>
        </div>
      )}

      {/* Attachment Chips / Previews */}
      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2.5">
          {attachments.map((item) => {
            const isImage = item.type.startsWith('image/')
            return (
              <div
                key={item.id}
                className="group relative flex items-center gap-2.5 rounded-xl border border-[#e2e2e8] bg-white p-1.5 pr-3 shadow-sm transition hover:border-[#4f46e5]/40"
              >
                {/* Thumbnail / Icon */}
                {isImage ? (
                  <img
                    src={item.data}
                    alt={item.name}
                    className="h-9 w-9 shrink-0 rounded-lg object-cover border border-[#eee]"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f0edff] text-[#4f46e5]">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                )}

                {/* File info */}
                <div className="min-w-0 max-w-[160px]">
                  <p className="truncate text-[11px] font-medium text-[#333]" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[10px] text-[#999]">{formatSize(item.size)}</p>
                </div>

                {/* Delete Button */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[#999] hover:bg-[#fee2e2] hover:text-[#ef4444] transition"
                    title="첨부 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
