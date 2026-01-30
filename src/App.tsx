import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import SearchQueriesPage from './pages/SearchQueriesPage'
import ChatPage from './pages/ChatPage'
import EvaluationsPage from './pages/EvaluationsPage'
import SessionsPage from './pages/SessionsPage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="chat/:sessionId?" element={<ChatPage />} />
          <Route path="search-queries" element={<SearchQueriesPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
