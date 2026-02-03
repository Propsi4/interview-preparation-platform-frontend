import { NavLink } from 'react-router-dom'
import {
  MessageCircle,
  LayoutDashboard,
  Search,
  ClipboardCheck,
  Settings,
} from 'lucide-react'

type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const primaryItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Chat', to: '/chat', icon: MessageCircle },
  { label: 'Search Queries', to: '/search-queries', icon: Search },
  { label: 'Evaluations', to: '/evaluations', icon: ClipboardCheck },
]

const secondaryItems: NavItem[] = [
  { label: 'Sessions', to: '/sessions', icon: Settings },
]

const Sidebar = () => {
  return (
    <aside className="flex w-72 flex-col border-r border-white/5 bg-surface px-5 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-surface">
          <img src="/favicon.svg" alt="nextround.ai Logo" className="h-10 w-10" />
        </div>
        <div>
          <p className="text-base font-semibold text-ink">NextRound.ai</p>
          <p className="text-xs text-ink/70">Interview preparation platform</p>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-1">
        {primaryItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-panel text-accent font-medium'
                    : 'text-ink/80 hover:bg-panel/70 hover:text-ink',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-4 space-y-2">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-ink/40">
          Management
        </p>
        {secondaryItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-panel text-accent font-medium'
                    : 'text-ink/80 hover:bg-panel/70 hover:text-ink',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </aside>
  )
}

export default Sidebar
