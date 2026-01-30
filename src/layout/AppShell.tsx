import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

const AppShell = () => {
  return (
    <div className="flex min-h-screen bg-surface text-base text-ink">
      <Sidebar />
      <main className="flex flex-1 flex-col">
        <TopBar />
        <div className="flex-1 px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppShell
