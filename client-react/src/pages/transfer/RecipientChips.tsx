import type { Receiver } from '../../types'

interface Props {
  receivers: Receiver[]
  loading: boolean
  selectedId: string
  onPick: (value: string) => void
}

export default function RecipientChips({ receivers, loading, selectedId, onPick }: Props) {
  if (loading) {
    return <div className="chips-empty">Loading recipients…</div>
  }
  if (receivers.length === 0) {
    return <div className="chips-empty">No recipients available yet.</div>
  }

  return (
    <div className="chips">
      {receivers.slice(0, 8).map((r) => {
        const value = String(r.Cid)
        const initials = (r.Cname || 'A')
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        return (
          <button
            type="button"
            key={r.Cid}
            className={`chip ${selectedId === value ? 'is-selected' : ''}`}
            onClick={() => onPick(value)}
          >
            <span className="chip-avatar">{initials}</span>
            <span className="chip-meta">
              <span className="chip-name">{r.Cname || `Account #${r.Cid}`}</span>
              <span className="chip-sub">#{r.Cid}{r.email_hint ? ` · ${r.email_hint}` : ''}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
