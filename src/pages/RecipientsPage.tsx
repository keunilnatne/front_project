import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useNavigate } from 'react-router-dom'

type Recipient = {
  id: number
  name: string
  role: string
  company: string
  country: string
  language: string
  timezone: string
  organizationRelation: string
  responseSpeed: '빠름' | '보통' | '느림'
  averageResponseMinutes: number
  collaborationActivity: 'High' | 'Medium' | 'Low'
  isOnline: boolean
  isFavorite: boolean
  isRecent: boolean
  verifiedExpert: boolean
  fullTime: boolean
  avatar: string
}

type TabId = 'all' | 'favorite' | 'recent'

type CollaborationModalProps = {
  recipient: Recipient
  onClose: () => void
}

const STORAGE_KEY = 'recipients-data'

const initialRecipients: Recipient[] = [
  {
    id: 1,
    name: '김민수',
    role: 'Product Designer',
    company: 'ABC Company',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'Asia/Seoul',
    organizationRelation: 'External Partner',
    responseSpeed: '빠름',
    averageResponseMinutes: 14,
    collaborationActivity: 'High',
    isOnline: true,
    isFavorite: true,
    isRecent: true,
    verifiedExpert: true,
    fullTime: true,
    avatar: '김',
  },
  {
    id: 2,
    name: '이서연',
    role: 'Marketing Lead',
    company: 'Nova Inc.',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'Asia/Seoul',
    organizationRelation: 'External Partner',
    responseSpeed: '보통',
    averageResponseMinutes: 38,
    collaborationActivity: 'Medium',
    isOnline: false,
    isFavorite: true,
    isRecent: true,
    verifiedExpert: false,
    fullTime: true,
    avatar: '이',
  },
  {
    id: 3,
    name: '박준호',
    role: 'Backend Engineer',
    company: 'ABC Company',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'Asia/Seoul',
    organizationRelation: 'Internal Team',
    responseSpeed: '느림',
    averageResponseMinutes: 92,
    collaborationActivity: 'Low',
    isOnline: false,
    isFavorite: false,
    isRecent: true,
    verifiedExpert: false,
    fullTime: false,
    avatar: '박',
  },
  {
    id: 4,
    name: '최유리',
    role: 'CEO',
    company: 'Studio Bright',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'Asia/Seoul',
    organizationRelation: 'External Partner',
    responseSpeed: '빠름',
    averageResponseMinutes: 21,
    collaborationActivity: 'High',
    isOnline: true,
    isFavorite: true,
    isRecent: true,
    verifiedExpert: true,
    fullTime: false,
    avatar: '최',
  },

  // 해외 테스트 데이터
  {
    id: 5,
    name: 'Emma Wilson',
    role: 'Product Manager',
    company: 'Northstar Labs',
    country: 'United States',
    language: 'English',
    timezone: 'America/New_York',
    organizationRelation: 'External Partner',
    responseSpeed: '빠름',
    averageResponseMinutes: 18,
    collaborationActivity: 'High',
    isOnline: true,
    isFavorite: true,
    isRecent: true,
    verifiedExpert: true,
    fullTime: false,
    avatar: 'E',
  },
  {
    id: 6,
    name: 'Liam Carter',
    role: 'Senior Engineer',
    company: 'Orbit Systems',
    country: 'United Kingdom',
    language: 'English',
    timezone: 'Europe/London',
    organizationRelation: 'External Partner',
    responseSpeed: '보통',
    averageResponseMinutes: 47,
    collaborationActivity: 'Medium',
    isOnline: false,
    isFavorite: false,
    isRecent: true,
    verifiedExpert: false,
    fullTime: true,
    avatar: 'L',
  },
  {
    id: 7,
    name: 'Sofia Rossi',
    role: 'UX Researcher',
    company: 'Milan Studio',
    country: 'Italy',
    language: 'Italian / English',
    timezone: 'Europe/Rome',
    organizationRelation: 'External Partner',
    responseSpeed: '보통',
    averageResponseMinutes: 34,
    collaborationActivity: 'High',
    isOnline: true,
    isFavorite: false,
    isRecent: true,
    verifiedExpert: true,
    fullTime: true,
    avatar: 'S',
  },
  {
    id: 8,
    name: 'Kenji Tanaka',
    role: 'Engineering Manager',
    company: 'Tokyo Works',
    country: 'Japan',
    language: 'Japanese / English',
    timezone: 'Asia/Tokyo',
    organizationRelation: 'External Partner',
    responseSpeed: '느림',
    averageResponseMinutes: 76,
    collaborationActivity: 'Medium',
    isOnline: false,
    isFavorite: false,
    isRecent: false,
    verifiedExpert: false,
    fullTime: true,
    avatar: 'K',
  },
  {
    id: 9,
    name: 'Olivia Brown',
    role: 'Creative Director',
    company: 'Sydney Creative',
    country: 'Australia',
    language: 'English',
    timezone: 'Australia/Sydney',
    organizationRelation: 'External Partner',
    responseSpeed: '빠름',
    averageResponseMinutes: 24,
    collaborationActivity: 'High',
    isOnline: true,
    isFavorite: false,
    isRecent: false,
    verifiedExpert: false,
    fullTime: false,
    avatar: 'O',
  },
  {
    id: 10,
    name: 'Daniel Kim',
    role: 'Strategy Consultant',
    company: 'Toronto Advisory',
    country: 'Canada',
    language: 'English / Korean',
    timezone: 'America/Toronto',
    organizationRelation: 'External Partner',
    responseSpeed: '보통',
    averageResponseMinutes: 41,
    collaborationActivity: 'Medium',
    isOnline: false,
    isFavorite: false,
    isRecent: false,
    verifiedExpert: true,
    fullTime: true,
    avatar: 'D',
  },
  {
    id: 11,
    name: 'Aarav Mehta',
    role: 'Data Engineer',
    company: 'Bangalore Tech',
    country: 'India',
    language: 'English / Hindi',
    timezone: 'Asia/Kolkata',
    organizationRelation: 'External Partner',
    responseSpeed: '빠름',
    averageResponseMinutes: 16,
    collaborationActivity: 'High',
    isOnline: true,
    isFavorite: false,
    isRecent: false,
    verifiedExpert: false,
    fullTime: true,
    avatar: 'A',
  },
  {
    id: 12,
    name: 'Camila Silva',
    role: 'Brand Designer',
    company: 'São Paulo Creative',
    country: 'Brazil',
    language: 'Portuguese / English',
    timezone: 'America/Sao_Paulo',
    organizationRelation: 'External Partner',
    responseSpeed: '보통',
    averageResponseMinutes: 52,
    collaborationActivity: 'Medium',
    isOnline: false,
    isFavorite: false,
    isRecent: false,
    verifiedExpert: false,
    fullTime: false,
    avatar: 'C',
  },
]

const tabs: { id: TabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'favorite', label: '즐겨찾기' },
  { id: 'recent', label: '최근 연락' },
]

function loadRecipients(): Recipient[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return initialRecipients
    }

    const parsed = JSON.parse(saved)

    if (!Array.isArray(parsed)) {
      return initialRecipients
    }

    return parsed
  } catch {
    return initialRecipients
  }
}

function saveRecipients(recipients: Recipient[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(recipients),
    )
  } catch {
    // localStorage 사용 불가 시 현재 상태만 유지
  }
}

function StarIcon({
  filled = false,
  size = 18,
}: {
  filled?: boolean
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  )
}

function VerifiedIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  )
}

function CollaborationIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 4 10.5 13.5" />
      <path d="M20 4 14 20l-3.5-6.5L4 10l16-6Z" />
      <path d="M10.5 13.5 9 19l5-5" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </svg>
  )
}

function Avatar({
  recipient,
  large = false,
}: {
  recipient: Recipient
  large?: boolean
}) {
  return (
    <div
      className={[
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-gradient-to-br from-[#e8e5ff] to-[#d8d4ff]',
        'font-semibold text-[#5145cd]',
        large
          ? 'h-20 w-20 text-[25px]'
          : 'h-10 w-10 text-[15px]',
      ].join(' ')}
    >
      {recipient.avatar}

      {recipient.isOnline && (
        <span
          className={[
            'absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#22c55e]',
            large ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5',
          ].join(' ')}
        />
      )}
    </div>
  )
}

function Badge({
  children,
  type,
}: {
  children: React.ReactNode
  type: 'verified' | 'fulltime'
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium',
        type === 'verified'
          ? 'bg-[#eeebff] text-[#5546d8]'
          : 'bg-[#f4f2f7] text-[#716b78]',
      ].join(' ')}
    >
      {type === 'verified' && <VerifiedIcon />}
      {children}
    </span>
  )
}

function getUserTimezone() {
  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'Asia/Seoul'
  )
}

function getUserTimezoneLabel() {
  const timezone = getUserTimezone()

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date())

    const offset = parts.find(
      (part) => part.type === 'timeZoneName',
    )?.value

    return offset
      ? `${timezone} (${offset.replace('GMT', 'UTC')})`
      : timezone
  } catch {
    return timezone
  }
}

function getTimeForTimezone(timezone: string) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    }).format(new Date())
  } catch {
    return '--:--'
  }
}

function getTimezoneOffset(timezone: string, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    }).formatToParts(date)

    const value =
      parts.find(
        (part) => part.type === 'timeZoneName',
      )?.value || 'GMT+00:00'

    const match = value.match(
      /GMT([+-])(\d{2}):?(\d{2})?/,
    )

    if (!match) {
      return 0
    }

    const sign = match[1] === '+' ? 1 : -1
    const hours = Number(match[2])
    const minutes = Number(match[3] || 0)

    return sign * (hours + minutes / 60)
  } catch {
    return 0
  }
}

function formatHour(hour: number) {
  const normalized = ((hour % 24) + 24) % 24
  const suffix = normalized >= 12 ? 'PM' : 'AM'
  const displayHour =
    normalized % 12 === 0 ? 12 : normalized % 12

  return `${displayHour}:00 ${suffix}`
}

function getTodayString() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLocalDateTimeFromTimezone(
  date: Date,
  timezone: string,
) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })

  const parts = formatter.formatToParts(date)

  const get = (type: string) =>
    parts.find((part) => part.type === type)
      ?.value || ''

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

function getDateTimeForTimezone(
  dateString: string,
  timeString: string,
  fromTimezone: string,
  toTimezone: string,
) {
  if (!dateString || !timeString) {
    return null
  }

  const [year, month, day] =
    dateString.split('-').map(Number)

  const [hour, minute] =
    timeString.split(':').map(Number)

  const baseUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
  )

  const approximateDate = new Date(baseUtc)

  const fromOffset = getTimezoneOffset(
    fromTimezone,
    approximateDate,
  )

  const utcTimestamp =
    baseUtc - fromOffset * 60 * 60 * 1000

  const actualUtcDate = new Date(utcTimestamp)

  const target =
    getLocalDateTimeFromTimezone(
      actualUtcDate,
      toTimezone,
    )

  return {
    date: `${target.year}-${target.month}-${target.day}`,
    time: `${target.hour}:${target.minute}`,
    dateTime: actualUtcDate,
  }
}

function getSmartMeetingSuggestions(
  recipient: Recipient,
) {
  const myTimezone = getUserTimezone()

  const myOffset = getTimezoneOffset(
    myTimezone,
  )

  const theirOffset = getTimezoneOffset(
    recipient.timezone,
  )

  const difference = theirOffset - myOffset

  const suggestions: {
    myHour: number
    theirHour: number
    label: string
  }[] = []

  for (let myHour = 8; myHour <= 18; myHour += 1) {
    const theirHour = myHour + difference

    if (theirHour >= 8 && theirHour <= 19) {
      const bothCoreWorkHours =
        myHour >= 9 &&
        myHour <= 17 &&
        theirHour >= 9 &&
        theirHour <= 17

      suggestions.push({
        myHour,
        theirHour,
        label: bothCoreWorkHours
          ? '양쪽 모두 업무시간'
          : '업무시간 일부 겹침',
      })
    }
  }

  return suggestions.slice(0, 4)
}

function CollaborationModal({
  recipient,
  onClose,
}: CollaborationModalProps) {
  const today = getTodayString()

  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [duration, setDuration] = useState('30분')

  const [meetingDate, setMeetingDate] =
    useState(today)

  const [meetingTime, setMeetingTime] =
    useState('10:00')

  const [selectedHour, setSelectedHour] =
    useState<number | null>(null)

  const [sent, setSent] = useState(false)

  const myTimezone = getUserTimezone()
  const myTimezoneLabel =
    getUserTimezoneLabel()

  const myCurrentTime =
    getTimeForTimezone(myTimezone)

  const theirCurrentTime =
    getTimeForTimezone(recipient.timezone)

  const suggestions = useMemo(
    () => getSmartMeetingSuggestions(recipient),
    [recipient],
  )

  const timeDifference = useMemo(() => {
    const myOffset =
      getTimezoneOffset(myTimezone)

    const theirOffset = getTimezoneOffset(
      recipient.timezone,
    )

    const difference = theirOffset - myOffset

    if (difference === 0) {
      return '시차 없음'
    }

    const abs = Math.abs(difference)
    const hours = Math.floor(abs)
    const minutes = Math.round(
      (abs - hours) * 60,
    )

    const text =
      minutes > 0
        ? `${hours}시간 ${minutes}분`
        : `${hours}시간`

    return difference > 0
      ? `${text} 빠름`
      : `${text} 느림`
  }, [myTimezone, recipient.timezone])

  const recipientDateTime =
    useMemo(() => {
      return getDateTimeForTimezone(
        meetingDate,
        meetingTime,
        myTimezone,
        recipient.timezone,
      )
    }, [
      meetingDate,
      meetingTime,
      myTimezone,
      recipient.timezone,
    ])

  const selectedDateTime =
    useMemo(() => {
      if (!meetingDate || !meetingTime) {
        return null
      }

      const result = getDateTimeForTimezone(
        meetingDate,
        meetingTime,
        myTimezone,
        recipient.timezone,
      )

      if (!result) {
        return null
      }

      const hour = Number(
        result.time.split(':')[0],
      )

      const isWorkingHour =
        hour >= 9 && hour < 18

      return {
        ...result,
        isWorkingHour,
      }
    }, [
      meetingDate,
      meetingTime,
      myTimezone,
      recipient.timezone,
    ])

  const handleSuggestedTime = (
    myHour: number,
  ) => {
    setMeetingDate(today)
    setMeetingTime(
      `${String(myHour).padStart(2, '0')}:00`,
    )
    setSelectedHour(myHour)
  }

  const handleSend = () => {
    if (!title.trim()) {
      return
    }

    setSent(true)

    window.setTimeout(() => {
      onClose()
    }, 900)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/35 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="flex h-[720px] w-[620px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-[#ededf1] px-7 py-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#4338ca]">
              <CollaborationIcon />

              <span className="text-[13px] font-semibold">
                협업 요청
              </span>
            </div>

            <h2 className="text-[22px] font-semibold text-[#24242a]">
              {recipient.name}님에게 협업 요청
            </h2>

            <p className="mt-1 text-[13px] text-[#8a8b92]">
              글로벌 협업을 고려해 양쪽의 업무시간을
              자동으로 맞춰드립니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#8c8d94] transition hover:bg-[#f5f5f7] hover:text-[#33343a]"
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Recipient */}
          <div className="mx-7 mt-5 flex items-center gap-3 rounded-xl bg-[#f8f8fb] px-4 py-3">
            <Avatar recipient={recipient} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold text-[#29292d]">
                  {recipient.name}
                </span>

                {recipient.verifiedExpert && (
                  <Badge type="verified">
                    VERIFIED EXPERT
                  </Badge>
                )}

                {recipient.fullTime && (
                  <Badge type="fulltime">
                    FULL-TIME
                  </Badge>
                )}
              </div>

              <p className="mt-0.5 text-[12px] text-[#777982]">
                {recipient.role} · {recipient.company}
              </p>
            </div>
          </div>

          {/* Timezone */}
          <div className="px-7 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <ClockIcon />

              <span className="text-[14px] font-semibold text-[#29292d]">
                글로벌 시간대 확인
              </span>

              <span className="rounded-full bg-[#eeebff] px-2 py-0.5 text-[11px] font-medium text-[#5546d8]">
                {timeDifference}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#e9e9ed] bg-white p-4">
                <p className="text-[11px] text-[#92939a]">
                  내 현지 시간
                </p>

                <p className="mt-1 text-[19px] font-semibold text-[#29292d]">
                  {myCurrentTime}
                </p>

                <p className="mt-1 truncate text-[11px] text-[#999aa1]">
                  {myTimezoneLabel}
                </p>
              </div>

              <div className="rounded-xl border border-[#e9e9ed] bg-white p-4">
                <p className="text-[11px] text-[#92939a]">
                  {recipient.name} 현지 시간
                </p>

                <p className="mt-1 text-[19px] font-semibold text-[#29292d]">
                  {theirCurrentTime}
                </p>

                <p className="mt-1 truncate text-[11px] text-[#999aa1]">
                  {recipient.timezone}
                </p>
              </div>
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="mx-7 mt-5 rounded-xl bg-[#f3f1ff] p-4">
            <p className="text-[13px] font-semibold text-[#4338ca]">
              추천 협업 시간
            </p>

            <p className="mt-1 text-[11px] text-[#77728e]">
              양쪽의 일반적인 업무시간(09:00–18:00)을
              기준으로 계산했습니다. 시간을 누르면 아래
              일정에 자동으로 적용됩니다.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.myHour}-${suggestion.theirHour}`}
                    type="button"
                    onClick={() =>
                      handleSuggestedTime(
                        suggestion.myHour,
                      )
                    }
                    className={[
                      'rounded-lg border px-3 py-2 text-left transition',
                      selectedHour ===
                        suggestion.myHour
                        ? 'border-[#5546e8] bg-white text-[#4338ca] shadow-sm'
                        : 'border-transparent bg-white/70 text-[#55565c] hover:border-[#d8d4ff]',
                    ].join(' ')}
                  >
                    <p className="text-[12px] font-semibold">
                      내 시간{' '}
                      {formatHour(
                        suggestion.myHour,
                      )}
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#898a91]">
                      상대방{' '}
                      {formatHour(
                        suggestion.theirHour,
                      )}{' '}
                      · {suggestion.label}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-[11px] text-[#77728e]">
                  양쪽 업무시간이 거의 겹치지 않습니다.
                  직접 시간을 조율하는 것을 권장합니다.
                </p>
              )}
            </div>
          </div>

          {/* Date / Time */}
          <div className="px-7 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarIcon />

              <span className="text-[14px] font-semibold text-[#29292d]">
                협업 일정
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-[11px] font-medium text-[#777880]">
                  날짜
                </span>

                <div className="relative">
                  <input
                    type="date"
                    value={meetingDate}
                    min={today}
                    onChange={(event) => {
                      setMeetingDate(
                        event.target.value,
                      )
                      setSelectedHour(null)
                    }}
                    className="h-11 w-full rounded-xl border border-[#dedee3] bg-white px-3 text-[13px] text-[#33343a] outline-none transition focus:border-[#5546e8] focus:ring-2 focus:ring-[#5546e8]/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-medium text-[#777880]">
                  내 현지 시간
                </span>

                <input
                  type="time"
                  value={meetingTime}
                  onChange={(event) => {
                    setMeetingTime(
                      event.target.value,
                    )
                    setSelectedHour(null)
                  }}
                  className="h-11 w-full rounded-xl border border-[#dedee3] bg-white px-3 text-[13px] text-[#33343a] outline-none transition focus:border-[#5546e8] focus:ring-2 focus:ring-[#5546e8]/10"
                />
              </label>
            </div>

            {/* Converted time */}
            {selectedDateTime && (
              <div className="mt-3 rounded-xl bg-[#f8f7ff] px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#8a879d]">
                      내 시간
                    </p>

                    <p className="mt-0.5 text-[13px] font-semibold text-[#4338ca]">
                      {meetingDate} · {meetingTime}
                    </p>
                  </div>

                  <div className="shrink-0 text-[#aaa6c5]">
                    →
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-[10px] text-[#8a879d]">
                      {recipient.name} 현지 시간
                    </p>

                    <p className="mt-0.5 text-[13px] font-semibold text-[#4338ca]">
                      {selectedDateTime.date} ·{' '}
                      {selectedDateTime.time}
                    </p>
                  </div>
                </div>

                {!selectedDateTime.isWorkingHour && (
                  <div className="mt-2 rounded-lg bg-[#fff7e6] px-3 py-2 text-[10px] text-[#a36a00]">
                    상대방 현지 시간이 일반적인 업무시간
                    (09:00–18:00) 밖입니다. 다른 시간을
                    선택해보세요.
                  </div>
                )}
              </div>
            )}

            {recipientDateTime && (
              <p className="mt-2 text-[10px] text-[#999aa1]">
                선택한 시간은 상대방의 현지 시간으로
                자동 변환되어 전달됩니다.
              </p>
            )}
          </div>

          {/* Form */}
          <div className="px-7 pb-7 pt-5">
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-[#45464c]">
                협업 제목
              </span>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="협업 제목을 입력하세요"
                className="h-11 w-full rounded-xl border border-[#dedee3] bg-white px-4 text-[13px] text-[#33343a] outline-none transition placeholder:text-[#aaaab0] focus:border-[#5546e8] focus:ring-2 focus:ring-[#5546e8]/10"
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-[13px] font-medium text-[#45464c]">
                협업 목적
              </span>

              <textarea
                value={purpose}
                onChange={(event) =>
                  setPurpose(event.target.value)
                }
                rows={4}
                placeholder=""
                className="w-full resize-none rounded-xl border border-[#dedee3] bg-white px-4 py-3 text-[13px] text-[#33343a] outline-none transition focus:border-[#5546e8] focus:ring-2 focus:ring-[#5546e8]/10"
              />
            </label>

            <div className="mt-4">
              <span className="mb-2 block text-[13px] font-medium text-[#45464c]">
                예상 미팅 시간
              </span>

              <div className="flex gap-2">
                {['30분', '45분', '60분'].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setDuration(item)
                      }
                      className={[
                        'rounded-lg border px-4 py-2 text-[12px] font-medium transition',
                        duration === item
                          ? 'border-[#5546e8] bg-[#5546e8] text-white'
                          : 'border-[#dedee3] bg-white text-[#65666d] hover:border-[#aaa6dd]',
                      ].join(' ')}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            </div>

            {sent && (
              <div className="mt-4 rounded-lg bg-[#eefbf3] px-4 py-3 text-[12px] font-medium text-[#24834d]">
                협업 요청을 준비했습니다.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-[#ededf1] bg-white px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-[#dedee3] bg-white px-5 text-[13px] font-medium text-[#55565c] transition hover:bg-[#f7f7f9]"
          >
            취소
          </button>

          <button
            type="button"
            disabled={!title.trim() || sent}
            onClick={handleSend}
            className="h-11 rounded-lg bg-[#4d3bd5] px-6 text-[13px] font-semibold text-white transition hover:bg-[#4332c2] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sent
              ? '요청 완료'
              : '협업 요청 보내기'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RecipientsPage() {
  const navigate = useNavigate()

  const [recipientList, setRecipientList] =
    useState<Recipient[]>(loadRecipients)

  const [activeTab, setActiveTab] =
    useState<TabId>('all')

  const [search, setSearch] = useState('')

  const [selectedId, setSelectedId] = useState(1)

  const [
    collaborationTarget,
    setCollaborationTarget,
  ] = useState<Recipient | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/recipients`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('수신자 조회 실패')))
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length) {
          const next = data as Recipient[]
          setRecipientList(next)
          if (!next.some((item) => item.id === selectedId)) setSelectedId(next[0].id)
          saveRecipients(next)
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const selectedRecipient =
    recipientList.find(
      (recipient) => recipient.id === selectedId,
    ) || recipientList[0]

  const toggleFavorite = (id: number) => {
    setRecipientList((current) => {
      const updated = current.map((recipient) =>
        recipient.id === id
          ? {
              ...recipient,
              isFavorite: !recipient.isFavorite,
            }
          : recipient,
      )

      saveRecipients(updated)
      const changed = updated.find((recipient) => recipient.id === id)
      if (changed) {
        void fetch(`${import.meta.env.VITE_API_URL || ''}/api/recipients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isFavorite: changed.isFavorite }),
        }).catch(() => {})
      }

      return updated
    })
  }

  const handleMessage = (recipient: Recipient) => {
    navigate('/messages', {
      state: {
        recipient: {
          id: String(recipient.id),
          name: recipient.name,
          position: recipient.role,
          company: recipient.company,
          country: recipient.country,
          language: recipient.language,
          timezone: recipient.timezone,
          relationship:
            recipient.organizationRelation,
          responseTime:
            recipient.averageResponseMinutes,
          speed: recipient.responseSpeed,
          collaboration:
            recipient.collaborationActivity,
        },
      },
    })
  }

  const filteredRecipients = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return recipientList.filter((recipient) => {
      if (
        activeTab === 'favorite' &&
        !recipient.isFavorite
      ) {
        return false
      }

      if (
        activeTab === 'recent' &&
        !recipient.isRecent
      ) {
        return false
      }

      if (!keyword) {
        return true
      }

      return [
        recipient.name,
        recipient.role,
        recipient.company,
        recipient.country,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    })
  }, [recipientList, activeTab, search])

  const favoriteCount = recipientList.filter(
    (recipient) => recipient.isFavorite,
  ).length

  const recentCount = recipientList.filter(
    (recipient) => recipient.isRecent,
  ).length

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Top Search */}
      <PageHeader searchValue={search} onSearchChange={setSearch} />

      {/* Page */}
      <section className="px-8 pb-12 pt-8">
        <div className="mb-7">
          <h1 className="ieum-page-title text-[#27272d]">
            수신자
          </h1>

          <p className="mt-1 text-[13px] text-[#87888f]">
            자주 소통하는 상대의 커뮤니케이션 성향을
            확인하고 관리하세요
          </p>
        </div>

        <div className="grid grid-cols-[298px_minmax(0,1fr)] items-stretch gap-7">
          {/* Left */}
          <div className="flex min-h-[760px] flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="border-b border-[#ededf0] p-4">
              <div className="flex h-9 items-center rounded-full bg-[#f1f1f4] px-4">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="이름, 회사로 검색"
                  className="w-full bg-transparent text-[12px] text-[#4b4c52] outline-none placeholder:text-[#999aa1]"
                />
              </div>
            </div>

            <div className="flex h-12 items-center gap-1 border-b border-[#ededf0] px-3">
              {tabs.map((tab) => {
                const count =
                  tab.id === 'all'
                    ? recipientList.length
                    : tab.id === 'favorite'
                      ? favoriteCount
                      : recentCount

                const isActive =
                  activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id)
                    }
                    className={[
                      'rounded-full px-3 py-1.5 text-[11px] font-medium transition',
                      isActive
                        ? 'bg-[#eeeaff] text-[#5143d1]'
                        : 'text-[#777880] hover:bg-[#f7f7f9]',
                    ].join(' ')}
                  >
                    {tab.label} {count}
                  </button>
                )
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredRecipients.map(
                (recipient) => {
                  const selected =
                    recipient.id === selectedId

                  return (
                    <div
                      key={recipient.id}
                      className={[
                        'group mb-1 flex w-full items-center gap-3 rounded-[16px] px-3 py-3 transition',
                        selected
                          ? 'bg-[#f0edff]'
                          : 'hover:bg-[#f7f7f9]',
                      ].join(' ')}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedId(
                            recipient.id,
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <Avatar
                          recipient={recipient}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-[14px] font-semibold text-[#393940]">
                              {recipient.name}
                            </p>

                            {recipient.country !==
                              'South Korea' && (
                              <span className="shrink-0 text-[10px] text-[#999aa0]">
                                🌐
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 truncate text-[11px] text-[#7f8088]">
                            {recipient.role} ·{' '}
                            {recipient.company}
                          </p>

                          <span
                            className={[
                              'mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium',
                              recipient.responseSpeed ===
                                '빠름'
                                ? 'bg-[#e7f9ee] text-[#38a765]'
                                : 'bg-[#f1f1f3] text-[#777880]',
                            ].join(' ')}
                          >
                            {recipient.responseSpeed}
                          </span>
                        </div>
                      </button>

                      {/* Favorite */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleFavorite(
                            recipient.id,
                          )
                        }
                        className={[
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition',
                          recipient.isFavorite
                            ? 'text-[#f3b51b]'
                            : 'text-[#c7c7cd] hover:bg-white hover:text-[#f3b51b]',
                        ].join(' ')}
                        aria-label={
                          recipient.isFavorite
                            ? `${recipient.name} 즐겨찾기 해제`
                            : `${recipient.name} 즐겨찾기 추가`
                        }
                        title={
                          recipient.isFavorite
                            ? '즐겨찾기 해제'
                            : '즐겨찾기 추가'
                        }
                      >
                        <StarIcon
                          filled={
                            recipient.isFavorite
                          }
                          size={17}
                        />
                      </button>
                    </div>
                  )
                },
              )}

              {filteredRecipients.length ===
                0 && (
                <div className="px-4 py-10 text-center text-[12px] text-[#999aa1]">
                  조건에 맞는 수신자가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex min-h-[760px] flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-5 px-6 py-5">
              <Avatar
                recipient={selectedRecipient}
                large
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedRecipient.verifiedExpert && (
                    <Badge type="verified">
                      VERIFIED EXPERT
                    </Badge>
                  )}

                  {selectedRecipient.fullTime && (
                    <Badge type="fulltime">
                      FULL-TIME
                    </Badge>
                  )}
                </div>

                <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#27272d]">
                  {selectedRecipient.name}
                </h2>

                <p className="mt-1 text-[15px] font-medium text-[#5b5c64]">
                  {selectedRecipient.role}

                  <span className="mx-1.5 text-[#b2b2b8]">
                    ·
                  </span>

                  <span className="font-normal text-[#777880]">
                    {selectedRecipient.company}
                  </span>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                {/* Favorite */}
                <button
                  type="button"
                  onClick={() =>
                    toggleFavorite(
                      selectedRecipient.id,
                    )
                  }
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-lg border transition',
                    selectedRecipient.isFavorite
                      ? 'border-[#f2d98a] bg-[#fffaf0] text-[#e6a900]'
                      : 'border-[#d9d9df] bg-white text-[#999aa1] hover:bg-[#f7f7f9] hover:text-[#e6a900]',
                  ].join(' ')}
                  aria-label={
                    selectedRecipient.isFavorite
                      ? '즐겨찾기 해제'
                      : '즐겨찾기 추가'
                  }
                  title={
                    selectedRecipient.isFavorite
                      ? '즐겨찾기 해제'
                      : '즐겨찾기 추가'
                  }
                >
                  <StarIcon
                    filled={
                      selectedRecipient.isFavorite
                    }
                    size={18}
                  />
                </button>

                {/* Message */}
                <button
                  type="button"
                  onClick={() =>
                    handleMessage(
                      selectedRecipient,
                    )
                  }
                  className="h-11 rounded-lg border border-[#d9d9df] bg-white px-5 text-[13px] font-medium text-[#55565c] transition hover:bg-[#f7f7f9]"
                >
                  메시지 보내기
                </button>

                {/* Collaboration */}
                <button
                  type="button"
                  onClick={() =>
                    setCollaborationTarget(
                      selectedRecipient,
                    )
                  }
                  className="flex h-11 items-center gap-2 rounded-lg bg-[#4d3bd5] px-5 text-[13px] font-semibold text-white transition hover:bg-[#4332c2]"
                >
                  <CollaborationIcon />
                  협업 요청
                </button>
              </div>
            </div>

            {/* Collaboration Context */}
            <div className="border-y border-[#e7e2ff] bg-[#f0edff] px-6 py-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="text-[#5143d1]">
                  <CollaborationIcon />
                </span>

                <h3 className="text-[16px] font-semibold text-[#292b38]">
                  Collaboration Context
                </h3>
              </div>

              <div className="grid grid-cols-[82px_1fr] gap-y-3 text-[13px]">
                <span className="text-[#7b7b84]">
                  국가
                </span>

                <span className="font-medium text-[#555662]">
                  {selectedRecipient.country}
                </span>

                <span className="text-[#7b7b84]">
                  언어
                </span>

                <span className="font-medium text-[#555662]">
                  {selectedRecipient.language}
                </span>

                <span className="text-[#7b7b84]">
                  시간대
                </span>

                <span className="font-medium text-[#555662]">
                  {selectedRecipient.timezone}

                  <span className="ml-2 text-[11px] font-normal text-[#888994]">
                    현재{' '}
                    {getTimeForTimezone(
                      selectedRecipient.timezone,
                    )}
                  </span>
                </span>

                <span className="text-[#7b7b84]">
                  직무
                </span>

                <span className="font-medium text-[#555662]">
                  {selectedRecipient.role}
                </span>

                <span className="text-[#7b7b84]">
                  조직 관계
                </span>

                <span className="font-medium text-[#555662]">
                  {
                    selectedRecipient.organizationRelation
                  }
                </span>
              </div>
            </div>

            <div className="min-h-[315px] flex-1" />

            {/* Metrics */}
            <div className="border-t border-[#ededf0] px-6 py-6">
              <div className="mb-6 flex items-center gap-2">
                <span className="text-[#5143d1]">
                  <ClockIcon />
                </span>

                <h3 className="text-[16px] font-semibold text-[#292b38]">
                  Response Time Metrics
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="flex h-[92px] flex-col items-center justify-center rounded-[18px] bg-[#f8f9fb]">
                  <div className="text-[25px] font-medium text-[#4c3ddd]">
                    {
                      selectedRecipient.averageResponseMinutes
                    }

                    <span className="ml-1 text-[14px]">
                      min
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-[#8d8e96]">
                    평균 응답 시간
                  </p>
                </div>

                <div className="flex h-[92px] flex-col items-center justify-center rounded-[18px] bg-[#f8f9fb]">
                  <div className="text-[25px] font-medium text-[#7a57ee]">
                    {selectedRecipient.responseSpeed ===
                    '빠름'
                      ? 'Fast'
                      : selectedRecipient.responseSpeed ===
                          '보통'
                        ? 'Normal'
                        : 'Slow'}
                  </div>

                  <p className="mt-1 text-[11px] text-[#8d8e96]">
                    상대적 응답 속도
                  </p>
                </div>

                <div className="flex h-[92px] flex-col items-center justify-center rounded-[18px] bg-[#f8f9fb]">
                  <div className="text-[25px] font-medium text-[#9a58ed]">
                    {
                      selectedRecipient.collaborationActivity
                    }
                  </div>

                  <p className="mt-1 text-[11px] text-[#8d8e96]">
                    협업 적극성
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-full bg-[#f6f7f9] px-5 py-3 text-center text-[11px] text-[#777880]">
                {selectedRecipient.responseSpeed ===
                '빠름'
                  ? '업무시간 중 메시지를 확인하면 비교적 빠르게 응답하는 편입니다.'
                  : selectedRecipient.responseSpeed ===
                      '보통'
                    ? '일반적인 업무시간 내에 응답하는 편입니다.'
                    : '응답까지 시간이 걸릴 수 있어 미리 일정을 공유하는 것이 좋습니다.'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {collaborationTarget && (
        <CollaborationModal
          recipient={collaborationTarget}
          onClose={() =>
            setCollaborationTarget(null)
          }
        />
      )}
    </div>
  )
}

export default RecipientsPage