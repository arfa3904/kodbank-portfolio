import { useState } from 'react'
import Card from '../../components/ui/Card'

interface Biller {
  id: string
  name: string
  icon: string
  category: string
}

const BILLERS: Biller[] = [
  { id: 'electricity', name: 'Electricity', icon: '💡', category: 'Utilities' },
  { id: 'water', name: 'Water', icon: '🚰', category: 'Utilities' },
  { id: 'mobile', name: 'Mobile recharge', icon: '📱', category: 'Telecom' },
  { id: 'broadband', name: 'Broadband', icon: '🌐', category: 'Telecom' },
  { id: 'gas', name: 'Gas', icon: '🔥', category: 'Utilities' },
  { id: 'dth', name: 'DTH / TV', icon: '📺', category: 'Entertainment' },
]

export default function PayBills() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <Card className="paybills">
      <div className="section-head">
        <span className="section-title">Pay bills</span>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Quick pay</span>
      </div>
      <div className="biller-grid">
        {BILLERS.map((b) => (
          <button
            key={b.id}
            className={`biller ${selected === b.id ? 'is-selected' : ''}`}
            onClick={() => setSelected(b.id)}
          >
            <span className="biller-icon">{b.icon}</span>
            <span className="biller-name">{b.name}</span>
            <span className="biller-cat">{b.category}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="biller-note">
          {/* Pay-bills is a UI stub — no backend endpoint exists for it yet. */}
          Selected <strong>{BILLERS.find((b) => b.id === selected)?.name}</strong>. Bill
          payment will be available once the billing endpoint is wired up.
        </div>
      )}
    </Card>
  )
}
