import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationsRead, type NotificationItem } from '../users/notifications'
import { fetchRecipients, type Recipient } from '../users/recipients'
import { fetchHistory, type HistoryItem } from '../users/history'
import { fetchConversations, type Conversation } from '../users/conversationArchive'
import { fetchInboxMessages, getGmailStatus } from '../users/inbox'

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
  const [searchResults, setSearchResults] = useState<Array<{ type: 'member' | 'history' | 'conversation'; id: string; title: string; subtitle: string }>>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchData, setSearchData] = useState<{ recipients: Recipient[]; history: HistoryItem[]; conversations: Conversation[] }>({ recipients: [], history: [], conversations: [] })

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
        // 1. Gmail 연동 상태 확인 및 새 메일 알림 동기화
        const status = await getGmailStatus()
        if (status.connected) {
          const inboxMessages = await fetchInboxMessages()
          if (active && Array.isArray(inboxMessages)) {
            const current = getNotifications()
            let hasNew = false
            for (const msg of inboxMessages.slice(0, 10)) {
              const notifId = `mail-${msg.id}`
              if (!current.some((notification) => notification.id === notifId)) {
                current.unshift({
                  id: notifId,
                  type: 'mail',
                  title: `[새 메일] ${msg.fromName || msg.fromEmail || '알 수 없음'}`,
                  description: msg.subject ? `${msg.subject} - ${msg.snippet}` : (msg.snippet || '새 메일이 도착했습니다.'),
                  createdAt: msg.date || new Date().toISOString(),
                  read: false,
                })
                hasNew = true
              }
            }
            if (hasNew) {
              localStorage.setItem('ieum-notifications', JSON.stringify(current.slice(0, 50)))
              window.dispatchEvent(new Event('notifications-updated'))
            }
          }
        }
      } catch {
        // ignore
      }
    }
    void syncServerNotifications()
    const timer = window.setInterval(syncServerNotifications, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([fetchRecipients(), fetchHistory(), fetchConversations()]).then(([recipients, history, conversations]) => {
      if (active) setSearchData({ recipients, history, conversations })
    }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    const updateSearchResults = async () => {
      const keyword = searchValue.trim().toLowerCase()
      if (!keyword) { setSearchResults([]); setSearchOpen(false); return }
      const members = searchData.recipients
      .filter((item) => `${item.name} ${item.role} ${item.company} ${item.country} ${item.language}`.toLowerCase().includes(keyword))
      .slice(0, 5)
      .map((item) => ({ type: 'member' as const, id: String(item.id), title: item.name, subtitle: `${item.role} · ${item.company}` }))
      const histories = searchData.history
      .filter((item) => `${item.recipient} ${item.purpose} ${item.content || ''} ${item.status}`.toLowerCase().includes(keyword))
      .slice(0, 5)
      .map((item) => ({ type: 'history' as const, id: item.id, title: item.purpose || '(제목 없음)', subtitle: `${item.recipient} · ${item.status}` }))
      const conversations = searchData.conversations
      .filter((item) => `${item.title} ${item.messages.map((message) => message.content).join(' ')}`.toLowerCase().includes(keyword))
      .slice(0, 5)
      .map((item) => ({ type: 'conversation' as const, id: item.id, title: item.title, subtitle: `대화 · ${item.messages.length}개 메시지` }))
      setSearchResults([...members, ...histories, ...conversations].slice(0, 10))
      setSearchOpen(true)
    }
    void updateSearchResults()
  }, [searchValue, searchData])

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

  const openSearchResult = (result: typeof searchResults[number]) => {
    setSearchOpen(false)
    if (result.type === 'member') navigate(`/recipients?member=${encodeURIComponent(result.id)}`)
    else if (result.type === 'history') navigate(`/history?message=${encodeURIComponent(result.id)}`)
    else navigate(`/messages?conversation=${encodeURIComponent(result.id)}`)
  }

  return (
    <header style={headerStyle}>
      {/* 검색 */}
      <div
        style={{ ...searchStyle, position: 'relative' }}
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
          onFocus={() => { if (searchValue.trim()) setSearchOpen(true) }}
        />
        {searchOpen && searchValue.trim() && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 43, background: '#fff', border: '1px solid #e2e0e8', borderRadius: 10, boxShadow: '0 12px 28px rgba(0,0,0,.12)', zIndex: 200, overflow: 'hidden' }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: '14px 16px', fontSize: 12, color: '#999' }}>검색 결과가 없습니다.</div>
            ) : searchResults.map((result) => (
              <button key={`${result.type}-${result.id}`} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => openSearchResult(result)} style={{ width: '100%', padding: '11px 14px', textAlign: 'left', border: 0, borderBottom: '1px solid #f0eff3', background: '#fff', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: result.type === 'member' ? '#5a42d7' : '#777' }}>{result.type === 'member' ? '멤버' : '메시지'}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{result.title}</span>
                </div>
                <div style={{ marginTop: 3, fontSize: 10, color: '#888' }}>{result.subtitle}</div>
              </button>
            ))}
          </div>
        )}
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
            <div style={{ position: 'absolute', right: 0, top: 38, width: 340, maxHeight: 380, overflowY: 'auto', background: 'white', border: '1px solid #e5e5e8', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,.12)', zIndex: 100 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #eeeef1', fontWeight: 700, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>알림</span>
                <span style={{ fontSize: 10, color: '#888', fontWeight: 'normal' }}>최신순</span>
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: 24, color: '#999', fontSize: 12, textAlign: 'center' }}>새로운 알림이 없습니다.</div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setOpenNotifications(false)
                      if (item.type === 'mail') {
                        navigate('/inbox')
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f1f3',
                      background: item.read ? '#fff' : '#faf8ff',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f0ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = item.read ? '#fff' : '#faf8ff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {item.type === 'mail' && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#eeebff', color: '#4f46e5', fontWeight: 600 }}>메일</span>}
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#222' }}>{item.title}</div>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.4, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                    {item.createdAt && <div style={{ marginTop: 4, fontSize: 9, color: '#aaa' }}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</div>}
                  </div>
                ))
              )}
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
