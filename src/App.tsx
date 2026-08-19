import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import CompanyDnaPage from './pages/CompanyDnaPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import SignInPage from './pages/login/sign-in'
import SignUpPage from './pages/login/sign-up'
import MessagesPage from './pages/messages/MessagesPage'
import MessageOptimizedPage from './pages/messages/MessageOptimizedPage'
import DraftsPage from './pages/messages/DraftsPage'
import MyProfilePage from './pages/my-profile'
import RecipientsPage from './pages/RecipientsPage'
import SettingsPage from './pages/Setting'
import TeamMemoryPage from './pages/TeamMemoryPage'
import Welcome from './pages/onbording/welcome'
import ProfileSetup from './pages/onbording/profile_setup'
import Communication from './pages/onbording/communication'
import AddRecipient from './pages/onbording/Add-recipient'
import Integrations from './pages/onbording/integrations'
import InboxPage from './pages/InboxPage'
import Complete from './pages/onbording/complete'
import NoticeAdminPage from './pages/NoticeAdminPage'

function App() {
  return (
    <Routes>
      {/* 로그인 */}
      <Route index element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />

      {/* 온보딩 */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/communication" element={<Communication />} />
      <Route path="/add-recipient" element={<AddRecipient />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route path="/complete" element={<Complete />} />

      {/* 메인 서비스 */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route
          path="/messages/optimized"
          element={<MessageOptimizedPage />}
        />
        <Route path="/messages/drafts" element={<DraftsPage />} />
        <Route path="/recipients" element={<RecipientsPage />} />
        <Route path="/company-dna" element={<CompanyDnaPage />} />
        <Route path="/team-memory" element={<TeamMemoryPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
        <Route path="/admin/notices" element={<NoticeAdminPage />} />
      </Route>

      {/* 존재하지 않는 페이지 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App