import { useState } from 'react'
import { FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import { Button, Card, EmptyState, ErrorState, Input, PageHeader, Select, StatCard } from '../../components/ui'
import { cx } from '../../lib/cx'
import { useToast } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { useQueryState } from '../../hooks/useQueryState'
import { download } from '../../lib/api'
import { date, money, number, PAYMENT_METHODS } from '../../lib/format'

const REPORTS = [
  ['customers', 'Customers', 'Purchases, spending, Silver Count and Gold status per customer'],
  ['purchases', 'Sales', 'Every transaction with invoice, customer, amount and payment method'],
  ['loyalty', 'Loyalty', 'Counts earned, removed and current count per customer'],
  ['rewards', 'Rewards', 'Every unlocked reward and where it is in the hand-over process'],
]

function cell(v, type) {
  if (v === null || v === undefined || v === '') return '—'
  if (type === 'money') return money(v, { decimals: 2 })
  if (type === 'date' || type === 'datetime') return date(v)
  if (type === 'int') return number(v)
  return String(v)
}

export default function Reports() {
  const toast = useToast()
  const [f, setF] = useQueryState({ type: 'customers' })
  const { type, ...filters } = f
  const { data, error, loading, reload } = useApi(`/reports/${type}`, filters)
  const rewards = useApi(type === 'rewards' ? '/rewards' : null)
  const [exporting, setExporting] = useState(null)

  const exportAs = async (format) => {
    setExporting(format)
    try {
      await download(`/reports/${type}`, { ...filters, format }, `${type}-report.${format}`)
    } catch (e) {
      toast.error(e)
    } finally {
      setExporting(null)
    }
  }

  const PREVIEW_LIMIT = 200
  const rows = data?.rows || []

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Filter, preview and export to CSV, Excel or PDF."
        actions={
          <>
            <Button variant="secondary" icon={FileDown} loading={exporting === 'csv'} onClick={() => exportAs('csv')}>CSV</Button>
            <Button variant="secondary" icon={FileSpreadsheet} loading={exporting === 'xlsx'} onClick={() => exportAs('xlsx')}>Excel</Button>
            <Button variant="secondary" icon={FileText} loading={exporting === 'pdf'} onClick={() => exportAs('pdf')}>PDF</Button>
          </>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map(([k, l, d]) => (
          <button key={k} onClick={() => setF({ type: k, cardType: '', paymentMethod: '', status: '', rewardId: '', minAmount: '', maxAmount: '' })} className={cx('card p-4 text-left transition', type === k ? 'ring-2 ring-brand-500' : 'hover:border-slate-300')}>
            <p className="font-semibold text-slate-900">{l} report</p>
            <p className="mt-0.5 text-xs text-slate-500">{d}</p>
          </button>
        ))}
      </div>

      <Card padded={false}>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <Input label={type === 'customers' ? 'Registered from' : type === 'rewards' ? 'Unlocked from' : 'From'} type="date" value={f.from || ''} onChange={(e) => setF({ from: e.target.value })} />
          <Input label="To" type="date" value={f.to || ''} onChange={(e) => setF({ to: e.target.value })} />
          {(type === 'customers' || type === 'loyalty') && (
            <Select label="Card" value={f.cardType || ''} onChange={(e) => setF({ cardType: e.target.value })} placeholder="All" options={[['SILVER', 'Silver'], ['GOLD', 'Gold']]} />
          )}
          {type === 'customers' && (
            <>
              <Input label="Min count" type="number" min={0} value={f.minCount || ''} onChange={(e) => setF({ minCount: e.target.value })} />
              <Input label="Max count" type="number" min={0} value={f.maxCount || ''} onChange={(e) => setF({ maxCount: e.target.value })} />
            </>
          )}
          {type === 'purchases' && (
            <>
              <Select label="Payment" value={f.paymentMethod || ''} onChange={(e) => setF({ paymentMethod: e.target.value })} placeholder="All" options={PAYMENT_METHODS} />
              <Select label="Status" value={f.status || ''} onChange={(e) => setF({ status: e.target.value })} placeholder="All" options={[['ACTIVE', 'Active'], ['CANCELLED', 'Cancelled']]} />
              <Input label="Min amount" type="number" min={0} value={f.minAmount || ''} onChange={(e) => setF({ minAmount: e.target.value })} />
              <Input label="Max amount" type="number" min={0} value={f.maxAmount || ''} onChange={(e) => setF({ maxAmount: e.target.value })} />
            </>
          )}
          {type === 'rewards' && (
            <>
              <Select label="Reward" value={f.rewardId || ''} onChange={(e) => setF({ rewardId: e.target.value })} placeholder="All" options={(rewards.data?.items || []).map((r) => [String(r.id), r.name])} />
              <Select label="Status" value={f.status || ''} onChange={(e) => setF({ status: e.target.value })} placeholder="All" options={[['AVAILABLE', 'Pending'], ['CLAIMED', 'Claimed'], ['DELIVERED', 'Delivered'], ['CANCELLED', 'Cancelled'], ['REVOKED', 'Revoked']]} />
            </>
          )}
        </div>

        {data?.summary && (
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 lg:grid-cols-4">
            {Object.entries(data.summary).map(([k, v]) => (
              <StatCard key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())} value={k === 'revenue' ? money(v) : number(v)} />
            ))}
          </div>
        )}

        {error ? (
          <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
        ) : loading && !data ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No data for these filters" />
        ) : (
          <div className={cx('overflow-x-auto', loading && 'opacity-60')}>
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>{data.columns.map((c) => <th key={c.key} className={cx('table-th', ['money', 'int'].includes(c.type) && 'text-right')}>{c.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.slice(0, PREVIEW_LIMIT).map((r, i) => (
                  <tr key={i}>
                    {data.columns.map((c) => <td key={c.key} className={cx('table-td', ['money', 'int'].includes(c.type) && 'text-right tabular-nums')}>{cell(r[c.key], c.type)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              {rows.length > PREVIEW_LIMIT ? `Showing first ${PREVIEW_LIMIT} of ${number(rows.length)} rows — export to get everything.` : `${number(rows.length)} rows`}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
