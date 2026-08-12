import { useAuth } from '../../context/AuthContext'
import { formatCurrency } from '../../utils/stats'

export default function CardVisual() {
  const { customerName, balance } = useAuth()
  return (
    <div className="bank-card">
      <div className="bank-card-shine" />
      <div className="bank-card-top">
        <span className="bank-card-brand">KODBANK</span>
        <span className="bank-card-chip">▦</span>
      </div>
      <div className="bank-card-number">
        <span>••••</span>
        <span>••••</span>
        <span>••••</span>
        <span>••••</span>
      </div>
      <div className="bank-card-bottom">
        <div>
          <div className="bank-card-label">Card holder</div>
          <div className="bank-card-value">{(customerName || 'KODBANK USER').toUpperCase()}</div>
        </div>
        <div>
          <div className="bank-card-label">Balance</div>
          <div className="bank-card-value">{balance == null ? '—' : formatCurrency(balance)}</div>
        </div>
        <div className="bank-card-network">VISA</div>
      </div>
    </div>
  )
}
