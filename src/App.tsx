import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import CompanyDnaPage from './pages/CompanyDnaPage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import MessagesPage from './pages/MessagesPage'
import RecipientsPage from './pages/RecipientsPage'
import SettingsPage from './pages/SettingsPage'
import TeamMemoryPage from './pages/TeamMemoryPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/recipients" element={<RecipientsPage />} />
        <Route path="/company-dna" element={<CompanyDnaPage />} />
        <Route path="/team-memory" element={<TeamMemoryPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App