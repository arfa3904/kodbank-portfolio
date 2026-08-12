import { Link } from 'react-router-dom'
import type { Transaction } from '../../types'
import { formatCurrency, formatDateTime } from '../../utils/stats'

interface Props {
  transactions: Transaction[]
  loading: boolean
}

export default function RecentTransactions({ transactions, loading }: Props) {
  const recent = transactions.slice(0, 4)

  return (
    <div className="card recent">
      <div className="section-head">
        <span className="section-title">Recent transactions</span>
        <Link to="/statement" className="recent-link">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="recent-empty">Loading…</div>
      ) : recent.length === 0 ? (
        <div className="recent-empty">No transactions yet.</div>
      ) : (
        <ul className="recent-list">
          {recent.map((t, i) => (
            <li key={i} className="recent-item">
              <span className={`recent-avatar ${t.type}`}>
                {t.type === 'credit' ? '↓' : '↑'}
              </span>
              <div className="recent-meta">
                <span className="recent-name">
                  {t.type === 'credit' ? 'From ' : 'To '}
                  {t.counterparty || 'Unknown'}
                </span>
                <span className="recent-date">{formatDateTime(t.created_at)}</span>
              </div>
              <span className={`recent-amount ${t.type}`}>
                {t.type === 'credit' ? '+ ' : '− '}
                {formatCurrency(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
