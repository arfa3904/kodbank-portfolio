// Derives dashboard stats from the transaction list.
//
// NOTE: the backend has no "monthly income/spending/savings" or chart endpoint,
// so we compute what we can from /transactions:
//   - income  = sum of credits in the current month
//   - spending = sum of debits in the current month
//   - savings  = income - spending (a simple net for the month)
// The 6-month spending chart buckets transactions by month. When there isn't
// enough history, months render as zero. Swap this for a real endpoint later.

import type { MonthStats, SpendingPoint, Transaction } from '../types'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function formatCurrency(n: number): string {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function monthStats(txns: Transaction[], now = new Date()): MonthStats {
  const m = now.getMonth()
  const y = now.getFullYear()
  let income = 0
  let spending = 0
  for (const t of txns) {
    const d = new Date(t.created_at)
    if (isNaN(d.getTime()) || d.getMonth() !== m || d.getFullYear() !== y) continue
    if (t.type === 'credit') income += t.amount
    else spending += t.amount
  }
  return { income, spending, savings: income - spending }
}

export function spendingSeries(
  txns: Transaction[],
  months = 6,
  now = new Date(),
): SpendingPoint[] {
  const buckets: SpendingPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({ label: MONTH_LABELS[d.getMonth()], spending: 0, income: 0 })
  }
  const baseIndex = (d: Date) =>
    (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())

  for (const t of txns) {
    const d = new Date(t.created_at)
    if (isNaN(d.getTime())) continue
    const ago = baseIndex(d)
    if (ago < 0 || ago > months - 1) continue
    const bucket = buckets[months - 1 - ago]
    if (t.type === 'credit') bucket.income += t.amount
    else bucket.spending += t.amount
  }
  return buckets
}
