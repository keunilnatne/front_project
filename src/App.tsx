import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import CompanyDnaPage from './pages/CompanyDnaPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import Loginpage from './pages/Loginpage'
import MessagesPage from './pages/messages/MessagesPage'
import MessageOptimizedPage from './pages/messages/MessageOptimizedPage'
import MyProfilePage from './pages/my-profile'
import RecipientsPage from './pages/RecipientsPage'
import SettingsPage from './pages/Setting'
import TeamMemoryPage from './pages/TeamMemoryPage'
import Welcome from './pages/onbording/welcome'
import ProfileSetup from './pages/onbording/profile_setup'
import Communication from './pages/onbording/communication'
import AddRecipient from './pages/onbording/Add-recipient'
import Integrations from './pages/onbording/integrations'
import Complete from './pages/onbording/complete'

function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Loginpage />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/communication" element={<Communication />} />
      <Route path="/add-recipient" element={<AddRecipient />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/complete" element={<Complete />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/optimized" element={<MessageOptimizedPage />} />
        <Route path="/recipients" element={<RecipientsPage />} />
        <Route path="/company-dna" element={<CompanyDnaPage />} />
        <Route path="/team-memory" element={<TeamMemoryPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App