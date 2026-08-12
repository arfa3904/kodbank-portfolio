import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SpendingPoint } from '../../types'
import { formatCurrency } from '../../utils/stats'

export default function SpendingChart({ data }: { data: SpendingPoint[] }) {
  const empty = data.every((d) => d.spending === 0 && d.income === 0)

  return (
    <div className="chart-wrap">
      {empty && (
        <div className="chart-empty">No activity yet — make a transfer to see trends.</div>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b5ef" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#00b5ef" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#292075" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#292075" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#718096" />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            stroke="#718096"
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
          />
          <Tooltip
            formatter={(value: number, name) => [formatCurrency(value), name === 'spending' ? 'Spending' : 'Income']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#292075"
            strokeWidth={2}
            fill="url(#incomeFill)"
          />
          <Area
            type="monotone"
            dataKey="spending"
            stroke="#00b5ef"
            strokeWidth={2}
            fill="url(#spendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
