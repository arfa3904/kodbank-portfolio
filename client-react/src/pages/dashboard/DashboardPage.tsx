import { useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTransactions } from '../../hooks/useTransactions'
import { monthStats, spendingSeries } from '../../utils/stats'
import BalanceHero from './BalanceHero'
import StatCards from './StatCards'
import SpendingChart from './SpendingChart'
import RecentTransactions from './RecentTransactions'
import './dashboard.css'

export default function DashboardPage() {
  const { balance, customerName } = useAuth()
  const { transactions, loading } = useTransactions()

  const stats = useMemo(() => monthStats(transactions), [transactions])
  const series = useMemo(() => spendingSeries(transactions), [transactions])

  return (
    <>
      <div>
        <h1 className="page-title">
          Hi{customerName ? `, ${customerName.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="page-subtitle">Here's your money at a glance.</p>
      </div>

      <BalanceHero balance={balance} customerName={customerName} />

      <StatCards stats={stats} />

      <div className="dash-grid">
        <div className="card chart-card">
          <div className="section-head">
            <span className="section-title">Cash flow</span>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Last 6 months</span>
          </div>
          <SpendingChart data={series} />
        </div>

        <RecentTransactions transactions={transactions} loading={loading} />
      </div>
    </>
  )
}
