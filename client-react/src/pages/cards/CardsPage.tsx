import CardVisual from './CardVisual'
import PayBills from './PayBills'
import './cards.css'

export default function CardsPage() {
  return (
    <>
      <div>
        <h1 className="page-title">Cards</h1>
        <p className="page-subtitle">
          Preview only — KODBANK doesn't issue physical/virtual cards yet, so this account has no real card
          attached.
        </p>
      </div>

      <div className="cards-grid">
        <div className="cards-visual-col">
          <CardVisual />
          <div className="card cards-controls">
            <button className="card-toggle" disabled title="Coming soon">
              <span>🔒</span> Freeze card
            </button>
            <button className="card-toggle" disabled title="Coming soon">
              <span>⚙️</span> Card settings
            </button>
            <button className="card-toggle" disabled title="Coming soon">
              <span>📈</span> Set limits
            </button>
          </div>
        </div>
        <PayBills />
      </div>
    </>
  )
}
