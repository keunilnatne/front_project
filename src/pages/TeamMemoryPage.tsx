import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import {
  fetchTeamMemory,
  saveTeamMemoryPattern,
  deleteTeamMemoryPattern,
  type Pattern,
} from '../users/teamMemory'

type CalendarEvent = {
  id: string
  date: string
  start: string
  end: string
  title: string
  place: string
  color: 'blue' | 'green' | 'purple'
  source: 'manual' | 'email'
}

type EventDraft = {
  date: string
  start: string
  end: string
  title: string
  place: string
  color: CalendarEvent['color']
}

const weekdayLabels = [
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
]

const monthNames = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function getInitialToday() {
  const date = new Date()

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    date: getDateKey(date),
  }
}

/**
 * 현재 달의 실제 날짜를 계산합니다.
 *
 * Date 객체를 기준으로 계산하기 때문에
 * 0일, -1일 같은 잘못된 날짜가 생성되지 않습니다.
 */
function getCalendarDays(
  year: number,
  month: number,
) {
  const firstDate = new Date(
    year,
    month,
    1,
  )

  const firstWeekday =
    firstDate.getDay()

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate()

  const totalCells =
    Math.ceil(
      (firstWeekday + daysInMonth) / 7,
    ) * 7

  return Array.from(
    { length: totalCells },
    (_, index) => {
      const date = new Date(
        year,
        month,
        index - firstWeekday + 1,
      )

      return {
        date: getDateKey(date),
        day: date.getDate(),
        weekday: date.getDay(),
        isCurrentMonth:
          date.getMonth() === month,
      }
    },
  )
}

/**
 * Team Memory에 저장된 deadline에서
 * 실제 날짜와 시간을 읽습니다.
 *
 * 지원 예:
 *
 * 2026-08-18
 * 2026.08.18
 * 2026/08/18
 * 2026년 8월 18일
 * 2026-08-18 14:00
 * 2026년 8월 18일 오후 2시
 *
 * 날짜가 없는 데이터는
 * 임의의 날짜에 배치하지 않습니다.
 */
function parseDeadline(
  deadline: string,
) {
  if (!deadline) return null
  const value = deadline.trim()

  let year = new Date().getFullYear()
  let month = 1
  let day = 1
  let hasDate = false

  const ymdMatch =
    value.match(
      /(\d{4})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/,
    ) ||
    value.match(
      /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
    )

  if (ymdMatch) {
    year = Number(ymdMatch[1])
    month = Number(ymdMatch[2])
    day = Number(ymdMatch[3])
    hasDate = true
  } else {
    const mdMatch =
      value.match(
        /(\d{1,2})[.\-/월]\s*(\d{1,2})/,
      ) ||
      value.match(
        /(\d{1,2})\s*월\s*(\d{1,2})\s*일/,
      )
    if (mdMatch) {
      month = Number(mdMatch[1])
      day = Number(mdMatch[2])
      hasDate = true
    }
  }

  if (!hasDate) {
    return null
  }

  const date = new Date(
    year,
    month - 1,
    day,
  )

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  const timeMatches = Array.from(value.matchAll(
    /(오전|오후|AM|PM)?\s*(\d{1,2})(?::|시)\s*(\d{1,2})?/gi,
  ))
  const timeMatch = timeMatches[0]

  if (!timeMatch) {
    return {
      date: getDateKey(date),
      start: '종일',
      end: '',
    }
  }

  let hour = Number(timeMatch[2])

  const minute = Number(
    timeMatch[3] || 0,
  )

  const period =
    timeMatch[1]?.toUpperCase()

  if (
    (period === '오후' ||
      period === 'PM') &&
    hour < 12
  ) {
    hour += 12
  }

  if (
    (period === '오전' ||
      period === 'AM') &&
    hour === 12
  ) {
    hour = 0
  }

  const start = `${String(
    hour,
  ).padStart(2, '0')}:${String(
    minute,
  ).padStart(2, '0')}`

  const endMatch = timeMatches[1]
  let end: string
  if (endMatch) {
    let endHour = Number(endMatch[2])
    const endMinute = Number(endMatch[3] || 0)
    const endPeriod = endMatch[1]?.toUpperCase() || period
    if ((endPeriod === '오후' || endPeriod === 'PM') && endHour < 12) endHour += 12
    if ((endPeriod === '오전' || endPeriod === 'AM') && endHour === 12) endHour = 0
    end = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`
  } else {
    const endDate = new Date(date)
    endDate.setHours(hour)
    endDate.setMinutes(minute + 60)
    end = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
  }

  return {
    date: getDateKey(date),
    start,
    end,
  }
}

function getEventSource(pattern: Pattern): 'manual' | 'email' {
  const id = String(pattern.id || '').toLowerCase()
  if (id.startsWith('schedule-')) return 'email'
  if (id.startsWith('team-schedule-')) return 'manual'
  const reason = (pattern.reason || '').toLowerCase()
  const att = (pattern.attachmentName || '').toLowerCase()
  if (att.startsWith('email:')) return 'email'
  if (att.startsWith('manual:')) return 'manual'
  if (att === 'purple') return 'email'
  if (pattern.request?.trim() && pattern.title?.trim() && pattern.request.trim() !== pattern.title.trim()) {
    return 'email'
  }
  if (reason.includes('이메일') || reason.includes('email') || att.includes('email') || att === 'green' || pattern.type === 'log') {
    return 'email'
  }
  return 'manual'
}

function getColorForPattern(pattern: Pattern): CalendarEvent['color'] {
  const storedColor = String(pattern.attachmentName || '').split(':').pop()
  if (storedColor === 'blue' || storedColor === 'green' || storedColor === 'purple') {
    return storedColor
  }
  const str = String(pattern.id || pattern.title || '')
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors: CalendarEvent['color'][] = ['blue', 'purple', 'green']
  return colors[hash % colors.length]
}

function cleanPlace(raw?: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  if (
    trimmed === '팀 일정에서 직접 추가' ||
    trimmed === 'AI 학습' ||
    trimmed === 'AI 학습 데이터' ||
    trimmed === '수동 추가' ||
    trimmed === '이메일 연동' ||
    trimmed.startsWith('■') ||
    trimmed.includes('점검') ||
    trimmed.includes('http') ||
    trimmed.length > 25
  ) {
    return ''
  }
  return trimmed
}

/**
 * 기존 Team Memory의 Pattern을
 * 캘린더 데이터로 변환합니다.
 */
function patternsToCalendarEvents(
  patterns: Pattern[],
): CalendarEvent[] {
  const events: CalendarEvent[] = []

  patterns.forEach(
    (pattern) => {
      const parsed = parseDeadline(
        pattern.deadline,
      )

      if (!parsed) {
        return
      }

      const source = getEventSource(pattern)
      const event: CalendarEvent = {
        id: String(pattern.id),
        date: parsed.date,
        start: parsed.start,
        end: parsed.end,

        title:
          pattern.title.trim() ||
          pattern.request.trim() ||
          '팀 일정',

        place: cleanPlace(pattern.reason),

        color: getColorForPattern(pattern),

        source,
      }

      events.push(event)
    },
  )

  return events
}

function formatDateLabel(
  dateKey: string,
) {
  const date = new Date(
    `${dateKey}T00:00:00`,
  )

  const weekdays = [
    '일',
    '월',
    '화',
    '수',
    '목',
    '금',
    '토',
  ]

  return `${
    date.getMonth() + 1
  }월 ${date.getDate()}일 ${
    weekdays[date.getDay()]
  }요일`
}

function formatEventTime(
  event: CalendarEvent,
) {
  if (event.start === '종일') {
    return '종일'
  }

  return `${event.start} - ${event.end}`
}

function colorClass(
  color: CalendarEvent['color'],
) {
  if (color === 'green') {
    return 'bg-[#16b879]'
  }

  if (color === 'purple') {
    return 'bg-[#8b5cf6]'
  }

  return 'bg-[#4385f5]'
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ChevronIcon({
  direction,
}: {
  direction: 'left' | 'right'
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d={
          direction === 'left'
            ? 'm14.5 5-7 7 7 7'
            : 'm9.5 5 7 7-7 7'
        }
      />
    </svg>
  )
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? '00' : '30'
  const value = `${String(hour).padStart(2, '0')}:${minute}`
  const period = hour < 12 ? '오전' : '오후'
  const displayHour = hour % 12 || 12
  return { value, label: `${period} ${displayHour}:${minute}` }
})

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function minutesToTime(minutes: number) {
  const safeMinutes = Math.min(23 * 60 + 30, Math.max(0, minutes))
  return `${String(Math.floor(safeMinutes / 60)).padStart(2, '0')}:${String(safeMinutes % 60).padStart(2, '0')}`
}

function EventModal({
  selectedDate,
  onClose,
  onAdd,
}: {
  selectedDate: string
  onClose: () => void
  onAdd: (
    event: EventDraft,
  ) => Promise<void>
}) {
  const [title, setTitle] =
    useState('')

  const [start, setStart] =
    useState('10:00')

  const [end, setEnd] =
    useState('11:00')

  const [place, setPlace] =
    useState('')

  const [color, setColor] =
    useState<
      EventDraft['color']
    >('blue')

  const [saving, setSaving] =
    useState(false)

  const startMinutes = timeToMinutes(start)
  const endMinutes = timeToMinutes(end)
  const validTimeRange = endMinutes > startMinutes

  const changeStart = (nextStart: string) => {
    const currentDuration = Math.max(30, endMinutes - startMinutes)
    const nextStartMinutes = timeToMinutes(nextStart)
    setStart(nextStart)
    setEnd(minutesToTime(nextStartMinutes + currentDuration))
  }

  const applyDuration = (duration: number) => {
    setEnd(minutesToTime(startMinutes + duration))
  }

  const submit = async () => {
    if (
      !title.trim() ||
      !validTimeRange ||
      saving
    ) {
      return
    }

    setSaving(true)

    try {
      await onAdd({
        date: selectedDate,
        start,
        end,
        title: title.trim(),
        place: place.trim(),
        color,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-bold text-[#292d3a]">
              일정 추가
            </h2>

            <p className="mt-1 text-[12px] text-[#7c8497]">
              {formatDateLabel(
                selectedDate,
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[24px] leading-none text-[#8b91a0]"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#596175]">
              일정 제목
            </span>

            <input
              autoFocus
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="일정 제목"
              className="h-10 w-full rounded-lg border border-[#dedfe7] px-3 text-[13px] outline-none focus:border-[#5a43dc]"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[12px] font-medium text-[#596175]">시간</span>
            <div className={`rounded-xl border bg-[#fafaff] p-3 transition ${validTimeRange ? 'border-[#e2dff1]' : 'border-[#e78b8b]'}`}>
              <div className="grid grid-cols-[1fr_28px_1fr] items-end gap-2">
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-medium text-[#8a8496]">시작</span>
                  <select
                    value={start}
                    onChange={(event) => changeStart(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#dedbea] bg-white px-3 text-[12px] font-semibold text-[#403a49] outline-none transition focus:border-[#5a43dc] focus:ring-2 focus:ring-[#eeeaff]"
                  >
                    {TIME_OPTIONS.slice(0, -1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>

                <div className="mb-1 flex h-10 items-center justify-center text-[#aaa5b4]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M5 12h14M15 8l4 4-4 4" />
                  </svg>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-medium text-[#8a8496]">종료</span>
                  <select
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#dedbea] bg-white px-3 text-[12px] font-semibold text-[#403a49] outline-none transition focus:border-[#5a43dc] focus:ring-2 focus:ring-[#eeeaff]"
                  >
                    {TIME_OPTIONS.filter((option) => timeToMinutes(option.value) > startMinutes).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="mr-1 text-[10px] text-[#918b9a]">빠른 설정</span>
                {[30, 60, 90, 120].map((duration) => {
                  const selected = endMinutes - startMinutes === duration
                  return (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => applyDuration(duration)}
                      disabled={startMinutes + duration > 23 * 60 + 30}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition disabled:cursor-not-allowed disabled:opacity-30 ${selected ? 'bg-[#5a43dc] text-white' : 'bg-white text-[#6f6878] ring-1 ring-[#e1ddec] hover:text-[#5037ca]'}`}
                    >
                      {duration < 60 ? `${duration}분` : `${duration / 60}시간`}
                    </button>
                  )
                })}
              </div>
            </div>
            {!validTimeRange && <p className="mt-1.5 text-[10px] text-[#c55252]">종료 시간은 시작 시간보다 늦어야 합니다.</p>}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-[#596175]">
              장소
            </span>

            <input
              value={place}
              onChange={(event) =>
                setPlace(
                  event.target.value,
                )
              }
              placeholder="회의실 / 온라인"
              className="h-10 w-full rounded-lg border border-[#dedfe7] px-3 text-[13px] outline-none focus:border-[#5a43dc]"
            />
          </label>

          <div>
            <span className="mb-2 block text-[12px] font-medium text-[#596175]">
              색상
            </span>

            <div className="flex gap-2">
              {(
                [
                  'blue',
                  'green',
                  'purple',
                ] as const
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setColor(value)
                  }
                  className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                    color === value
                      ? 'border-[#5b45dc]'
                      : 'border-transparent'
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full ${colorClass(
                      value,
                    )}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-lg border border-[#dedfe7] px-4 text-[12px] text-[#666d7d]"
          >
            취소
          </button>

          <button
            type="button"
            disabled={
              !title.trim() ||
              !validTimeRange ||
              saving
            }
            onClick={() =>
              void submit()
            }
            className="h-10 rounded-lg bg-[#4b39d4] px-5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? '저장 중...'
              : '일정 추가'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeamMemoryPage() {
  /*
   * 페이지에 처음 들어왔을 때
   * 무조건 실제 오늘 날짜를 선택합니다.
   */
  const initialToday = useMemo(
    () => getInitialToday(),
    [],
  )

  const [searchParams] = useSearchParams()
  const dateParam = searchParams.get('date')

  const [year, setYear] = useState(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return Number(dateParam.split('-')[0])
    }
    return initialToday.year
  })

  const [month, setMonth] = useState(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return Number(dateParam.split('-')[1]) - 1
    }
    return initialToday.month
  })

  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return dateParam
    }
    return initialToday.date
  })

  const [search, setSearch] =
    useState('')

  const [patterns, setPatterns] =
    useState<Pattern[]>([])

  const [loading, setLoading] =
    useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [showModal, setShowModal] =
    useState(false)

  useEffect(() => {
    const controller =
      new AbortController()

    const load = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        /*
         * 기존 Team Memory 데이터 연결.
         *
         * fetchTeamMemory()
         *   -> /api/team-memory
         *   -> API 실패 시 기존 localStorage
         *
         * 하드코딩 데이터를 사용하지 않습니다.
         */
        const result =
          await fetchTeamMemory(
            controller.signal,
          )

        if (
          !controller.signal.aborted
        ) {
          setPatterns(result)
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name ===
            'AbortError'
        ) {
          return
        }

        if (
          !controller.signal.aborted
        ) {
          setErrorMessage(
            '일정 데이터를 불러오지 못했습니다.',
          )
        }
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [])

  /*
   * 실제 Pattern.deadline에 들어있는
   * 날짜가 있는 데이터만 일정으로 변환합니다.
   */
  const aiEvents = useMemo(
    () =>
      patternsToCalendarEvents(
        patterns,
      ),
    [patterns],
  )

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        year,
        month,
      ),
    [year, month],
  )

  const visibleEvents = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    if (!keyword) {
      return aiEvents
    }

    return aiEvents.filter(
      (event) =>
        `${event.title} ${event.place} ${event.date} ${event.start} ${event.end}`
          .toLowerCase()
          .includes(keyword),
    )
  }, [aiEvents, search])

  const selectedEvents = useMemo(
    () =>
      visibleEvents
        .filter(
          (event) =>
            event.date ===
            selectedDate,
        )
        .sort((a, b) => {
          if (
            a.start === '종일'
          ) {
            return -1
          }

          if (
            b.start === '종일'
          ) {
            return 1
          }

          return a.start.localeCompare(
            b.start,
          )
        }),
    [
      visibleEvents,
      selectedDate,
    ],
  )

  const moveMonth = (
    direction: number,
  ) => {
    const next = new Date(
      year,
      month + direction,
      1,
    )

    setYear(
      next.getFullYear(),
    )

    setMonth(
      next.getMonth(),
    )

    /*
     * 이동한 달에서는
     * 무조건 그 달의 1일을 선택합니다.
     *
     * 따라서 전월의 31일 같은
     * 잘못된 날짜가 남지 않습니다.
     */
    setSelectedDate(
      getDateKey(next),
    )
  }

  const goToday = () => {
    const today = new Date()

    setYear(
      today.getFullYear(),
    )

    setMonth(
      today.getMonth(),
    )

    setSelectedDate(
      getDateKey(today),
    )
  }

  /**
   * 직접 추가한 일정 역시 기존 Team Memory
   * 저장 API를 사용합니다.
   */
  const addEvent = async (
    event: EventDraft,
  ) => {
    const deadline = event.end ? `${event.date} ${event.start} - ${event.end}` : `${event.date} ${event.start}`

    const pattern: Pattern = {
      id: `team-schedule-${Date.now()}`,
      title: event.title,
      purpose: event.title,
      reason: event.place?.trim() || '온라인',
      request: event.title,
      deadline,
      attachmentName: `manual:${event.color || 'blue'}`,
      updatedAt:
        new Date().toISOString(),
      unread: false,
    }

    try {
      const saved =
        await saveTeamMemoryPattern(
          pattern,
        )

      setPatterns(
        (current) => [
          saved,
          ...current.filter(
            (item) =>
              item.id !== saved.id,
          ),
        ],
      )

      setShowModal(false)
    } catch (error) {
      console.error(error)

      window.alert(
        '일정 저장에 실패했습니다.',
      )
    }
  }

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    try {
      await deleteTeamMemoryPattern(id)
      setPatterns((current) => current.filter((p) => String(p.id) !== String(id)))
    } catch {
      window.alert('일정 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/*
       * 기존 프로젝트의 공통 헤더를 그대로 사용합니다.
       */}
      <PageHeader
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={setSearch}
        searchPlaceholder="일정, 참석자 또는 키워드 검색"
      />

      <main className="px-8 pb-8 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="ieum-page-title text-[#292e3b]">
              팀 일정
            </h1>

            <p className="mt-1 text-[13px] text-[#7a8395]">
              팀원들의 주요 미팅 및 협업 일정을 한눈에
              확인하세요.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowModal(true)
            }
            className="flex h-11 items-center gap-2 rounded-lg bg-[#4b38d2] px-4 text-[13px] font-semibold text-white shadow-[0_5px_14px_rgba(75,56,210,0.15)] transition hover:bg-[#4130c3]"
          >
            <PlusIcon />
            일정 추가
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-stretch gap-6">
          <section className="overflow-hidden rounded-[16px] border border-[#e7e9ef] bg-white shadow-[0_5px_18px_rgba(34,42,61,0.035)]">
            <div className="relative flex h-[87px] items-center justify-center border-b border-[#e8eaf0]">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    moveMonth(-1)
                  }
                  aria-label="이전 달"
                  className="mr-7 flex h-9 w-9 items-center justify-center text-[#66738a] hover:text-[#4436ca]"
                >
                  <ChevronIcon direction="left" />
                </button>

                <h2 className="min-w-[145px] text-center text-[20px] font-bold tracking-[-0.02em] text-[#283041]">
                  {year}년{' '}
                  {monthNames[month]}
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    moveMonth(1)
                  }
                  aria-label="다음 달"
                  className="ml-7 flex h-9 w-9 items-center justify-center text-[#66738a] hover:text-[#4436ca]"
                >
                  <ChevronIcon direction="right" />
                </button>

              </div>

              <button
                type="button"
                onClick={goToday}
                className="absolute right-6 top-1/2 h-9 -translate-y-1/2 rounded-lg border border-[#e5e7ed] bg-white px-4 text-[12px] font-medium text-[#697386] hover:bg-[#f7f7fb]"
              >
                오늘
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-[#e8eaf0]">
              {weekdayLabels.map(
                (label) => (
                  <div
                    key={label}
                    className="flex h-11 items-center justify-center text-[12px] font-medium text-[#6d7890]"
                  >
                    {label}
                  </div>
                ),
              )}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map(
                (cell) => {
                  const dayEvents =
                    visibleEvents.filter(
                      (event) =>
                        event.date ===
                        cell.date,
                    )

                  const isSelected =
                    cell.date ===
                    selectedDate

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() =>
                        setSelectedDate(
                          cell.date,
                        )
                      }
                      /*
                       * 중요:
                       *
                       * 기존 프로젝트의 공통/브라우저
                       * button 스타일 때문에 날짜가
                       * 세로 가운데로 내려가는 것을
                       * 막기 위해 셀 자체를 block으로
                       * 강제합니다.
                       *
                       * !block
                       * !w-full
                       * !p-0
                       * !m-0
                       *
                       * 로 버튼의 기본 정렬 영향을
                       * 차단합니다.
                       *
                       * 세로 145px이므로
                       * 정사각형이 아닌 세로로 조금 긴
                       * 직사각형 형태입니다.
                       */
                      className={`!block !w-full !m-0 !p-0 relative h-[145px] overflow-hidden border-r border-b border-[#e8eaf0] text-left align-top ${
                        cell.isCurrentMonth
                          ? 'bg-white hover:bg-[#fcfcff]'
                          : 'bg-[#fbfcfe]'
                      }`}
                    >
                      {/*
                       * 날짜 숫자 위치:
                       *
                       * left-1/2
                       *   → 가로 중앙
                       *
                       * -translate-x-1/2
                       *   → 숫자 자체까지 정확히 중앙
                       *
                       * top-2.5
                       *   → 셀 위쪽 10px
                       *
                       * 따라서 날짜는 항상
                       * "가운데 위"에 위치합니다.
                       */}
                      <span
                        className={`absolute left-1/2 top-2.5 flex h-8 w-8 -translate-x-1/2 items-center justify-center text-[13px] font-medium ${
                          !cell.isCurrentMonth
                            ? 'text-[#aeb6c5]'
                            : cell.weekday ===
                                0
                              ? 'text-[#ff4545]'
                              : cell.weekday ===
                                  6
                                ? 'text-[#3974ec]'
                                : 'text-[#68758d]'
                        } ${
                          isSelected
                            ? 'rounded-full border border-[#b9c3ff] bg-[#e3e7ff] text-[#5268ef]'
                            : ''
                        }`}
                      >
                        {cell.day}
                      </span>

                      {/*
                       * 일정은 날짜 숫자 아래쪽에서
                       * 시작하도록 고정합니다.
                       */}
                      <div className="absolute left-3 right-3 top-[54px] space-y-2">
                        {dayEvents
                          .slice(0, 2)
                          .map(
                            (
                              event,
                            ) => (
                              <div
                                key={
                                  event.id
                                }
                                className="flex min-w-0 items-center gap-1.5 rounded-md bg-[#f4f2ff] border border-[#e4ddff] px-1.5 py-0.5 shadow-2xs"
                              >
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${colorClass(
                                    event.color,
                                  )}`}
                                />

                                <span className="truncate text-[10.5px] font-medium text-[#4338ca]">
                                  {
                                    event.title
                                  }
                                </span>
                              </div>
                            ),
                          )}

                        {dayEvents.length >
                          2 && (
                          <span className="block pl-3 text-[11px] text-[#5267ef]">
                            +
                            {dayEvents.length -
                              2}
                            개
                          </span>
                        )}
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          </section>

          <aside className="flex min-h-[856px] flex-col rounded-[16px] border border-[#e7e9ef] bg-white p-6 shadow-[0_5px_18px_rgba(34,42,61,0.035)]">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[#29303e]">
                {formatDateLabel(
                  selectedDate,
                )}
              </h2>

              <span className="mt-3 inline-flex rounded-full bg-[#f0f3ff] px-3 py-1.5 text-[11px] font-medium text-[#5c70ef]">
                {selectedEvents.length}개의
                일정
              </span>
            </div>

            <div className="mt-7 space-y-6">
              {loading ? (
                <div className="py-8 text-center text-[12px] text-[#9aa1b0]">
                  일정 데이터를 불러오는 중입니다.
                </div>
              ) : errorMessage ? (
                <div className="py-8 text-center text-[12px] leading-5 text-[#d44c4c]">
                  {errorMessage}
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-[#f8f9fc] p-4 text-center text-[12px] text-[#88909e]">
                    이 날짜에 등록된 일정이 없습니다.
                  </div>
                  {visibleEvents.length > 0 && (
                    <div className="border-t border-[#edf0f5] pt-4">
                      <p className="text-[12px] font-bold text-[#475569] mb-3">
                        전체 등록된 일정 ({visibleEvents.length}개)
                      </p>
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                        {visibleEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => {
                              setSelectedDate(evt.date)
                              const [y, m] = evt.date.split('-').map(Number)
                              setYear(y)
                              setMonth(m - 1)
                            }}
                            className="group flex items-center justify-between p-3 rounded-xl border border-[#e2e8f0] bg-white hover:border-[#6366f1] hover:bg-[#f5f7ff] cursor-pointer transition shadow-2xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${colorClass(evt.color)}`} />
                                <span className="font-semibold text-[13px] text-[#1e293b] truncate group-hover:text-[#4f46e5]">
                                  {evt.title}
                                </span>
                              </div>
                              <div className="mt-1 text-[11px] text-[#64748b]">
                                {evt.date} ({evt.start})
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-[#818cf8] group-hover:text-[#4f46e5]">
                              확인 →
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                selectedEvents.map(
                  (event) => (
                    <div
                      key={event.id}
                      className="flex gap-3"
                    >
                      <div className="relative mt-[7px] w-2 shrink-0">
                        <span
                          className={`block h-2 w-2 rounded-full ${colorClass(
                            event.color,
                          )}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-[#60708a]">
                          {formatEventTime(
                            event,
                          )}
                        </p>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="text-[15px] font-semibold leading-5 text-[#292f3e] truncate">
                            {event.title}
                          </p>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {event.source === 'email' ? (
                              <span className="rounded-md bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 text-[10px] font-semibold text-[#059669]">
                                이메일 추가
                              </span>
                            ) : (
                              <span className="rounded-md bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 text-[10px] font-semibold text-[#dc2626]">
                                직접 추가
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteEvent(event.id, e)}
                              className="h-5 w-5 rounded flex items-center justify-center text-[#a5abb7] hover:text-[#e04b4b] hover:bg-[#fff0f0] transition cursor-pointer text-[13px] leading-none"
                              title="일정 삭제"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {event.place && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#717b8f]">
                            <svg className="w-3 h-3 text-[#94a3b8] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="truncate">{event.place}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowModal(true)
              }
              className="mt-auto flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d8d9ff] bg-white text-[13px] font-medium text-[#5360ec] hover:bg-[#fafaff]"
            >
              <PlusIcon />
              이 날짜에 일정 추가
            </button>
          </aside>
        </div>
      </main>

      {showModal && (
        <EventModal
          selectedDate={selectedDate}
          onClose={() =>
            setShowModal(false)
          }
          onAdd={addEvent}
        />
      )}
    </div>
  )
}
