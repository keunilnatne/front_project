import { useEffect, useState, type FormEvent } from 'react'
import googleLogo from '../../images/google.png'
import { getGmailStatus } from '../../users/inbox'
import { getAuthToken, authorizationHeaders } from '../../users/authStorage'
import { requireOk } from '../../users/apiClient'
import { readUserStorage, writeUserStorage } from '../../users/storage'

type ServiceId = 'google' | 'slack' | 'teams'

type Service = {
  id: ServiceId
  name: string
  logo: string
  accountLabel: string
  accountPlaceholder: string
}

type Connections = Partial<Record<ServiceId, string>>
type GmailAuthMessage = { type: 'gmail-auth-success' | 'gmail-auth-error'; email?: string; message?: string }

const STORAGE_KEY = 'ieum.integrations'
const API_URL = import.meta.env.VITE_API_URL || ''

const services: Service[] = [
  {
    id: 'google',
    name: 'Google Workspace',
    logo: googleLogo,
    accountLabel: 'Google 계정 이메일',
    accountPlaceholder: 'name@company.com',
  },
]

function IntegrationsSection() {
  const [connections, setConnections] = useState<Connections>(getConnections)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; email: string | null }>({
    connected: false,
    email: null,
  })

  useEffect(() => {
    let active = true
    void getGmailStatus().then((status) => {
      if (!active) return
      setGoogleStatus(status)
      if (status.connected && status.email) {
        setConnections((prev) => {
          if (prev.google === status.email) return prev
          const next = { ...prev, google: status.email || undefined }
          saveConnections(next)
          return next
        })
      }
    }).catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const expectedOrigin = new URL(API_URL || window.location.origin, window.location.origin).origin
    const handleMessage = (event: MessageEvent<GmailAuthMessage>) => {
      if (event.origin !== expectedOrigin || !event.data || typeof event.data !== 'object') return
      if (event.data.type === 'gmail-auth-success' && event.data.email) {
        const updated = { ...connections, google: event.data.email }
        setConnections(updated)
        saveConnections(updated)
        setGoogleStatus({ connected: true, email: event.data.email })
      } else if (event.data.type === 'gmail-auth-error') {
        window.alert(event.data.message || 'Gmail 계정을 연결하지 못했습니다.')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [connections])

  const connectService = (serviceId: ServiceId, account: string) => {
    const updatedConnections = { ...connections, [serviceId]: account }
    setConnections(updatedConnections)
    saveConnections(updatedConnections)
    setSelectedService(null)
  }

  const disconnectService = async (service: Service) => {
    if (!window.confirm(`${service.name} 연결을 해제하시겠습니까?`)) return

    if (service.id === 'google') {
      try {
        const token = getAuthToken()
        if (token) {
          const response = await fetch(`${API_URL}/api/integrations/gmail/disconnect`, {
            method: 'DELETE',
            headers: authorizationHeaders(),
          })
          await requireOk(response, 'Gmail 연결을 해제하지 못했습니다.')
        }
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Gmail 연결을 해제하지 못했습니다.')
        return
      }
      setGoogleStatus({ connected: false, email: null })
      localStorage.removeItem('onboarding.gmail')
      localStorage.removeItem('onboarding.gmailEmail')
    }

    const updatedConnections = { ...connections }
    delete updatedConnections[service.id]

    setConnections(updatedConnections)
    saveConnections(updatedConnections)
  }

  const handleConnectClick = async (service: Service) => {
    if (service.id === 'google') {
      if (!getAuthToken()) {
        window.alert('로그인 후 Gmail 계정을 연결해 주세요.')
        return
      }
      const response = await fetch(`${API_URL}/api/integrations/gmail/connect`, {
        headers: authorizationHeaders(),
      })
      await requireOk(response, 'Gmail 연결을 시작하지 못했습니다.')
      const data = await response.json() as { authorizationUrl?: string }
      if (!data.authorizationUrl) throw new Error('Gmail 인증 주소를 받지 못했습니다.')
      const popup = window.open(data.authorizationUrl, 'gmail-connect', 'popup=yes,width=520,height=680,left=200,top=80')
      if (!popup) window.alert('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.')
      return
    }
    setSelectedService(service)
  }

  return (
    <section id="integrations" className="min-h-94.75 scroll-mt-8 rounded-xl border border-[#e1e1e1] bg-white p-6 shadow-sm">
      <h2 className="text-[16px] font-semibold">연결</h2>
      <p className="mt-1 text-[12px] text-[#777981]">외부 서비스 계정을 연결하여 AI 편집 기능을 확장하세요.</p>

      <div className="mt-6 space-y-3">
        {services.map((service) => {
          const isGoogle = service.id === 'google'
          const isGoogleConnected = isGoogle && googleStatus.connected
          const connectedAccount = isGoogle
            ? googleStatus.email || connections[service.id]
            : connections[service.id]
          const isConnected = isGoogle ? isGoogleConnected : Boolean(connectedAccount)

          return (
            <div key={service.id} className="flex min-h-17 items-center gap-4 rounded-lg border border-[#e1e1e5] px-4 py-3">
              <img src={service.logo} alt="" className="h-7 w-7 object-contain" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{service.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#777981]">
                  <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-[#3dbb67]' : 'bg-[#b7b8be]'}`} />
                  {isConnected ? `연결됨 · ${connectedAccount}` : '미연결'}
                </p>
              </div>

              {isGoogle && isConnected ? (
                <button
                  type="button"
                  onClick={() => { void disconnectService(service) }}
                  className="h-8 rounded-md border border-[#d9d9df] px-3 text-[10px] font-semibold hover:bg-[#f7f7f9]"
                >
                  연결 해제
                </button>
              ) : isConnected ? (
                <button
                  type="button"
                  onClick={() => disconnectService(service)}
                  className="h-8 rounded-md border border-[#d9d9df] px-3 text-[10px] font-semibold hover:bg-[#f7f7f9]"
                >
                  연결 해제
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { void handleConnectClick(service).catch((error) => window.alert(error instanceof Error ? error.message : '계정을 연결하지 못했습니다.')) }}
                  className="h-8 rounded-md bg-[#5146e5] px-3 text-[10px] font-semibold text-white transition hover:bg-[#4338ca]"
                >
                  계정 연결하기
                </button>
              )}
            </div>
          )
        })}
      </div>

      {selectedService && (
        <ConnectDialog
          service={selectedService}
          onConnect={connectService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </section>
  )
}

function ConnectDialog({ service, onConnect, onClose }: {
  service: Service
  onConnect: (serviceId: ServiceId, account: string) => void
  onClose: () => void
}) {
  const [account, setAccount] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onConnect(service.id, account.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="connection-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-105 rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <img src={service.logo} alt="" className="h-8 w-8 object-contain" />
          <div>
            <h3 id="connection-title" className="text-[15px] font-semibold">{service.name} 연결</h3>
            <p className="mt-1 text-[11px] text-[#777981]">연결할 계정 정보를 입력해주세요.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="integration-account" className="text-[12px] font-medium">{service.accountLabel}</label>
          <input
            id="integration-account"
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            placeholder={service.accountPlaceholder}
            required
            autoFocus
            className="mt-2 h-10 w-full rounded-md border border-[#dedee3] px-3 text-[12px] outline-none focus:border-[#5146e5] focus:ring-2 focus:ring-[#5146e5]/10"
          />

          <p className="mt-3 text-[10px] leading-4 text-[#85878e]">입력한 정보는 연결 상태를 표시하기 위해 현재 브라우저에 저장됩니다.</p>

          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-md border border-[#d9d9df] px-4 text-[11px] font-semibold hover:bg-[#f7f7f9]">취소</button>
            <button type="submit" className="h-9 rounded-md bg-[#5146e5] px-4 text-[11px] font-semibold text-white hover:bg-[#4338ca]">연결 완료</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getConnections(): Connections {
  try {
    const savedConnections = readUserStorage(STORAGE_KEY)
    return savedConnections ? JSON.parse(savedConnections) : {}
  } catch {
    return {}
  }
}

function saveConnections(connections: Connections) {
  writeUserStorage(STORAGE_KEY, JSON.stringify(connections))
}

export default IntegrationsSection
