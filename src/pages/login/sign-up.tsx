import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../images/ieum-logo.png'
import { registerAccount } from '../../users/auth'

const INPUT_CLASS = [
  'mt-2 h-11 w-full rounded-lg border border-[#d9d9df] px-3 text-sm outline-none',
  'transition placeholder:text-[#9b9ba2]',
  'focus:border-[#5b3df5] focus:ring-2 focus:ring-[#5b3df5]/10',
].join(' ')

function SignUpPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const passwordConfirm = String(form.get('passwordConfirm') || '')

    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)

    try {
      await registerAccount({ name, email, password })
      navigate(`/login?registered=true&email=${encodeURIComponent(email)}`, {
        replace: true,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '회원가입 중 문제가 발생했습니다.',
      )
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-5 py-12 text-[#202027]">
      <section className="mx-auto w-full max-w-125 rounded-2xl border border-[#e1e1e5] bg-white p-8 shadow-sm max-sm:p-5">
        <header className="text-center">
          <Link to="/login" className="inline-block transition hover:opacity-90">
            <img src={logo} alt="이음 로고" className="mx-auto h-24 w-44 object-contain" />
          </Link>
          <h1 className="text-2xl font-bold">회원가입</h1>
          <p className="mt-2 text-sm text-[#777981]">
            계정을 만든 뒤 로그인하면 온보딩이 시작됩니다.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-8">
          <div className="space-y-4">
            <label className="block text-xs font-medium">
              이름
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                maxLength={30}
                placeholder="이름을 입력해 주세요"
                className={INPUT_CLASS}
              />
            </label>

            <label className="block text-xs font-medium">
              이메일
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="example@email.com"
                className={INPUT_CLASS}
              />
            </label>

            <label className="block text-xs font-medium">
              비밀번호
              <span className="relative block">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="8자 이상 입력해 주세요"
                  className={`${INPUT_CLASS} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 rounded px-2 py-1 text-xs text-[#777981] hover:bg-[#f2f1fb]"
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </span>
            </label>

            <label className="block text-xs font-medium">
              비밀번호 확인
              <input
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="비밀번호를 다시 입력해 주세요"
                className={INPUT_CLASS}
              />
            </label>
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-2 text-xs leading-5 text-[#55565c]">
            <input name="terms" type="checkbox" required className="mt-1" />
            서비스 이용약관 및 개인정보 처리방침에 동의합니다.
          </label>

          {errorMessage && (
            <p role="alert" className="mt-4 text-sm text-[#c23e3e]">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 h-12 w-full rounded-lg bg-[#4338ca] text-sm font-bold text-white transition hover:bg-[#3730a3] disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? '가입 중...' : '회원가입하기'}
          </button>

          <p className="mt-5 text-center text-sm text-[#777981]">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-semibold text-[#4338ca] hover:underline">
              로그인
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}

export default SignUpPage
