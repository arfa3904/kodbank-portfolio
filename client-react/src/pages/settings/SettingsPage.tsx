import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import './settings.css'

function formatMemberSince(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function SettingsPage() {
  const { customerName, email, memberSince, logout } = useAuth()
  const { show } = useToast()

  async function handleSignOut() {
    await logout()
    show('Signed out successfully.', 'success')
  }

  return (
    <>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile and preferences.</p>
      </div>

      <Card className="settings-card">
        <div className="section-head">
          <span className="section-title">Profile</span>
        </div>
        <div className="settings-row">
          <span className="muted">Name</span>
          <span>{customerName || '—'}</span>
        </div>
        <div className="settings-row">
          <span className="muted">Email</span>
          <span>{email || '—'}</span>
        </div>
        <div className="settings-row">
          <span className="muted">Account type</span>
          <span>Savings</span>
        </div>
        <div className="settings-row">
          <span className="muted">Member since</span>
          <span>{formatMemberSince(memberSince)}</span>
        </div>
      </Card>

      <Card className="settings-card">
        <div className="section-head">
          <span className="section-title">Preferences</span>
          <span className="badge-soon">Coming soon</span>
        </div>
        {[
          ['Email notifications', true],
          ['Transaction alerts', true],
          ['Marketing emails', false],
        ].map(([label, on]) => (
          <div className="settings-row is-disabled" key={label as string}>
            <span>{label as string}</span>
            <span className={`toggle ${on ? 'is-on' : ''}`} aria-hidden>
              <span className="toggle-knob" />
            </span>
          </div>
        ))}
      </Card>

      <Card className="settings-card">
        <div className="section-head">
          <span className="section-title">Security</span>
        </div>
        <div className="settings-actions">
          <Button variant="secondary" disabled title="Coming soon">
            Change password
          </Button>
          <Button variant="danger" onClick={() => void handleSignOut()}>
            Sign out
          </Button>
        </div>
      </Card>
    </>
  )
}
