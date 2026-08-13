import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProfile, saveUserProfile } from '../../users/userProfile'

const PASSWORD_STORAGE_KEY = 'ieum.accountPassword'

function AccountSection() {
  const navigate = useNavigate()
  const profile = getUserProfile()

  const [name, setName] = useState(profile.name || '홍길동')
  const [email, setEmail] = useState(profile.email || 'jungmin@company.com')
  const [newPassword, setNewPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleLogout = () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return

    navigate('/login', { replace: true })
  }

  const handleSave = () => {
    if (!name.trim() || !email.trim()) {
      window.alert('이름과 이메일 주소를 모두 입력해주세요.')
      return
    }

    if (isChangingPassword && newPassword.length < 8) {
      window.alert('새 비밀번호는 8자 이상으로 입력해주세요.')
      return
    }

    if (isChangingPassword && newPassword !== passwordCheck) {
      window.alert('새 비밀번호가 서로 일치하지 않습니다.')
      return
    }

    if (!window.confirm('회원 정보를 변경하시겠습니까?')) return

    saveUserProfile({ name: name.trim(), email: email.trim() })

    if (isChangingPassword) {
      savePassword(newPassword)
      closePasswordForm()
    }

    showSavedMessage()
  }

  const closePasswordForm = () => {
    setNewPassword('')
    setPasswordCheck('')
    setIsChangingPassword(false)
  }

  const showSavedMessage = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section id="account" className="min-h-89.25 scroll-mt-8 rounded-xl border border-[#e1e1e1] bg-white p-6 shadow-sm">
      <h2 className="text-[16px] font-semibold">계정 (Account)</h2>
      <p className="mt-1 text-[12px] text-[#777981]">기본 계정 정보 및 로그인 설정을 관리합니다.</p>

      <div className="mt-8 grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-4 gap-y-4 text-[12px] max-sm:grid-cols-1 max-sm:gap-y-2">
        <label htmlFor="settings-name" className="text-right text-[#676971] max-sm:text-left">이름</label>
        <input
          id="settings-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-10 rounded-md border border-[#dedee3] px-3 outline-none focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/10"
        />

        <label htmlFor="settings-email" className="text-right text-[#676971] max-sm:text-left">이메일 주소</label>
        <input
          id="settings-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-10 rounded-md border border-[#dedee3] px-3 outline-none focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/10"
        />

        <span className="text-right text-[#676971] max-sm:text-left">비밀번호</span>
        <div>
          <button
            type="button"
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="h-9 rounded-md bg-[#f2f2f4] px-4 font-medium hover:bg-[#e9e9ed]"
          >
            {isChangingPassword ? '비밀번호 변경 취소' : '비밀번호 변경'}
          </button>
        </div>

        {isChangingPassword && (
          <>
            <label htmlFor="new-password" className="text-right text-[#676971] max-sm:text-left">새 비밀번호</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="8자 이상 입력"
              className="h-10 rounded-md border border-[#dedee3] px-3 outline-none focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/10"
            />

            <label htmlFor="password-check" className="text-right text-[#676971] max-sm:text-left">비밀번호 확인</label>
            <input
              id="password-check"
              type="password"
              autoComplete="new-password"
              value={passwordCheck}
              onChange={(event) => setPasswordCheck(event.target.value)}
              placeholder="새 비밀번호 다시 입력"
              className="h-10 rounded-md border border-[#dedee3] px-3 outline-none focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/10"
            />
          </>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-[#eeeeef] pt-5">
        <button type="button" onClick={handleLogout} className="text-[12px] font-medium text-[#e04b4b] hover:underline">로그아웃</button>

        <div className="flex items-center gap-3">
          {saved && <span className="text-[11px] text-[#56845e]">저장되었습니다.</span>}
          <button type="button" onClick={handleSave} className="h-9 rounded-lg bg-[#5146e5] px-5 text-[12px] font-semibold text-white hover:bg-[#4338ca]">변경사항 저장</button>
        </div>
      </div>
    </section>
  )
}

function savePassword(password: string) {
  // 현재 프로젝트에는 계정 API가 없어 로컬에 저장
  // 서버가 연결되면 이 함수만 비밀번호 변경 API 호출로 교체
  localStorage.setItem(PASSWORD_STORAGE_KEY, password)
}

export default AccountSection