import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

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
        <button
          type="button"
          aria-label="알림"
          title="알림"
          style={iconButtonStyle}
        >
          <BellIcon />

          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 3,
              right: 2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#c4144d',
            }}
          />
        </button>

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