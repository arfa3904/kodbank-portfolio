import { useMemo, useState } from 'react'
import Card from '../../components/ui/Card'
import { useTransactions } from '../../hooks/useTransactions'
import { formatCurrency, formatDateTime } from '../../utils/stats'
import './statement.css'

type TypeFilter = 'all' | 'credit' | 'debit'

export default function StatementPage() {
  const { transactions, loading, error } = useTransactions()
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState<TypeFilter>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fromTs = from ? new Date(from + 'T00:00:00').getTime() : null
    const toTs = to ? new Date(to + 'T23:59:59').getTime() : null

    return transactions.filter((t) => {
      if (type !== 'all' && t.type !== type) return false
      if (q && !(t.counterparty || '').toLowerCase().includes(q)) return false
      const ts = new Date(t.created_at).getTime()
      if (fromTs != null && !isNaN(ts) && ts < fromTs) return false
      if (toTs != null && !isNaN(ts) && ts > toTs) return false
      return true
    })
  }, [transactions, search, from, to, type])

  const totals = useMemo(() => {
    let credit = 0
    let debit = 0
    for (const t of filtered) {
      if (t.type === 'credit') credit += t.amount
      else debit += t.amount
    }
    return { credit, debit }
  }, [filtered])

  function clearFilters() {
    setSearch('')
    setFrom('')
    setTo('')
    setType('all')
  }

  return (
    <>
      <div>
        <h1 className="page-title">Statement</h1>
        <p className="page-subtitle">All your transactions in one place.</p>
      </div>

      <Card className="filter-bar">
        <div className="filter-field filter-search">
          <label>Search</label>
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-field">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="filter-field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
            <option value="all">All</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>
        <button className="filter-clear" onClick={clearFilters}>
          Clear
        </button>
      </Card>

      <div className="statement-totals">
        <span className="muted">{filtered.length} transaction{filtered.length === 1 ? '' : 's'}</span>
        <span className="credit">In {formatCurrency(totals.credit)}</span>
        <span className="debit">Out {formatCurrency(totals.debit)}</span>
      </div>

      <Card padded={false} className="table-card">
        <div className="table-scroll">
          <table className="txn-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Counterparty</th>
                <th>Type</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="table-state">Loading…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="table-state">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-state">No transactions match your filters.</td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr key={i}>
                    <td>{formatDateTime(t.created_at)}</td>
                    <td>{t.counterparty || 'Unknown'}</td>
                    <td>
                      <span className={`pill pill--${t.type}`}>
                        {t.type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td className={`num ${t.type}`}>
                      {t.type === 'credit' ? '+ ' : '− '}
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
