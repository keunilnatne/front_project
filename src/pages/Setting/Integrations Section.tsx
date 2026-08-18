import { useEffect, useState, type FormEvent } from 'react'
import googleLogo from '../../images/google.png'
import { getGmailStatus } from '../../users/inbox'
import { getAuthToken, authorizationHeaders } from '../../users/authStorage'

type ServiceId = 'google' | 'slack' | 'teams'

type Service = {
  id: ServiceId
  name: string
  logo: string
  accountLabel: string
  accountPlaceholder: string
}

type Connections = Partial<Record<ServiceId, string>>

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
    })
    return () => {
      active = false
    }
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
          await fetch(`${API_URL}/api/integrations/gmail/disconnect`, {
            method: 'DELETE',
            headers: authorizationHeaders(),
          })
        }
      } catch (err) {
        console.warn('Gmail disconnect API error:', err)
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

  const handleConnectClick = (service: Service) => {
    if (service.id === 'google') {
      const token = getAuthToken() || ''
      window.location.href = `${API_URL}/api/auth/google${token ? `?state=${encodeURIComponent(token)}` : ''}`
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
                  disabled
                  className="h-8 cursor-not-allowed rounded-md border border-[#e1e1e5] bg-[#f5f5f7] px-3 text-[10px] font-semibold text-[#8e8e93]"
                >
                  연결됨
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
                  onClick={() => handleConnectClick(service)}
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
    const savedConnections = localStorage.getItem(STORAGE_KEY)
    return savedConnections ? JSON.parse(savedConnections) : {}
  } catch {
    return {}
  }
}

function saveConnections(connections: Connections) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
}

export default IntegrationsSection