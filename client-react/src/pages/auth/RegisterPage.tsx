import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api/auth'
import { ApiError } from '../../api/client'
import './auth.css'

type Strength = { label: string; score: 0 | 1 | 2 | 3; className: string }

function passwordStrength(pwd: string): Strength {
  if (!pwd) return { label: '', score: 0, className: '' }
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++
  if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd)) score++
  if (score <= 1) return { label: 'Weak', score: 1, className: 'weak' }
  if (score === 2) return { label: 'Okay', score: 2, className: 'okay' }
  return { label: 'Strong', score: 3, className: 'strong' }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const strength = useMemo(() => passwordStrength(password), [password])
  const passwordTooShort = password.length > 0 && password.length < 6
  const passwordsMismatch = submitted && confirmPassword !== '' && confirmPassword !== password

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitted(true)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      await register(name.trim(), email.trim(), password)
      setSuccess('Account created! Redirecting to sign in…')
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">🏦</div>
          <h1>KODBANK</h1>
          <p className="auth-tagline">Secure banking, simplified</p>
        </div>
        <p className="auth-sub">Create your account</p>

        {error && (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="banner banner--success" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="ui-field">
            <label className="ui-label" htmlFor="name">Full name</label>
            <input
              id="name"
              className="ui-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>
          <div className="ui-field">
            <label className="ui-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="ui-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="ui-field">
            <label className="ui-label" htmlFor="password">Password</label>
            <div className="auth-password-row">
              <input
                id="password"
                className="ui-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password && (
              <div className="auth-strength" aria-live="polite">
                <div className="auth-strength-bar">
                  <span className={`auth-strength-fill auth-strength-fill--${strength.className}`} />
                </div>
                <span className={`auth-strength-label auth-strength-label--${strength.className}`}>
                  {strength.label}
                </span>
              </div>
            )}
            {passwordTooShort && <small className="ui-error">Use at least 6 characters.</small>}
          </div>
          <div className="ui-field">
            <label className="ui-label" htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              className={`ui-input ${passwordsMismatch ? 'ui-input--error' : ''}`}
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
            {passwordsMismatch && <small className="ui-error">Passwords do not match.</small>}
          </div>
          <button className="ui-btn ui-btn--primary ui-btn--block" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
