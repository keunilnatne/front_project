export type CountryTimezoneInfo = {
  country: string
  defaultTimezone: string
  timezoneLabel: string
  language: string
  availableTimezones: Array<{ value: string; label: string }>
}

export const COUNTRY_TIMEZONE_MAP: Record<string, CountryTimezoneInfo> = {
  '대한민국': {
    country: '대한민국',
    defaultTimezone: 'Asia/Seoul',
    timezoneLabel: 'KST (UTC+9)',
    language: 'Korean',
    availableTimezones: [
      { value: 'Asia/Seoul', label: 'KST · 서울/도쿄 (UTC+9)' },
    ],
  },
  '미국': {
    country: '미국',
    defaultTimezone: 'America/New_York',
    timezoneLabel: 'ET (UTC-5)',
    language: 'English',
    availableTimezones: [
      { value: 'America/New_York', label: 'ET · 뉴욕/워싱턴 (UTC-5)' },
      { value: 'America/Chicago', label: 'CT · 시카고/달라스 (UTC-6)' },
      { value: 'America/Denver', label: 'MT · 덴버/피닉스 (UTC-7)' },
      { value: 'America/Los_Angeles', label: 'PT · LA/샌프란시스코 (UTC-8)' },
    ],
  },
  '일본': {
    country: '일본',
    defaultTimezone: 'Asia/Tokyo',
    timezoneLabel: 'JST (UTC+9)',
    language: 'Japanese',
    availableTimezones: [
      { value: 'Asia/Tokyo', label: 'JST · 도쿄/오사카 (UTC+9)' },
    ],
  },
  '중국': {
    country: '중국',
    defaultTimezone: 'Asia/Shanghai',
    timezoneLabel: 'CST (UTC+8)',
    language: 'Chinese',
    availableTimezones: [
      { value: 'Asia/Shanghai', label: 'CST · 베이징/상하이 (UTC+8)' },
    ],
  },
  '영국': {
    country: '영국',
    defaultTimezone: 'Europe/London',
    timezoneLabel: 'GMT/BST (UTC+0/+1)',
    language: 'English',
    availableTimezones: [
      { value: 'Europe/London', label: 'GMT · 런던 (UTC+0)' },
    ],
  },
  '독일': {
    country: '독일',
    defaultTimezone: 'Europe/Berlin',
    timezoneLabel: 'CET (UTC+1)',
    language: 'German',
    availableTimezones: [
      { value: 'Europe/Berlin', label: 'CET · 베를린/프랑크푸르트 (UTC+1)' },
    ],
  },
  '프랑스': {
    country: '프랑스',
    defaultTimezone: 'Europe/Paris',
    timezoneLabel: 'CET (UTC+1)',
    language: 'French',
    availableTimezones: [
      { value: 'Europe/Paris', label: 'CET · 파리 (UTC+1)' },
    ],
  },
  '싱가포르': {
    country: '싱가포르',
    defaultTimezone: 'Asia/Singapore',
    timezoneLabel: 'SGT (UTC+8)',
    language: 'English',
    availableTimezones: [
      { value: 'Asia/Singapore', label: 'SGT · 싱가포르 (UTC+8)' },
    ],
  },
  '인도': {
    country: '인도',
    defaultTimezone: 'Asia/Kolkata',
    timezoneLabel: 'IST (UTC+5:30)',
    language: 'English',
    availableTimezones: [
      { value: 'Asia/Kolkata', label: 'IST · 뉴델리/뭄바이 (UTC+5:30)' },
    ],
  },
  '호주': {
    country: '호주',
    defaultTimezone: 'Australia/Sydney',
    timezoneLabel: 'AEST (UTC+10)',
    language: 'English',
    availableTimezones: [
      { value: 'Australia/Sydney', label: 'AEST · 시드니/멜버른 (UTC+10)' },
      { value: 'Australia/Perth', label: 'AWST · 퍼스 (UTC+8)' },
    ],
  },
  '캐나다': {
    country: '캐나다',
    defaultTimezone: 'America/Toronto',
    timezoneLabel: 'ET (UTC-5)',
    language: 'English',
    availableTimezones: [
      { value: 'America/Toronto', label: 'ET · 토론토/몬트리올 (UTC-5)' },
      { value: 'America/Vancouver', label: 'PT · 밴쿠버 (UTC-8)' },
    ],
  },
  '베트남': {
    country: '베트남',
    defaultTimezone: 'Asia/Ho_Chi_Minh',
    timezoneLabel: 'ICT (UTC+7)',
    language: 'Vietnamese',
    availableTimezones: [
      { value: 'Asia/Ho_Chi_Minh', label: 'ICT · 하노이/호치민 (UTC+7)' },
    ],
  },
}

export function getCountryInfo(countryName?: string): CountryTimezoneInfo {
  if (!countryName) return COUNTRY_TIMEZONE_MAP['대한민국']
  return (
    COUNTRY_TIMEZONE_MAP[countryName] || {
      country: countryName,
      defaultTimezone: 'Asia/Seoul',
      timezoneLabel: 'UTC+9',
      language: 'English',
      availableTimezones: [
        { value: 'Asia/Seoul', label: 'Asia/Seoul (UTC+9)' },
        { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
        { value: 'Europe/London', label: 'Europe/London (UTC+0)' },
      ],
    }
  )
}
