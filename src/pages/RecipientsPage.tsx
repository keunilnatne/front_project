import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  createRecipient,
  updateRecipient,
  deleteRecipient,
  fetchRecipientByEmail,
  fetchRecipients,
  toggleRecipientFavorite,
  type Recipient,
} from '../users/recipients'
import { analyzeRecipient, type RecipientAIProfile } from '../ai/aiInsights'
import { getCountryInfo } from '../users/countryTimezones'
import { formatCommunicationStyleLabel } from '../users/communicationStyles'

function formatCountry(country?: string): string {
  if (!country) return '대한민국'
  if (country === 'South Korea' || country === 'Korea') return '대한민국'
  if (country === 'United States' || country === 'USA' || country === 'US') return '미국'
  if (country === 'Japan') return '일본'
  if (country === 'China') return '중국'
  if (country === 'United Kingdom' || country === 'UK') return '영국'
  if (country === 'Germany') return '독일'
  if (country === 'France') return '프랑스'
  if (country === 'Singapore') return '싱가포르'
  if (country === 'Canada') return '캐나다'
  if (country === 'Australia') return '호주'
  if (country === 'Vietnam') return '베트남'
  return country
}

function formatLanguage(language?: string): string {
  if (!language) return '한국어'
  if (language === 'Korean') return '한국어'
  if (language === 'English') return '영어'
  if (language === 'Japanese') return '일본어'
  if (language === 'Chinese') return '중국어'
  if (language === 'German') return '독일어'
  if (language === 'French') return '프랑스어'
  return language
}

function formatResponseDuration(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return '-'
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}분`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  if (hours < 24) return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours ? `${days}일 ${remainingHours}시간` : `${days}일`
}

function formatCollaborationActivity(activity?: string | null): string {
  if (activity === 'High') return '높음'
  if (activity === 'Medium') return '보통'
  if (activity === 'Low') return '낮음'
  return '-'
}

type TabId = 'all' | 'favorite' | 'recent'

type CollaborationModalProps = {
  recipient: Recipient
  onClose: () => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'favorite', label: '즐겨찾기' },
  { id: 'recent', label: '최근 연락' },
]


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
  const [searchParams] = useSearchParams()

  const [recipientList, setRecipientList] = useState<Recipient[]>([])

  const [activeTab, setActiveTab] =
    useState<TabId>('all')

  const [search, setSearch] = useState('')

  const [selectedId, setSelectedId] = useState(0)

  const [
    collaborationTarget,
    setCollaborationTarget,
  ] = useState<Recipient | null>(null)

  const [showAddRecipient, setShowAddRecipient] = useState(false)
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState<{ text: string; isError?: boolean } | null>(null)

  const [newRecipient, setNewRecipient] = useState({
    name: '',
    email: '',
    role: '',
    company: '',
    country: 'South Korea',
    language: 'Korean',
    timezone: 'Asia/Seoul',
    organizationRelation: '팀원',
    customStyle: '명확하고 간결하게',
  })
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['명확하고 간결하게'])
  const [formErrorMessage, setFormErrorMessage] = useState('')
  const [recipientSaving, setRecipientSaving] = useState(false)
  const [aiProfile, setAiProfile] = useState<RecipientAIProfile | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const resetAddRecipientState = () => {
    setNewRecipient({
      name: '',
      email: '',
      role: '',
      company: '',
      country: 'South Korea',
      language: 'Korean',
      timezone: 'Asia/Seoul',
      organizationRelation: '팀원',
      customStyle: '명확하고 간결하게',
    })
    setSelectedStyles(['명확하고 간결하게'])
    setLookupEmail('')
    setLookupMessage(null)
    setFormErrorMessage('')
  }

  const closeAddRecipientModal = () => {
    setShowAddRecipient(false)
    resetAddRecipientState()
  }

  const openAddRecipientModal = () => {
    resetAddRecipientState()
    setShowAddRecipient(true)
  }

  const openEditRecipientModal = (recipient: Recipient) => {
    setEditingRecipient(recipient)
    setNewRecipient({
      name: recipient.name || '',
      email: recipient.email || '',
      role: recipient.role || '',
      company: recipient.company || '',
      country: recipient.country || 'South Korea',
      language: recipient.language || 'Korean',
      timezone: recipient.timezone || 'Asia/Seoul',
      organizationRelation: recipient.organizationRelation || '팀원',
      customStyle: recipient.customStyle || recipient.preferredStyle || '',
    })
    const rawComm = recipient.communicationStyle as unknown
    const existingStyles = Array.isArray(rawComm) && rawComm.length
      ? (rawComm as string[])
      : (typeof rawComm === 'string' && rawComm
        ? (rawComm as string).split(',').map((s: string) => s.trim()).filter(Boolean)
        : (recipient.preferredStyle ? recipient.preferredStyle.split(',').map((s: string) => s.trim()).filter(Boolean) : ['명확하고 간결하게']))
    setSelectedStyles(existingStyles)
    setFormErrorMessage('')
  }

  const closeEditRecipientModal = () => {
    setEditingRecipient(null)
    resetAddRecipientState()
  }

  const handleDeleteRecipient = async (id: number) => {
    const target = recipientList.find((r) => r.id === id)
    if (!window.confirm(`'${target?.name || '수신자'}' 님을 삭제하시겠습니까?`)) return
    try {
      await deleteRecipient(id)
      const nextList = recipientList.filter((r) => r.id !== id)
      setRecipientList(nextList)
      if (selectedId === id && nextList.length) {
        setSelectedId(nextList[0].id)
      }
    } catch {
      alert('수신자 삭제에 실패했습니다.')
    }
  }

  const handleSaveEditRecipient = async () => {
    if (!editingRecipient) return
    const name = newRecipient.name.trim()
    const email = newRecipient.email.trim()
    const role = newRecipient.role.trim()

    if (!name) { setFormErrorMessage('이름을 입력해주세요.'); return }
    if (!email || !email.includes('@')) { setFormErrorMessage('올바른 이메일 주소를 입력해주세요.'); return }
    if (!role) { setFormErrorMessage('직무를 입력해주세요.'); return }

    setRecipientSaving(true)
    setFormErrorMessage('')
    try {
      const styles = selectedStyles.length ? selectedStyles : ['명확하고 간결하게']
      const updated = await updateRecipient({
        ...editingRecipient,
        name,
        email,
        role,
        company: newRecipient.company.trim(),
        country: newRecipient.country.trim() || 'South Korea',
        language: newRecipient.language.trim() || 'Korean',
        timezone: newRecipient.timezone.trim() || 'Asia/Seoul',
        organizationRelation: newRecipient.organizationRelation.trim() || '팀원',
        communicationStyle: styles,
        preferredStyle: styles.join(', '),
        customStyle: newRecipient.customStyle.trim(),
      })
      setRecipientList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setEditingRecipient(null)
      resetAddRecipientState()
    } catch (error) {
      setFormErrorMessage(error instanceof Error ? error.message : '수신자 수정에 실패했습니다.')
    } finally {
      setRecipientSaving(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void fetchRecipients(controller.signal)
      .then((data) => {
        setRecipientList(data)
        const requestedId = Number(searchParams.get('member'))
        setSelectedId((currentId) => {
          if (requestedId && data.some((item) => item.id === requestedId)) return requestedId
          if (data.length && !data.some((item) => item.id === currentId)) return data[0].id
          return currentId
        })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [searchParams])

  const selectedRecipient =
    recipientList.find(
      (recipient) => recipient.id === selectedId,
    ) || recipientList[0]

  useEffect(() => {
    if (!selectedRecipient) {
      const timer = window.setTimeout(() => setAiProfile(null), 0)
      return () => window.clearTimeout(timer)
    }
    let active = true
    const timer = window.setTimeout(() => {
      setAiLoading(true)
      void analyzeRecipient(selectedRecipient).then((profile) => {
        if (active) setAiProfile(profile)
      }).finally(() => { if (active) setAiLoading(false) })
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [selectedRecipient])

  async function handleLookupProfile() {
    const email = lookupEmail.trim()
    if (!email || !email.includes('@')) {
      setLookupMessage({ text: '올바른 이메일 주소를 입력해주세요.', isError: true })
      return
    }
    setLookupLoading(true)
    setLookupMessage(null)
    try {
      const found = await fetchRecipientByEmail(email)
      const rawFoundComm = found.communicationStyle as unknown
      const commStyles = Array.isArray(rawFoundComm) && rawFoundComm.length
        ? (rawFoundComm as string[])
        : (typeof rawFoundComm === 'string' && rawFoundComm
          ? (rawFoundComm as string).split(',').map((s: string) => s.trim()).filter(Boolean)
          : (found.preferredStyle ? found.preferredStyle.split(',').map((s: string) => s.trim()).filter(Boolean) : []))

      setNewRecipient((curr) => ({
        ...curr,
        email: found.email || email,
        name: found.name || curr.name,
        role: found.role || curr.role,
        company: found.company || curr.company,
        country: found.country || curr.country,
        language: found.language || curr.language,
        timezone: found.timezone || curr.timezone,
        organizationRelation: found.organizationRelation || curr.organizationRelation,
        customStyle: found.customStyle || found.preferredStyle || curr.customStyle,
      }))
      if (commStyles.length > 0) {
        setSelectedStyles(commStyles)
      } else {
        setSelectedStyles(['명확하고 간결하게'])
      }
      setLookupMessage({ text: `✓ 이음에 가입된 [${found.name || email}] 님의 유저 프로필과 선호 소통 스타일을 불러왔습니다.` })
    } catch {
      setLookupMessage({ text: '이음에 가입된 회원이 아닙니다. 아래 폼에 직접 입력하여 추가하실 수 있습니다.', isError: true })
      setNewRecipient((curr) => ({ ...curr, email }))
    } finally {
      setLookupLoading(false)
    }
  }

  async function addRecipient() {
    const name = newRecipient.name.trim()
    const email = newRecipient.email.trim()
    const role = newRecipient.role.trim()

    if (!name) { setFormErrorMessage('이름을 입력해주세요.'); return }
    if (!email || !email.includes('@')) { setFormErrorMessage('올바른 이메일 주소를 입력해주세요.'); return }
    if (!role) { setFormErrorMessage('직무를 입력해주세요.'); return }

    setRecipientSaving(true)
    setFormErrorMessage('')
    try {
      const styles = selectedStyles.length ? selectedStyles : ['명확하고 간결하게']

      const created = await createRecipient({
        email,
        name,
        role,
        company: newRecipient.company.trim(),
        country: newRecipient.country.trim() || 'South Korea',
        language: newRecipient.language.trim() || 'Korean',
        timezone: newRecipient.timezone.trim() || 'Asia/Seoul',
        organizationRelation: newRecipient.organizationRelation.trim() || '팀원',
        isOnline: false,
        isFavorite: false,
        isRecent: true,
        verifiedExpert: false,
        fullTime: true,
        avatar: name.slice(0, 1) || '?',
        communicationStyle: styles,
        preferredStyle: styles.join(', '),
        customStyle: newRecipient.customStyle.trim(),
      })
      const refreshed = await fetchRecipients()
      setRecipientList(refreshed)
      setSelectedId(created.id)
      setShowAddRecipient(false)
      setNewRecipient({
        name: '',
        email: '',
        role: '',
        company: '',
        country: 'South Korea',
        language: 'Korean',
        timezone: 'Asia/Seoul',
        organizationRelation: '팀원',
        customStyle: '명확하고 간결하게',
      })
      setSelectedStyles(['명확하고 간결하게'])
      setLookupEmail('')
      setLookupMessage(null)
      setFormErrorMessage('')
    } catch (error) {
      setFormErrorMessage(error instanceof Error ? error.message : '수신자 저장에 실패했습니다.')
    } finally {
      setRecipientSaving(false)
    }
  }

  const toggleFavorite = async (id: number) => {
    try {
      const result = await toggleRecipientFavorite(id)
      if (result) {
        setRecipientList((current) =>
          current.map((r) => (r.id === result.id ? result : r)),
        )
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '즐겨찾기를 변경하지 못했습니다.')
    }
  }

  const handleMessage = (recipient: Recipient) => {
    navigate('/messages', {
      state: {
        recipient: {
          id: String(recipient.id),
          name: recipient.name,
          email: recipient.email,
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
          communicationStyle:
            recipient.communicationStyle,
          preferredStyle:
            recipient.preferredStyle,
          customStyle:
            recipient.customStyle,
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
      <PageHeader searchValue={search} onSearchChange={setSearch} onSearchSubmit={setSearch} />

      {/* Page */}
      <section className="px-8 pb-12 pt-8">
        <div className="mb-7">
          <h1 className="ieum-page-title text-[#27272d]">
            수신자
          </h1>

          <div className="flex items-end justify-between gap-4">
            <p className="mt-1 text-[13px] text-[#87888f]">자주 소통하는 상대의 커뮤니케이션 성향을 확인하고 관리하세요</p>
            <button type="button" onClick={openAddRecipientModal} className="shrink-0 rounded-lg bg-[#4d3bd5] px-4 py-2.5 text-[12px] font-semibold text-white cursor-pointer">+ 수신자 추가</button>
          </div>
        </div>

        <div className="grid grid-cols-[298px_minmax(0,1fr)] items-stretch gap-7">
          {/* Left */}
          <div className="flex h-full min-h-[600px] max-h-[calc(100vh-140px)] flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="border-b border-[#ededf0] p-4 shrink-0">
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

            <div className="flex h-12 items-center gap-1 border-b border-[#ededf0] px-3 shrink-0">
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
                      'rounded-full px-3 py-1.5 text-[11px] font-medium transition cursor-pointer',
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

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredRecipients.map(
                (recipient) => {
                  const selected =
                    recipient.id === selectedId

                  return (
                    <div
                      key={recipient.id}
                      className={[
                        'group flex w-full items-center gap-3 rounded-[16px] px-3 py-3 transition',
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
                        className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
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
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition cursor-pointer',
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
          {!selectedRecipient ? (
            <div className="flex h-full min-h-[600px] items-center justify-center rounded-[22px] border border-[#e7e7eb] bg-white p-10 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f0edff] text-2xl text-[#5143d1]">+</div>
                <h2 className="mt-4 text-[18px] font-semibold text-[#29292d]">등록된 수신자가 없습니다</h2>
                <p className="mt-2 text-[12px] leading-5 text-[#888]">수신자를 추가하면 AI가 해당 사람과의 커뮤니케이션 데이터를 분석해 맞춤형 Context를 생성합니다.</p>
                <button type="button" onClick={openAddRecipientModal} className="mt-5 rounded-lg bg-[#4d3bd5] px-5 py-2.5 text-[12px] font-semibold text-white cursor-pointer">수신자 추가</button>
              </div>
            </div>
          ) : (
          <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-[22px] border border-[#e7e7eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
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

              <div className="flex shrink-0 items-center gap-2">
                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEditRecipientModal(selectedRecipient)}
                  className="flex h-11 items-center gap-1.5 rounded-lg border border-[#dedde3] bg-white px-3.5 text-[13px] font-medium text-[#494b57] hover:bg-[#f8f9fc] transition cursor-pointer shadow-2xs"
                  title="수신자 정보 수정"
                >
                  <svg className="h-4 w-4 text-[#666]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  수정
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteRecipient(selectedRecipient.id)}
                  className="flex h-11 items-center gap-1.5 rounded-lg border border-[#fca5a5] bg-white px-3 text-[13px] font-medium text-[#dc2626] hover:bg-[#fef2f2] transition cursor-pointer shadow-2xs"
                  title="수신자 삭제"
                >
                  <svg className="h-4 w-4 text-[#dc2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                  </svg>
                  삭제
                </button>

                {/* Favorite */}
                <button
                  type="button"
                  onClick={() =>
                    toggleFavorite(
                      selectedRecipient.id,
                    )
                  }
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-lg border transition cursor-pointer',
                    selectedRecipient.isFavorite
                      ? 'border-[#f2d98a] bg-[#fffaf0] text-[#e6a900]'
                      : 'border-[#d9d9df] bg-white text-[#999aa1] hover:bg-[#f7f7f9] hover:text-[#e6a900]',
                  ].join(' ')}
                  aria-label={
                    selectedRecipient.isFavorite
                      ? `${selectedRecipient.name} 즐겨찾기 해제`
                      : `${selectedRecipient.name} 즐겨찾기 추가`
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
                  className="flex h-11 items-center gap-2 rounded-lg bg-[#4d3bd5] px-5 text-[13px] font-semibold text-white transition hover:bg-[#4332c2] cursor-pointer shadow-xs"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                  메시지 보내기
                </button>
              </div>
            </div>

            {/* Collaboration Context */}
            <div className="border-y border-[#e7e2ff] bg-[#f0edff] px-6 py-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#5143d1]">
                    <CollaborationIcon />
                  </span>

                  <h3 className="text-[15px] font-semibold text-[#292b38]">
                    Collaboration Context
                  </h3>
                </div>
                <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-[#5143d1] border border-[#d8d3f8]">
                  AI 맞춤 컨텍스트
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[12px] font-medium text-[#7b7b84]">국가</span>
                  <span className="font-medium text-[#3b3c48]">{formatCountry(selectedRecipient.country)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[12px] font-medium text-[#7b7b84]">언어</span>
                  <span className="font-medium text-[#3b3c48]">{formatLanguage(selectedRecipient.language)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[12px] font-medium text-[#7b7b84]">시간대</span>
                  <span className="font-medium text-[#3b3c48]">
                    {selectedRecipient.timezone}
                    <span className="ml-1.5 rounded bg-white/60 px-1.5 py-0.5 text-[10px] font-normal text-[#696b79]">
                      현재 {getTimeForTimezone(selectedRecipient.timezone)}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[12px] font-medium text-[#7b7b84]">직무</span>
                  <span className="font-medium text-[#3b3c48]">{selectedRecipient.role}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[12px] font-medium text-[#7b7b84]">조직 관계</span>
                  <span className="font-medium text-[#3b3c48]">{selectedRecipient.organizationRelation || '-'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[12px] font-medium text-[#7b7b84]">응답 속도</span>
                  <span className="font-medium text-[#3b3c48]">
                    {selectedRecipient.responseSpeed ? `${selectedRecipient.responseSpeed}${selectedRecipient.averageResponseMinutes ? ` (평균 ${formatResponseDuration(selectedRecipient.averageResponseMinutes)})` : ''}` : '-'}
                  </span>
                </div>
              </div>

              {/* 선호 소통 스타일 */}
              <div className="mt-4 pt-3 border-t border-[#e2dcfa] flex items-start gap-3 text-[13px]">
                <span className="w-24 shrink-0 text-[12px] font-medium text-[#7b7b84] pt-0.5">선호 소통 스타일</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(selectedRecipient.communicationStyle) && selectedRecipient.communicationStyle.length > 0
                    ? selectedRecipient.communicationStyle
                    : String(selectedRecipient.preferredStyle || '명확한 표현 선호').split(',').map((style) => style.trim()).filter(Boolean)
                  ).map((style) => (
                      <span
                        key={style}
                        className="rounded-md bg-white border border-[#d8d2f5] px-2.5 py-1 text-[11px] font-medium text-[#5143d1] shadow-xs"
                      >
                        {formatCommunicationStyleLabel(style)}
                      </span>
                    ))}
                </div>
              </div>

              {selectedRecipient.customStyle && (
                <div className="mt-2.5 flex items-start gap-3 text-[13px]">
                  <span className="w-24 shrink-0 text-[12px] font-medium text-[#7b7b84] pt-0.5">추가 스타일</span>
                  <span className="rounded-md bg-white border border-[#d8d2f5] px-2.5 py-1 text-[11px] font-medium text-[#5143d1] shadow-xs">
                    {selectedRecipient.customStyle}
                  </span>
                </div>
              )}
            </div>

            {/* AI-generated communication profile */}
            <div className="border-t border-[#ededf0] px-6 py-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#292b38]">AI 커뮤니케이션 프로필</h3>
                <span className="text-[10px] text-[#8a8790]">{aiLoading ? '분석 중...' : aiProfile ? 'AI 분석 완료' : 'AI 분석 데이터 없음'}</span>
              </div>
              {aiProfile ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div><p className="mb-2 text-[10px] text-[#888]">커뮤니케이션 성향</p><div className="max-h-24 overflow-y-auto pr-1"><div className="flex flex-wrap gap-1.5">{aiProfile.tags.map((tag) => <span key={tag} className="rounded bg-[#f0ebff] px-2 py-1 text-[9px] text-[#6343dd]">{tag}</span>)}</div></div></div>
                  <div><p className="mb-2 text-[10px] text-[#888]">자주 사용하는 용어</p><div className="max-h-24 overflow-y-auto pr-1"><div className="flex flex-wrap gap-1.5">{aiProfile.terms.map((term) => <span key={term} className="rounded bg-[#f4f4f6] px-2 py-1 text-[9px] text-[#666]">{term}</span>)}</div></div></div>
                  <div className="md:col-span-2"><p className="mb-2 text-[10px] text-[#888]">커뮤니케이션 규칙</p><div className="max-h-28 space-y-1 overflow-y-auto pr-1">{aiProfile.rules.map((rule) => <div key={rule} className="rounded-lg bg-[#f8f8fa] px-3 py-2 text-[10px] text-[#666]">{rule}</div>)}</div></div>
                </div>
              ) : <p className="text-[11px] text-[#999]">수신자의 실제 커뮤니케이션 데이터가 AI에 전달되면 맞춤형 태그와 규칙이 표시됩니다.</p>}
            </div>

            {/* Metrics */}
            <div className="border-t border-[#ededf0] px-6 py-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#5143d1]">
                    <ClockIcon />
                  </span>

                  <h3 className="text-[16px] font-semibold text-[#292b38]">
                    응답 시간 지표
                  </h3>
                </div>
                <span className="text-[10px] text-[#8a8790]">
                  {(selectedRecipient.responseSampleCount || 0) > 0 ? '실제 메일 이력 반영됨' : '데이터 집계 대기 중'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
                <div className="flex h-[92px] flex-col items-center justify-center rounded-[18px] bg-[#f8f9fb]">
                  <div className="text-[25px] font-medium text-[#4c3ddd]">
                    {formatResponseDuration(selectedRecipient.averageResponseMinutes)}
                  </div>

                  <p className="mt-1 text-[11px] text-[#8d8e96]">
                    평균 응답 시간
                  </p>
                </div>

                <div className="flex h-[92px] flex-col items-center justify-center rounded-[18px] bg-[#f8f9fb]">
                  <div className="text-[25px] font-medium text-[#7a57ee]">
                    {selectedRecipient.responseSpeed || <span className="text-[20px] text-[#9ca3af]">-</span>}
                  </div>

                  <p className="mt-1 text-[11px] text-[#8d8e96]">
                    상대적 응답 속도
                  </p>
                </div>

                <div className="flex h-[92px] flex-col items-center justify-center rounded-[18px] bg-[#f8f9fb]">
                  <div className="text-[25px] font-medium text-[#9a58ed]">
                    {formatCollaborationActivity(selectedRecipient.collaborationActivity)}
                  </div>

                  <p className="mt-1 text-[11px] text-[#8d8e96]">
                    협업 적극성
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[#f6f7f9] px-5 py-3 text-center text-[11px] leading-5 text-[#777880]">
                {(selectedRecipient.responseSampleCount || 0) > 0
                  ? `최근 ${selectedRecipient.metricsWindowDays || 90}일 기준 · ${selectedRecipient.responseWindowDays || 7}일 이내 응답 ${selectedRecipient.responseSampleCount}건 · 응답률 ${selectedRecipient.responseRate ?? 0}% · 내 전체 수신자 기준 ${formatResponseDuration(selectedRecipient.responseBaselineMinutes)}`
                  : `최근 ${selectedRecipient.metricsWindowDays || 90}일 동안 이음에서 보낸 메일에 대한 ${selectedRecipient.responseWindowDays || 7}일 이내 회신이 쌓이면 자동 계산됩니다.`}
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      {showAddRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 overflow-y-auto" onMouseDown={closeAddRecipientModal}>
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-[#282328]">수신자 추가</h2>
                <p className="text-[12px] text-[#716b78] mt-0.5">이음 연결 프로필을 가져오거나 직접 입력할 수 있습니다.</p>
              </div>
              <button type="button" onClick={closeAddRecipientModal} className="text-xl text-[#888] hover:text-[#333]">×</button>
            </div>

            {/* 1. 이음에 연결된 프로필 가져오기 */}
            <div className="mt-4 rounded-xl border border-[#e2e0fb] bg-[#f8f7ff] p-3.5">
              <span className="block text-[11px] font-semibold text-[#4f46e5]">🔗 이음에 연결된 프로필 불러오기</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleLookupProfile() } }}
                  placeholder="이음에 가입된 동료 이메일 입력"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-[#d8d5f5] bg-white px-3 text-[12px] outline-none placeholder:text-[#999] focus:border-[#4f46e5]"
                />
                <button
                  type="button"
                  onClick={handleLookupProfile}
                  disabled={lookupLoading}
                  className="h-9 shrink-0 rounded-lg bg-[#4f46e5] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#4338ca] disabled:opacity-50"
                >
                  {lookupLoading ? '조회 중...' : '불러오기'}
                </button>
              </div>
              {lookupMessage && (
                <p className={`mt-2 text-[11px] font-medium ${lookupMessage.isError ? 'text-[#d97706]' : 'text-[#16a34a]'}`}>
                  {lookupMessage.text}
                </p>
              )}
            </div>

            {/* 2. 직접 추가 폼 (연결 안 되어 있어도 자유롭게 입력 가능) */}
            <div className="mt-4">
              <span className="mb-2 block text-[11px] font-semibold text-[#5d5565]">기본 정보 직접 입력</span>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">이름 *</span>
                  <input
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, name: e.target.value }))}
                    placeholder="예: 김민수"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">이메일 *</span>
                  <input
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, email: e.target.value }))}
                    placeholder="example@company.com"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">직무 *</span>
                  <input
                    value={newRecipient.role}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, role: e.target.value }))}
                    placeholder="예: Product Designer"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">회사</span>
                  <input
                    value={newRecipient.company}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, company: e.target.value }))}
                    placeholder="예: ABC Corp"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">국가</span>
                  <select
                    value={newRecipient.country}
                    onChange={(e) => {
                      const sel = e.target.value
                      const info = getCountryInfo(sel)
                      setNewRecipient((v) => ({
                        ...v,
                        country: sel,
                        language: info.language,
                        timezone: info.defaultTimezone,
                      }))
                    }}
                    className="h-10 w-full rounded-lg border border-[#dddde3] bg-white px-3 text-[12px] outline-none focus:border-[#6650df]"
                  >
                    <option value="대한민국">대한민국</option>
                    <option value="미국">미국</option>
                    <option value="일본">일본</option>
                    <option value="중국">중국</option>
                    <option value="영국">영국</option>
                    <option value="독일">독일</option>
                    <option value="프랑스">프랑스</option>
                    <option value="싱가포르">싱가포르</option>
                    <option value="인도">인도</option>
                    <option value="호주">호주</option>
                    <option value="캐나다">캐나다</option>
                    <option value="베트남">베트남</option>
                  </select>
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">언어</span>
                  <input
                    value={newRecipient.language}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, language: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                    placeholder="Korean, English 등"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">시간대</span>
                  <select
                    value={newRecipient.timezone}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, timezone: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-[#dddde3] bg-white px-3 text-[12px] outline-none focus:border-[#6650df]"
                  >
                    {getCountryInfo(newRecipient.country).availableTimezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">조직 관계</span>
                  <input
                    value={newRecipient.organizationRelation}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, organizationRelation: e.target.value }))}
                    placeholder="예: 팀원, 외부 파트너"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>
              </div>
            </div>

            {/* 3. 추구하는 소통 스타일 (태그 선택) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#5d5565]">
                  추구하는 소통 스타일 (태그 선택)
                </span>
                <span className="text-[10px] text-[#716b78]">
                  {selectedStyles.length}개 선택됨
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([
                  '편안하고 친근하게',
                  '명확하고 간결하게',
                  '격식 있고 정중하게',
                  '핵심 요약 위주',
                  '상세한 설명 선호',
                  '빠른 피드백 선호',
                  '논리적/데이터 중심',
                  ...selectedStyles,
                ])).map((styleTag) => {
                  const isSelected = selectedStyles.includes(styleTag)
                  return (
                    <button
                      key={styleTag}
                      type="button"
                      onClick={() => {
                        setSelectedStyles((prev) =>
                          prev.includes(styleTag)
                            ? prev.filter((t) => t !== styleTag)
                            : [...prev, styleTag]
                        )
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                        isSelected
                          ? 'border border-[#4f46e5] bg-[#4f46e5] text-white shadow-sm'
                          : 'border border-[#d8d5f5] bg-[#f8f7ff] text-[#4f46e5] hover:bg-[#eceaff]'
                      }`}
                    >
                      <span className="text-[10px]">{isSelected ? '✓' : '+'}</span>
                      <span>{styleTag}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-[#5d5565] mb-1">
                  추가 스타일 / 어조 (선택)
                </label>
                <input
                  value={newRecipient.customStyle || ''}
                  onChange={(e) => setNewRecipient((curr) => ({ ...curr, customStyle: e.target.value }))}
                  placeholder="예: 비즈니스 용어를 많이 사용합니다, 이모지를 자주 씁니다..."
                  className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                />
              </div>
            </div>

            {formErrorMessage && (
              <p className="mt-3 text-[11px] font-medium text-[#dc2626]">{formErrorMessage}</p>
            )}

            <button
              type="button"
              onClick={addRecipient}
              disabled={recipientSaving}
              className="mt-5 w-full rounded-lg bg-[#4d3bd5] py-3 text-[12px] font-semibold text-white transition hover:bg-[#4331cb] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
            >
              {recipientSaving ? '저장 중...' : '수신자 추가하기'}
            </button>
          </div>
        </div>
      )}

      {editingRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 overflow-y-auto" onMouseDown={closeEditRecipientModal}>
          <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-[#282328]">수신자 정보 수정</h2>
                <p className="text-[12px] text-[#716b78] mt-0.5">수신자의 기본 정보와 맞춤 소통 스타일을 수정합니다.</p>
              </div>
              <button type="button" onClick={closeEditRecipientModal} className="text-xl text-[#888] hover:text-[#333] cursor-pointer">×</button>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">이름 *</span>
                  <input
                    value={newRecipient.name}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, name: e.target.value }))}
                    placeholder="예: 김민수"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">이메일 *</span>
                  <input
                    type="email"
                    value={newRecipient.email}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, email: e.target.value }))}
                    placeholder="example@company.com"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">직무 *</span>
                  <input
                    value={newRecipient.role}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, role: e.target.value }))}
                    placeholder="예: Product Designer"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">회사</span>
                  <input
                    value={newRecipient.company}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, company: e.target.value }))}
                    placeholder="예: ABC Corp"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">국가</span>
                  <select
                    value={newRecipient.country}
                    onChange={(e) => {
                      const sel = e.target.value
                      const info = getCountryInfo(sel)
                      setNewRecipient((v) => ({
                        ...v,
                        country: sel,
                        language: info.language,
                        timezone: info.defaultTimezone,
                      }))
                    }}
                    className="h-10 w-full rounded-lg border border-[#dddde3] bg-white px-3 text-[12px] outline-none focus:border-[#6650df]"
                  >
                    <option value="South Korea">대한민국</option>
                    <option value="United States">미국</option>
                    <option value="Japan">일본</option>
                    <option value="China">중국</option>
                    <option value="United Kingdom">영국</option>
                    <option value="Germany">독일</option>
                    <option value="France">프랑스</option>
                    <option value="Singapore">싱가포르</option>
                    <option value="India">인도</option>
                    <option value="Australia">호주</option>
                    <option value="Canada">캐나다</option>
                    <option value="Vietnam">베트남</option>
                  </select>
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">언어</span>
                  <input
                    value={newRecipient.language}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, language: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                    placeholder="Korean, English 등"
                  />
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">시간대</span>
                  <select
                    value={newRecipient.timezone}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, timezone: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-[#dddde3] bg-white px-3 text-[12px] outline-none focus:border-[#6650df]"
                  >
                    {getCountryInfo(newRecipient.country).availableTimezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </label>

                <label className="text-[11px] text-[#777]">
                  <span className="mb-1 block font-semibold text-[#5d5565]">조직 관계</span>
                  <input
                    value={newRecipient.organizationRelation}
                    onChange={(e) => setNewRecipient((v) => ({ ...v, organizationRelation: e.target.value }))}
                    placeholder="예: 팀원, 외부 파트너"
                    className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                  />
                </label>
              </div>
            </div>

            {/* 추구하는 소통 스타일 (태그 선택) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-[#5d5565]">
                  추구하는 소통 스타일 (태그 선택)
                </span>
                <span className="text-[10px] text-[#716b78]">
                  {selectedStyles.length}개 선택됨
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([
                  '편안하고 친근하게',
                  '명확하고 간결하게',
                  '격식 있고 정중하게',
                  '핵심 요약 위주',
                  '상세한 설명 선호',
                  '빠른 피드백 선호',
                  '논리적/데이터 중심',
                  ...selectedStyles,
                ])).map((styleTag) => {
                  const isSelected = selectedStyles.includes(styleTag)
                  return (
                    <button
                      key={styleTag}
                      type="button"
                      onClick={() => {
                        setSelectedStyles((prev) =>
                          prev.includes(styleTag)
                            ? prev.filter((t) => t !== styleTag)
                            : [...prev, styleTag]
                        )
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                        isSelected
                          ? 'border border-[#4f46e5] bg-[#4f46e5] text-white shadow-sm'
                          : 'border border-[#d8d5f5] bg-[#f8f7ff] text-[#4f46e5] hover:bg-[#eceaff]'
                      }`}
                    >
                      <span className="text-[10px]">{isSelected ? '✓' : '+'}</span>
                      <span>{styleTag}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-semibold text-[#5d5565] mb-1">
                  추가 스타일 / 어조 (선택)
                </label>
                <input
                  value={newRecipient.customStyle || ''}
                  onChange={(e) => setNewRecipient((curr) => ({ ...curr, customStyle: e.target.value }))}
                  placeholder="예: 비즈니스 용어를 많이 사용합니다, 이모지를 자주 씁니다..."
                  className="h-10 w-full rounded-lg border border-[#dddde3] px-3 text-[12px] outline-none focus:border-[#6650df]"
                />
              </div>
            </div>

            {formErrorMessage && (
              <p className="mt-3 text-[11px] font-medium text-[#dc2626]">{formErrorMessage}</p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={closeEditRecipientModal}
                className="flex-1 rounded-lg border border-[#dedde3] bg-white py-3 text-[12px] font-medium text-[#555] hover:bg-[#fafafa] cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEditRecipient}
                disabled={recipientSaving}
                className="flex-2 rounded-lg bg-[#4d3bd5] py-3 text-[12px] font-semibold text-white transition hover:bg-[#4331cb] disabled:cursor-wait disabled:opacity-60 cursor-pointer"
              >
                {recipientSaving ? '저장 중...' : '수정 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

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
