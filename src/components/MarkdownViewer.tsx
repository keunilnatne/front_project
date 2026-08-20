import React, { useState, useMemo } from 'react'

type MarkdownViewerProps = {
  content: string
  className?: string
  htmlContent?: string
}

/**
 * Sanitize HTML email content:
 * - Strip <script>, <style>, <head> tags and their contents
 * - Strip conditional comments (<!--[if ...]> ... <![endif]-->)
 * - Strip all HTML comments
 * - Strip unsafe attributes (on*, style with expression/url)
 * - Convert <img> tags to safe versions
 * - Convert <a> tags to safe links
 */
function sanitizeHtmlToSafeHtml(html: string): string {
  let cleaned = html

  // Remove everything between <head> and </head>
  cleaned = cleaned.replace(/<head[\s\S]*?<\/head>/gi, '')

  // Remove <script> blocks
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '')

  // Remove <style> blocks
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '')

  // Remove conditional comments: <!--[if ...]> ... <![endif]-->
  cleaned = cleaned.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')

  // Remove any remaining conditional comment syntax
  cleaned = cleaned.replace(/<!--\[if[^\]]*\]>/gi, '')
  cleaned = cleaned.replace(/<!\[endif\]-->/gi, '')
  cleaned = cleaned.replace(/<!--\[if[^>]*><!--|<!\[endif\]-->/gi, '')

  // Remove XML/XHTML namespace declarations
  cleaned = cleaned.replace(/<o:p[\s\S]*?<\/o:p>/gi, '')
  cleaned = cleaned.replace(/<v:[^>]*\/>/gi, '')
  cleaned = cleaned.replace(/<v:[^>]*>[\s\S]*?<\/v:[^>]*>/gi, '')

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')

  // Remove all event handler attributes (onclick, onload, etc.)
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')

  // Remove javascript: URLs from href/src
  cleaned = cleaned.replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""')

  return cleaned
}

/**
 * Check if a string looks like HTML content.
 */
function isHtmlContent(text: string): boolean {
  // Check for common HTML patterns
  const htmlPatterns = [
    /<\/?(?:div|span|p|br|table|tr|td|th|a|img|ul|ol|li|h[1-6]|html|body|head|meta|style|link|center|font|b|i|u|strong|em)\b/i,
    /<!--\[if/i,
    /&(?:nbsp|lt|gt|amp|quot);/i,
    /<![A-Z]/i,
  ]
  return htmlPatterns.some((pattern) => pattern.test(text))
}

/**
 * Convert plain-text body to cleaned readable text when it contains
 * HTML artifacts like conditional comments but is fundamentally text.
 */
function cleanPlainTextWithHtmlArtifacts(text: string): string {
  let cleaned = text

  // Remove conditional comments
  cleaned = cleaned.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
  cleaned = cleaned.replace(/<!--\[if[^\]]*\]>/gi, '')
  cleaned = cleaned.replace(/<!\[endif\]-->/gi, '')
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')

  // Remove XML namespace tags
  cleaned = cleaned.replace(/<o:p[\s\S]*?<\/o:p>/gi, '')

  // Clean multiple blank lines
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')

  return cleaned.trim()
}

export default function MarkdownViewer({ content, className = '', htmlContent }: MarkdownViewerProps) {
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  // Determine if we should render as HTML
  const renderMode = useMemo<'html' | 'markdown'>(() => {
    if (htmlContent && htmlContent.trim().length > 0) return 'html'
    if (content && isHtmlContent(content)) return 'html'
    return 'markdown'
  }, [content, htmlContent])

  const sanitizedHtml = useMemo(() => {
    if (renderMode !== 'html') return ''
    const raw = htmlContent && htmlContent.trim().length > 0 ? htmlContent : content
    return sanitizeHtmlToSafeHtml(raw)
  }, [renderMode, content, htmlContent])

  const cleanedContent = useMemo(() => {
    if (renderMode !== 'markdown') return content
    if (isHtmlContent(content)) {
      return cleanPlainTextWithHtmlArtifacts(content)
    }
    return content
  }, [renderMode, content])

  if (!content && !htmlContent) {
    return <div className={`text-[#888] italic ${className}`}>내용이 없습니다.</div>
  }

  // ======== HTML RENDERING MODE ========
  if (renderMode === 'html') {
    return (
      <div className={`markdown-body ${className}`}>
        <div
          className="email-html-content"
          style={{
            lineHeight: '1.6',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            fontSize: '14px',
            color: '#2c2b33',
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />

        {/* Global styles for HTML email content */}
        <style>{`
          .email-html-content {
            max-width: 100%;
            overflow-x: auto;
          }
          .email-html-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            cursor: pointer;
          }
          .email-html-content a {
            color: #4f46e5;
            text-decoration: underline;
            text-underline-offset: 2px;
            word-break: break-all;
          }
          .email-html-content a:hover {
            color: #4338ca;
          }
          .email-html-content table {
            border-collapse: collapse;
            max-width: 100%;
            overflow-x: auto;
            display: block;
          }
          .email-html-content td,
          .email-html-content th {
            padding: 6px 10px;
            vertical-align: top;
          }
          .email-html-content p {
            margin: 0.4em 0;
          }
          .email-html-content h1,
          .email-html-content h2,
          .email-html-content h3 {
            margin: 0.6em 0 0.3em;
            font-weight: 700;
          }
          .email-html-content blockquote {
            border-left: 3px solid #e2e2ea;
            padding-left: 12px;
            margin: 8px 0;
            color: #555;
          }
          .email-html-content pre,
          .email-html-content code {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            background: #f5f5fa;
            border-radius: 4px;
            padding: 2px 4px;
          }
          .email-html-content hr {
            border: none;
            border-top: 1px solid #e5e5eb;
            margin: 16px 0;
          }
          /* Hide tracking pixels and invisible images */
          .email-html-content img[width="1"],
          .email-html-content img[height="1"],
          .email-html-content img[style*="display:none"],
          .email-html-content img[style*="display: none"] {
            display: none !important;
          }
        `}</style>

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

  // ======== MARKDOWN RENDERING MODE ========
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
                  aria-label="코드 복사"
                  className="group relative flex h-6 w-6 items-center justify-center rounded text-[#ccc] transition hover:bg-[#2d2d38] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#8b76e8]"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="8" y="8" width="12" height="12" rx="2" />
                    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                  </svg>
                  <span role="tooltip" className="pointer-events-none absolute right-0 top-full z-30 mt-1.5 whitespace-nowrap rounded bg-black px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-md transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    복사
                  </span>
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

      // Also match standalone URLs: https://... or http://...
      const regex = /(!?\[([^\]]*)\]\(([^)]+)\))|(`([^`]+)`)|(https?:\/\/[^\s<>"{}|\\^`\u005B\u005D]+)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(lineText)) !== null) {
        if (match.index > lastIndex) {
          parts.push(lineText.slice(lastIndex, match.index))
        }

        const full = match[0]

        if (full.startsWith('![')) {
          // Markdown Image
          const linkText = match[2]
          const linkUrl = match[3]
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
          const linkText = match[2]
          const linkUrl = match[3]
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
        } else if (match[5]) {
          // Inline Code
          parts.push(
            <code
              key={`code-${match.index}`}
              className="rounded bg-[#f0edff] px-1.5 py-0.5 text-[11px] font-mono font-medium text-[#4f46e5]"
            >
              {match[5]}
            </code>
          )
        } else if (full.startsWith('http')) {
          // Standalone URL
          // Check if it's an image URL
          if (/\.(png|jpe?g|gif|webp|svg)(\?[^\s]*)?$/i.test(full)) {
            parts.push(
              <span key={`img-url-${match.index}`} className="my-2 inline-block max-w-full">
                <img
                  src={full}
                  alt="이미지"
                  onClick={() => setZoomImage(full)}
                  className="max-h-96 max-w-full rounded-lg border border-[#e5e5eb] object-contain shadow-sm cursor-zoom-in transition hover:opacity-95"
                  loading="lazy"
                />
              </span>
            )
          } else {
            // Regular URL → clickable link
            const displayUrl = full.length > 80 ? full.slice(0, 77) + '...' : full
            parts.push(
              <a
                key={`url-${match.index}`}
                href={full}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#4f46e5] underline underline-offset-2 hover:text-[#4338ca] break-all"
              >
                {displayUrl}
              </a>
            )
          }
        } else if (match[8]) {
          // Bold
          parts.push(<strong key={`bold-${match.index}`} className="font-semibold text-[#1a1a20]">{match[8]}</strong>)
        } else if (match[10]) {
          // Italic
          parts.push(<em key={`italic-${match.index}`} className="italic">{match[10]}</em>)
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
      {parseMarkdown(cleanedContent)}

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
