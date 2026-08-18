import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { getUserProfile, fetchUserProfile } from '../users/userProfile'
import logo from '../images/logo.png'

type NavigationItem = {
  label: string
  path: string
  icon: string
}

const navigationItems: NavigationItem[] = [
  {
    label: '대시보드',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    label: '메시지',
    path: '/messages',
    icon: 'message',
  },
  {
    label: '수신자',
    path: '/recipients',
    icon: 'users',
  },
  {
    label: '받은 메시지',
    path: '/inbox',
    icon: 'inbox',
  },
  {
    label: '기록',
    path: '/history',
    icon: 'history',
  },
  {
    label: 'Team Memory',
    path: '/team-memory',
    icon: 'memory',
  },
  // Company DNA 메뉴는 임시 숨김 처리 (추후 재활성화를 위해 코드 및 컴포넌트 보존)
  // {
  //   label: 'Company DNA',
  //   path: '/company-dna',
  //   icon: 'dna',
  // },
]

function MenuIcon({
  type,
  active,
}: {
  type: string
  active: boolean
}) {
  const color = active ? '#4338CA' : '#6B6B73'

  if (type === 'dashboard') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      >
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </svg>
    )
  }

  if (type === 'inbox') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      >
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    )
  }

  if (type === 'message') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      >
        <path d="M4 5h16v11H8l-4 4V5Z" />
        <path d="M8 9h8M8 12h6" />
      </svg>
    )
  }

  if (type === 'users') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
        <path d="M16 5.5a3 3 0 0 1 0 5.5" />
        <path d="M18 14c2 .5 3 2 3 4" />
      </svg>
    )
  }

  if (type === 'dna') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      >
        <path d="M7 3c6 4 6 14 0 18" />
        <path d="M17 3c-6 4-6 14 0 18" />
        <path d="M8 7h8M7 12h10M8 17h8" />
      </svg>
    )
  }

  if (type === 'memory') {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      >
        <rect x="6" y="6" width="12" height="12" rx="2" />
        <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3" />
        <path d="M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
      </svg>
    )
  }

  /*
  if (type === 'global') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.8 9h16.4M3.8 15h16.4M12 3.5c2.2 2.3 3.4 5.1 3.4 8.5S14.2 18.2 12 20.5C9.8 18.2 8.6 15.4 8.6 12S9.8 5.8 12 3.5Z" />
      </svg>
    )
  }
  */

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v6h6" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2H15V5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  )
}

function AppLayout() {
  const [profile, setProfile] = useState(getUserProfile)
  useEffect(() => {
    void fetchUserProfile().then((p) => setProfile(p))
    const updateProfile = () => setProfile(getUserProfile())
    window.addEventListener('profile-updated', updateProfile)
    window.addEventListener('storage', updateProfile)
    return () => { window.removeEventListener('profile-updated', updateProfile); window.removeEventListener('storage', updateProfile) }
  }, [])
  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-[#e5e5e8] bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center px-6">
          <img src={logo} alt="이음" className="h-8 w-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pt-4">
          <div className="flex flex-col gap-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'flex h-10 items-center gap-3 rounded-md px-3',
                    'text-[14px] font-medium',
                    'transition-colors',
                    isActive
                      ? 'bg-[#f0edff] text-[#4338ca]'
                      : 'text-[#55565c] hover:bg-[#f7f7fa]',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <MenuIcon
                      type={item.icon}
                      active={isActive}
                    />

                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-[#e5e5e8]" />

          {/* Settings */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [
                'flex h-10 items-center gap-3 rounded-md px-3',
                'text-[14px] font-medium transition-colors',
                isActive
                  ? 'bg-[#f0edff] text-[#4338ca]'
                  : 'text-[#55565c] hover:bg-[#f7f7fa]',
              ].join(' ')
            }
          >
            <SettingsIcon />
            <span>설정</span>
          </NavLink>
        </nav>

        {/* User */}
        <div className="p-4">
          <NavLink to="/my-profile" aria-label="내 프로필 보기" className={({ isActive }) => `flex items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[#f0edff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]/30 ${isActive ? 'bg-[#f0edff]' : ''}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5546e8]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.7"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c.7-3.5 3.2-5.5 7-5.5s6.3 2 7 5.5" />
              </svg>
            </div>

            <div>
              <p className="text-[14px] font-semibold text-[#29292d]">
                {profile.name || '이름 미설정'}
              </p>
              <p className="text-[13px] text-[#999aa0]">
                {profile.role || '직무 미설정'}
              </p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout