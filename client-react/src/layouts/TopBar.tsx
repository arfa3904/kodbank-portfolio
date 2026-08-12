import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function TopBar() {
  const { customerName, logout } = useAuth()
  const { show } = useToast()
  const initials = (customerName || 'A')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    await logout()
    show('Signed out successfully.', 'success')
  }

  return (
    <header className="shell-topbar">
      <div className="shell-topbar-mobile-brand">
        <span className="shell-brand-icon">🏦</span>
        <span className="shell-brand-name">KODBANK</span>
      </div>
      <div className="shell-topbar-right">
        <div className="shell-user">
          <div className="shell-avatar">{initials}</div>
          <div className="shell-user-meta">
            <span className="shell-user-hi">Welcome back</span>
            <span className="shell-user-name">{customerName || 'Account'}</span>
          </div>
        </div>
        <button className="shell-signout" onClick={() => void handleSignOut()}>
          Sign Out
        </button>
      </div>
    </header>
  )
}
