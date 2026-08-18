import AccountSection from './Account Section'
import IntegrationsSection from './Integrations Section'
import SecurityPrivacySection from './Security & Privacy Section'
import SettingLayout from './setting layout'

function SettingsPage() {
  return (
    <SettingLayout
      account={<AccountSection />}
      integrations={<IntegrationsSection />}
      security={<SecurityPrivacySection />}
    />
  )
}

export default SettingsPage