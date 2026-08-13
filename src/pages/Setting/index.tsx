import AccountSection from './Account Section'
import AiPersonalizationSection from './AI Personalization Section'
import IntegrationsSection from './Integrations Section'
import SecurityPrivacySection from './Security & Privacy Section'
import SettingLayout from './setting layout'

function SettingsPage() {
  return (
    <SettingLayout
      account={<AccountSection />}
      personalization={<AiPersonalizationSection />}
      integrations={<IntegrationsSection />}
      security={<SecurityPrivacySection />}
    />
  )
}

export default SettingsPage