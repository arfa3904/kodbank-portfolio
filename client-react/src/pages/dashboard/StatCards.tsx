import StatCard from '../../components/ui/StatCard'
import { formatCurrency } from '../../utils/stats'
import type { MonthStats } from '../../types'

export default function StatCards({ stats }: { stats: MonthStats }) {
  return (
    <div className="stat-grid">
      <StatCard
        label="Income this month"
        value={formatCurrency(stats.income)}
        icon="↓"
        tone="income"
        delta="Credited transfers"
      />
      <StatCard
        label="Spending this month"
        value={formatCurrency(stats.spending)}
        icon="↑"
        tone="spending"
        delta="Outgoing transfers"
      />
      <StatCard
        label="Net savings"
        value={formatCurrency(stats.savings)}
        icon="★"
        tone="savings"
        delta="Income − spending"
      />
    </div>
  )
}
