import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { apiError } from '../users/apiClient'
import { authorizationHeaders, getAuthToken, handle401Unauthorized } from '../users/authStorage'

const API_URL = import.meta.env.VITE_API_URL || ''

export function RequireAuth() {
  const token = getAuthToken()
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>(
    token ? 'checking' : 'denied',
  )

  useEffect(() => {
    if (!token) return

    let active = true
    void fetch(`${API_URL}/api/users/me`, {
      headers: authorizationHeaders(),
      cache: 'no-store',
    }).then((response) => {
      if (!response.ok) {
        if (response.status === 401) handle401Unauthorized()
        throw new Error('로그인이 필요합니다.')
      }
      if (active) setAccess('allowed')
    }).catch(() => {
      if (active) setAccess('denied')
    })

    return () => {
      active = false
    }
  }, [token])

  if (!token) return <Navigate to="/login" replace />
  if (access === 'checking') {
    return <AccessCheckMessage message="로그인 정보를 확인하는 중입니다." fullScreen />
  }
  return access === 'allowed' ? <Outlet /> : <Navigate to="/login" replace />
}

export function RequireAdmin() {
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied'>('checking')

  useEffect(() => {
    let active = true
    void fetch(`${API_URL}/api/users/me`, {
      headers: authorizationHeaders(),
      cache: 'no-store',
    }).then(async (response) => {
      if (!response.ok) throw await apiError(response, '관리자 권한을 확인하지 못했습니다.')
      const user = await response.json() as { admin?: boolean }
      if (active) setAccess(user.admin === true ? 'allowed' : 'denied')
    }).catch(() => {
      if (active) setAccess('denied')
    })

    return () => {
      active = false
    }
  }, [])

  if (access === 'checking') {
    return <AccessCheckMessage message="관리자 권한을 확인하는 중입니다." />
  }

  return access === 'allowed' ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function AccessCheckMessage({ message, fullScreen = false }: { message: string; fullScreen?: boolean }) {
  return (
    <div className={`flex items-center justify-center bg-[#f8f9fc] text-sm text-[#777981] ${fullScreen ? 'min-h-screen' : 'min-h-[50vh]'}`}>
      {message}
    </div>
  )
}
