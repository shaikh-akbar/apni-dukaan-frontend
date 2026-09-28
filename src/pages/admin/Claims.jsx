import { useEffect, useState } from 'react'
import { PackageCheck, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import ClaimActions from '../../components/ClaimActions'
import { Card, ClaimBadge, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Table } from '../../components/ui'
import { cx } from '../../lib/cx'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi, useDebounced } from '../../hooks/useApi'
import { useQueryState } from '../../hooks/useQueryState'
import { date } from '../../lib/format'

const STATUS_TABS = [
  ['', 'All'],
  ['AVAILABLE', 'Pending'],
  ['CLAIMED', 'Claimed'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
  ['REVOKED', 'Revoked'],
]

export default function Claims() {
  const { can } = useAdminAuth()
  const [f, setF] = useQueryState({ status: 'AVAILABLE' })
  const [search, setSearch] = useState(f.q || '')
  const q = useDebounced(search)
  useEffect(() => {
    if ((f.q || '') !== q) setF({ q })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  const { data, error, loading, reload } = useApi('/reward-claims', { ...f, status: f.status === 'ALL' ? undefined : f.status, pageSize: 20 })
  const rewards = useApi('/rewards')

  const columns = [
    {
      key: 'reward',
      label: 'Reward',
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900">{c.reward.name}</p>
          <p className="text-xs text-slate-500">at {c.milestone} counts</p>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (c) => (
        <Link to={`/admin/customers/${c.customer.id}`} className="hover:underline">
          <p className="font-medium text-brand-700">{c.customer.fullName}</p>
          <p className="text-xs text-slate-500">{c.customer.customerCode} · {c.customer.mobile}</p>
        </Link>
      ),
    },
    { key: 'status', label: 'Status', render: (c) => <ClaimBadge status={c.status} /> },
    {
      key: 'dates',
      label: 'Timeline',
      render: (c) => (
        <div className="text-xs leading-5 text-slate-600">
          <p>Unlocked {date(c.unlockedAt)}</p>
          {c.claimedAt && <p>Claimed {date(c.claimedAt)}</p>}
          {c.deliveredAt && <p>Delivered {date(c.deliveredAt)}</p>}
        </div>
      ),
    },
    { key: 'processedBy', label: 'By', render: (c) => c.processedBy?.name || '—' },
    ...(can('rewards.process') ? [{ key: 'actions', label: '', render: (c) => <ClaimActions claim={c} onDone={reload} /> }] : []),
  ]

  return (
    <div>
      <PageHeader title="Reward claims" subtitle="Hand over rewards customers have unlocked and track each one to delivery." />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {STATUS_TABS.map(([v, l]) => (
          <button key={v} onClick={() => setF({ status: v || 'ALL' })} className={cx('rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap', (f.status === 'ALL' ? '' : f.status) === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')}>
            {l}
          </button>
        ))}
      </div>
      <Card padded={false}>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <span className="label">Search customer</span>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-slate-400" />
            <input className="input pl-9" placeholder="Name, mobile or ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select label="Reward" value={f.rewardId || ''} onChange={(e) => setF({ rewardId: e.target.value })} placeholder="All rewards" options={(rewards.data?.items || []).map((r) => [String(r.id), `${r.name} (${r.requiredCount})`])} />
          <Input label="Unlocked from" type="date" value={f.from || ''} onChange={(e) => setF({ from: e.target.value })} />
          <Input label="Unlocked to" type="date" value={f.to || ''} onChange={(e) => setF({ to: e.target.value })} />
        </div>
        {error ? (
          <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
        ) : (
          <Table columns={columns} rows={data?.items} loading={loading} empty={<EmptyState icon={PackageCheck} title="No rewards in this state" />} />
        )}
        <Pagination meta={data?.meta} onPage={(page) => setF({ page })} />
      </Card>
    </div>
  )
}
