import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  tone?: 'income' | 'spending' | 'savings'
  delta?: string
}

export default function StatCard({ label, value, icon, tone = 'income', delta }: StatCardProps) {
  return (
    <div className={`ui-stat ui-stat--${tone}`}>
      <div className="ui-stat-icon">{icon}</div>
      <div className="ui-stat-body">
        <div className="ui-stat-label">{label}</div>
        <div className="ui-stat-value">{value}</div>
        {delta && <div className="ui-stat-delta">{delta}</div>}
      </div>
    </div>
  )
}
