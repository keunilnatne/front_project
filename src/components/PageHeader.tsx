import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationsRead, type NotificationItem } from '../users/notifications'

type PageHeaderProps = {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  onSearchSubmit?: (value: string) => void
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="10.8" cy="10.8" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  )
}

const headerStyle: CSSProperties = {
  height: 64,
  minHeight: 64,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  padding: '0 32px',
  borderBottom: '1px solid #e5e5e8',
  background: '#ffffff',
  boxSizing: 'border-box',
}

const searchStyle: CSSProperties = {
  width: 420,
  maxWidth: '100%',
  height: 38,
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  flexShrink: 1,
  padding: '0 12px',
  boxSizing: 'border-box',
  border: '1px solid #dedee3',
  borderRadius: 7,
  background: '#ffffff',
  color: '#70727a',
}

const inputStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  height: '100%',
  padding: 0,
  margin: 0,
  border: 0,
  outline: 'none',
  background: 'transparent',
  color: '#29292d',
  fontFamily: 'inherit',
  fontSize: 13,
  lineHeight: '38px',
  boxSizing: 'border-box',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 18,
  flexShrink: 0,
  marginLeft: 24,
  color: '#34353b',
}

const iconButtonStyle: CSSProperties = {
  position: 'relative',
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 0,
  borderRadius: 999,
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  boxSizing: 'border-box',
}

export default function PageHeader({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = '메시지 또는 팀 멤버 검색',
  onSearchSubmit,
}: PageHeaderProps) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>(getNotifications())
  const [openNotifications, setOpenNotifications] = useState(false)

  useEffect(() => {
    const update = () => setNotifications(getNotifications())
    window.addEventListener('notifications-updated', update)
    window.addEventListener('storage', update)
    return () => { window.removeEventListener('notifications-updated', update); window.removeEventListener('storage', update) }
  }, [])

  useEffect(() => {
    let active = true
    const syncServerNotifications = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/notifications`)
        if (!response.ok) return
        const data: unknown = await response.json()
        if (!active || !Array.isArray(data)) return
        const current = getNotifications()
        for (const item of data as Array<Record<string, unknown>>) {
          const id = String(item.id ?? '')
          if (!id || current.some((notification) => notification.id === id)) continue
          const type = item.type === 'learning' ? 'learning' : item.type === 'mail' ? 'mail' : 'system'
          const created = String(item.createdAt ?? new Date().toISOString())
          localStorage.setItem('ieum-notifications', JSON.stringify([{ id, type, title: String(item.title ?? (type === 'mail' ? '새 메일이 도착했습니다.' : '새 알림')), description: String(item.description ?? ''), createdAt: created, read: false }, ...current].slice(0, 50)))
        }
        window.dispatchEvent(new Event('notifications-updated'))
      } catch { /* 서버 알림 API가 없으면 로컬 알림만 사용 */ }
    }
    void syncServerNotifications()
    const timer = window.setInterval(syncServerNotifications, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const submitSearch = (value: string) => {
    if (onSearchSubmit) {
      onSearchSubmit(value)
      return
    }

    if (value) {
      navigate('/messages')
    }
  }

  return (
    <header style={headerStyle}>
      {/* 검색 */}
      <div
        style={searchStyle}
        onFocus={(event) => {
          event.currentTarget.style.borderColor = '#7560df'
          event.currentTarget.style.boxShadow =
            '0 0 0 2px rgba(117, 96, 223, 0.10)'
        }}
        onBlur={(event) => {
          event.currentTarget.style.borderColor = '#dedee3'
          event.currentTarget.style.boxShadow = 'none'
        }}
      >
        <SearchIcon />

        <input
          type="text"
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              submitSearch(event.currentTarget.value.trim())
            }
          }}
          placeholder={searchPlaceholder}
          aria-label="페이지 검색"
          style={inputStyle}
        />
      </div>

      {/* 오른쪽 아이콘 */}
      <div style={actionsStyle}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="알림"
            title="알림"
            style={iconButtonStyle}
            onClick={() => { setOpenNotifications((value) => !value); if (!openNotifications) markNotificationsRead() }}
          >
            <BellIcon />
            {unreadCount > 0 && <span style={{ position: 'absolute', top: 1, right: 0, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 999, background: '#c4144d', color: 'white', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {openNotifications && (
            <div style={{ position: 'absolute', right: 0, top: 38, width: 330, maxHeight: 360, overflowY: 'auto', background: 'white', border: '1px solid #e5e5e8', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,.12)', zIndex: 100 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #eeeef1', fontWeight: 700, fontSize: 13 }}>알림</div>
              {notifications.length === 0 ? <div style={{ padding: 24, color: '#999', fontSize: 12, textAlign: 'center' }}>새로운 알림이 없습니다.</div> : notifications.map((item) => <div key={item.id} style={{ padding: '13px 16px', borderBottom: '1px solid #f1f1f3', background: item.read ? '#fff' : '#faf8ff' }}><div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{item.title}</div><div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5, color: '#777' }}>{item.description}</div></div>)}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="도움말"
          title="도움말"
          style={iconButtonStyle}
          onClick={() =>
            window.alert(
              '검색어를 입력하면 해당 페이지의 검색 기능을 이용할 수 있습니다.',
            )
          }
        >
          <span
            aria-hidden="true"
            style={{
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid currentColor',
              borderRadius: '50%',
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
              boxSizing: 'border-box',
            }}
          >
            ?
          </span>
        </button>
      </div>
    </header>
  )
}