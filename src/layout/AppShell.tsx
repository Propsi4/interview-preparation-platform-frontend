import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { usePageTitle } from '../hooks/usePageTitle'

const AppShell = () => {
  usePageTitle()
  return (
    <div className="flex h-screen overflow-hidden bg-surface text-base text-ink">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-panel/50 hover:scrollbar-thumb-panel">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppShell
