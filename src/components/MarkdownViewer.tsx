import React, { useState } from 'react'

type MarkdownViewerProps = {
  content: string
  className?: string
}

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  if (!content) {
    return <div className={`text-[#888] italic ${className}`}>내용이 없습니다.</div>
  }

  // Parse lines and blocks
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockLang = ''
    let codeBlockLines: string[] = []
    let listItems: React.ReactNode[] = []
    let isOrderedList = false

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = isOrderedList ? 'ol' : 'ul'
        elements.push(
          <ListTag
            key={`list-${elements.length}`}
            className={`my-3 pl-6 space-y-1 ${isOrderedList ? 'list-decimal' : 'list-disc'} text-[#333]`}
          >
            {listItems}
          </ListTag>
        )
        listItems = []
        isOrderedList = false
      }
    }

    const flushCodeBlock = () => {
      if (codeBlockLines.length > 0) {
        const codeText = codeBlockLines.join('\n')
        elements.push(
          <div key={`code-${elements.length}`} className="my-3 overflow-hidden rounded-xl border border-[#e2e2ea] bg-[#1e1e24] shadow-sm">
            {codeBlockLang && (
              <div className="flex items-center justify-between border-b border-[#2d2d38] bg-[#18181d] px-4 py-1.5 text-[11px] font-mono text-[#a0a0b0]">
                <span>{codeBlockLang}</span>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(codeText)}
                  className="rounded px-2 py-0.5 text-[10px] text-[#ccc] hover:bg-[#2d2d38] transition"
                >
                  복사
                </button>
              </div>
            )}
            <pre className="overflow-x-auto p-4 text-[12px] font-mono text-[#f0f0f5] leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        )
        codeBlockLines = []
        codeBlockLang = ''
      }
    }

    // Inline formatting: bold, italic, inline code, links, images
    const formatInline = (lineText: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      // Match markdown images: ![alt](url)
      // Match markdown links: [text](url)
      // Match inline code: `code`
      // Match bold: **text** or __text__
      // Match italic: *text* or _text_

      const regex = /(!?\[([^\]]*)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(lineText)) !== null) {
        if (match.index > lastIndex) {
          parts.push(lineText.slice(lastIndex, match.index))
        }

        const [full, , linkText, linkUrl, , inlineCode, , boldText, , italicText] = match

        if (full.startsWith('![')) {
          // Markdown Image
          parts.push(
            <span key={`img-${match.index}`} className="my-2 inline-block max-w-full">
              <img
                src={linkUrl}
                alt={linkText || '이미지'}
                onClick={() => setZoomImage(linkUrl)}
                className="max-h-96 max-w-full rounded-lg border border-[#e5e5eb] object-contain shadow-sm cursor-zoom-in transition hover:opacity-95"
                loading="lazy"
              />
              {linkText && <span className="block text-center text-[11px] text-[#888] mt-1">{linkText}</span>}
            </span>
          )
        } else if (full.startsWith('[')) {
          // Markdown Link
          parts.push(
            <a
              key={`link-${match.index}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#4f46e5] underline underline-offset-2 hover:text-[#4338ca]"
            >
              {linkText || linkUrl}
            </a>
          )
        } else if (inlineCode) {
          // Inline Code
          parts.push(
            <code
              key={`code-${match.index}`}
              className="rounded bg-[#f0edff] px-1.5 py-0.5 text-[11px] font-mono font-medium text-[#4f46e5]"
            >
              {inlineCode}
            </code>
          )
        } else if (boldText) {
          // Bold
          parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-[#1a1a20]">{boldText}</strong>)
        } else if (italicText) {
          // Italic
          parts.push(<em key={`italic-${match.index}`} className="italic">{italicText}</em>)
        }

        lastIndex = regex.lastIndex
      }

      if (lastIndex < lineText.length) {
        parts.push(lineText.slice(lastIndex))
      }

      return parts.length > 0 ? parts : [lineText]
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Code block start / end
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock()
          inCodeBlock = false
        } else {
          flushList()
          inCodeBlock = true
          codeBlockLang = trimmed.slice(3).trim()
        }
        continue
      }

      if (inCodeBlock) {
        codeBlockLines.push(line)
        continue
      }

      // Horizontal Rule
      if (/^(---|___|\*\*\*)$/.test(trimmed)) {
        flushList()
        elements.push(<hr key={`hr-${i}`} className="my-5 border-t border-[#e2e2e8]" />)
        continue
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        flushList()
        elements.push(<h1 key={`h1-${i}`} className="mt-5 mb-2.5 text-[20px] font-bold text-[#1f1e24]">{formatInline(trimmed.slice(2))}</h1>)
        continue
      }
      if (trimmed.startsWith('## ')) {
        flushList()
        elements.push(<h2 key={`h2-${i}`} className="mt-4 mb-2 text-[17px] font-bold text-[#25242c]">{formatInline(trimmed.slice(3))}</h2>)
        continue
      }
      if (trimmed.startsWith('### ')) {
        flushList()
        elements.push(<h3 key={`h3-${i}`} className="mt-3 mb-1.5 text-[15px] font-semibold text-[#2d2c34]">{formatInline(trimmed.slice(4))}</h3>)
        continue
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        flushList()
        elements.push(
          <blockquote key={`quote-${i}`} className="my-2.5 border-l-4 border-[#6343dd] bg-[#f8f7ff] py-2 pl-3.5 pr-3 text-[13px] text-[#4f46e5] rounded-r-lg">
            {formatInline(trimmed.slice(2))}
          </blockquote>
        )
        continue
      }

      // Unordered list items (- or *)
      if (/^[-*]\s+/.test(trimmed)) {
        isOrderedList = false
        listItems.push(<li key={`li-${i}`} className="text-[13px] leading-relaxed">{formatInline(trimmed.replace(/^[-*]\s+/, ''))}</li>)
        continue
      }

      // Ordered list items (1. 2. ...)
      if (/^\d+\.\s+/.test(trimmed)) {
        isOrderedList = true
        listItems.push(<li key={`li-${i}`} className="text-[13px] leading-relaxed">{formatInline(trimmed.replace(/^\d+\.\s+/, ''))}</li>)
        continue
      }

      // Standalone Image URLs (e.g. https://...png/jpg)
      if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(trimmed)) {
        flushList()
        elements.push(
          <div key={`img-standalone-${i}`} className="my-3">
            <img
              src={trimmed}
              alt="첨부 이미지"
              onClick={() => setZoomImage(trimmed)}
              className="max-h-96 max-w-full rounded-xl border border-[#e5e5eb] object-contain shadow-sm cursor-zoom-in transition hover:opacity-95"
              loading="lazy"
            />
          </div>
        )
        continue
      }

      // Empty line / paragraph break
      if (trimmed === '') {
        flushList()
        elements.push(<div key={`blank-${i}`} className="h-2" />)
        continue
      }

      // Regular line
      flushList()
      elements.push(
        <p key={`p-${i}`} className="text-[13px] leading-relaxed text-[#2c2b33]">
          {formatInline(line)}
        </p>
      )
    }

    flushList()
    flushCodeBlock()
    return elements
  }

  return (
    <div className={`markdown-body space-y-1 ${className}`}>
      {parseMarkdown(content)}

      {/* Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              ✕
            </button>
            <img src={zoomImage} alt="확대 이미지" className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}
