export type RecipientContextData = {
  id: string | number
  name: string
  company: string
  position: string
  country?: string
  language: string
  timezone: string
  relationship: string
  communicationStyle?: string[]
  preferredStyle?: string
  customStyle?: string
}

const STYLE_LABELS: Record<string, string> = {
  concise: '간결하게',
  detailed: '자세하게',
  conclusion: '결론부터',
  context: '맥락부터',
  polite: '정중하게',
  casual: '편하게',
}

function getRecipientWorkStatus(timezone = 'Asia/Seoul') {
  try {
    const timeString = new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone || 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
    const [hour, minute] = timeString.split(':').map(Number)
    const totalMinutes = hour * 60 + (minute || 0)
    const isWorkHour = totalMinutes >= 9 * 60 && totalMinutes < 18 * 60

    return {
      isWorkHour,
      timeString,
      label: isWorkHour ? '업무 시간 중' : '업무 시간 외',
    }
  } catch {
    return { isWorkHour: true, timeString: '', label: '업무 상태 확인 불가' }
  }
}

function getCommunicationStyles(recipient: RecipientContextData) {
  const savedStyles = Array.isArray(recipient.communicationStyle)
    ? recipient.communicationStyle
    : String(recipient.preferredStyle || '')
      .split(',')
      .map((style) => style.trim())
      .filter(Boolean)
  const customStyle = String(recipient.customStyle || '').trim()

  return Array.from(new Set([
    ...savedStyles.map((style) => STYLE_LABELS[style] || style),
    ...(customStyle ? [STYLE_LABELS[customStyle] || customStyle] : []),
  ]))
}

function ContextIcon({ type }: { type: 'globe' | 'clock' | 'briefcase' | 'relationship' }) {
  const path = {
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M8 7V5h8v2M3 12h18" /></>,
    relationship: <><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0M16 7a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 4" /></>,
  }[type]

  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {path}
    </svg>
  )
}

function ContextRow({ icon, label, children }: { icon: 'globe' | 'clock' | 'briefcase' | 'relationship'; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex shrink-0 items-center gap-2 text-[#999]">
        <ContextIcon type={icon} />
        <span>{label}</span>
      </div>
      <div className="min-w-0 text-right font-medium text-[#29292d]">{children}</div>
    </div>
  )
}

export default function RecipientContextCard({ recipient }: { recipient: RecipientContextData }) {
  const workStatus = getRecipientWorkStatus(recipient.timezone)
  const communicationStyles = getCommunicationStyles(recipient)

  return (
    <section className="border-b border-[#eeeef0] pb-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9e9ec] text-[12px] font-semibold text-[#555]">
          {recipient.name ? recipient.name.slice(0, 2) : '?'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#29272c]">{recipient.name || '수신자'}</p>
          <p className="truncate text-[11px] text-[#999]">{recipient.company || '-'} · {recipient.position || '-'}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3.5 text-[11px]">
        <ContextRow icon="globe" label="국가">{recipient.country || '-'}</ContextRow>
        <ContextRow icon="globe" label="언어">{recipient.language || '-'}</ContextRow>
        <ContextRow icon="clock" label="시간대 / 업무 상태">
          <span className="inline-flex max-w-48 items-center justify-end gap-1.5">
            <span>{recipient.timezone || '-'}{workStatus.timeString ? ` · ${workStatus.timeString} (${workStatus.label})` : ` · ${workStatus.label}`}</span>
            <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${workStatus.isWorkHour ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} />
          </span>
        </ContextRow>
        <ContextRow icon="briefcase" label="직무">{recipient.position || '-'}</ContextRow>
        <ContextRow icon="relationship" label="조직 관계">{recipient.relationship || '-'}</ContextRow>
      </div>

      <div className="mt-5">
        <p className="text-[10px] text-[#999]">커뮤니케이션 스타일</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {communicationStyles.length > 0 ? communicationStyles.map((style) => (
            <span key={style} className="rounded bg-[#f0ebff] px-2 py-1 text-[10px] text-[#6343dd]">{style}</span>
          )) : (
            <p className="text-[10px] text-[#999]">등록된 커뮤니케이션 스타일이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  )
}
