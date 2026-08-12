export interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/transfer', label: 'Transfer', icon: '↔' },
  { to: '/statement', label: 'Statement', icon: '📋' },
  { to: '/cards', label: 'Cards', icon: '💳' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]
