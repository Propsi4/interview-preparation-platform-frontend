import {
  MessageCircle,
  LayoutDashboard,
  Search,
  ClipboardCheck,
  Settings,
} from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

export const primaryItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Chat', to: '/chat', icon: MessageCircle },
  { label: 'Search Queries', to: '/search-queries', icon: Search },
  { label: 'Evaluations', to: '/evaluations', icon: ClipboardCheck },
]

export const secondaryItems: NavItem[] = [
  { label: 'Sessions', to: '/sessions', icon: Settings },
]
