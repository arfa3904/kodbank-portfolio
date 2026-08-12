import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../utils/stats'

interface Props {
  balance: number | null
  customerName: string | null
}

export default function BalanceHero({ balance, customerName }: Props) {
  const navigate = useNavigate()
  return (
    <section className="balance-hero">
      <div className="balance-hero-glow" />
      <div className="balance-hero-top">
        <span className="balance-hero-label">Available balance</span>
        <span className="balance-hero-acct">Savings • ****{(customerName || 'KOD').length}21</span>
      </div>
      <div className="balance-hero-amount">
        {balance == null ? '—' : formatCurrency(balance)}
      </div>
      <div className="balance-hero-actions">
        <button className="balance-hero-btn primary" onClick={() => navigate('/transfer')}>
          ↔ Transfer
        </button>
        <button className="balance-hero-btn" onClick={() => navigate('/statement')}>
          📋 Statement
        </button>
        <button className="balance-hero-btn" onClick={() => navigate('/cards')}>
          💳 Pay bills
        </button>
      </div>
    </section>
  )
}
