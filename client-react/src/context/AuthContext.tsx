import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { me as fetchMe, login as apiLogin, logout as apiLogout } from '../api/auth'
import { checkBalance } from '../api/banking'
import { ApiError } from '../api/client'

type AuthStatus = 'loading' | 'authed' | 'guest'

interface AuthState {
  status: AuthStatus
  customerName: string | null
  email: string | null
  memberSince: string | null
  /** Latest known balance (also refreshed by the dashboard / after transfers). */
  balance: number | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Re-checks the session against the backend (used on app load + after 401). */
  refresh: () => Promise<void>
  setBalance: (n: number) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const [balance, setBalanceState] = useState<number | null>(null)

  const clearLocal = useCallback(() => {
    setStatus('guest')
    setCustomerName(null)
    setEmail(null)
    setMemberSince(null)
    setBalanceState(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const profile = await fetchMe()
      setCustomerName(profile.Cname)
      setEmail(profile.email)
      setMemberSince(profile.createdAt)
      setStatus('authed')
      try {
        const info = await checkBalance()
        setBalanceState(info.balance)
      } catch {
        /* balance can be refetched later; don't block auth on it */
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearLocal()
      } else {
        // Network/other error: treat as guest so the app doesn't hang on loading.
        clearLocal()
      }
    }
  }, [clearLocal])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (loginEmail: string, password: string) => {
      await apiLogin(loginEmail, password)
      await refresh()
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      clearLocal()
    }
  }, [clearLocal])

  const setBalance = useCallback((n: number) => setBalanceState(n), [])

  const value = useMemo<AuthState>(
    () => ({ status, customerName, email, memberSince, balance, login, logout, refresh, setBalance }),
    [status, customerName, email, memberSince, balance, login, logout, refresh, setBalance],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
