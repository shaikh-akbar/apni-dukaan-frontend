import { useEffect, useState } from 'react'
import { Filter, Search, UserPlus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBadge, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Table } from '../../components/ui'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi, useDebounced } from '../../hooks/useApi'
import { useQueryState } from '../../hooks/useQueryState'
import { date, money, number } from '../../lib/format'

export default function Customers() {
  const navigate = useNavigate()
  const { can } = useAdminAuth()
  const [f, setF, reset] = useQueryState({ sort: 'createdAt', order: 'desc' })
  const [search, setSearch] = useState(f.q || '')
  const q = useDebounced(search)
  const [showFilters, setShowFilters] = useState(!!(f.cardType || f.minCount || f.maxCount || f.from || f.to))

  useEffect(() => {
    if ((f.q || '') !== q) setF({ q })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const { data, error, loading, reload } = useApi('/customers', { ...f, pageSize: 20 })

  const columns = [
    { key: 'customerCode', label: 'Customer ID', render: (c) => <span className="font-mono text-xs text-slate-600">{c.customerCode}</span> },
    {
      key: 'fullName',
      label: 'Name',
      render: (c) => (
        <div>
          <p className="font-medium text-slate-900">{c.fullName}</p>
          {!c.isActive && <span className="text-xs text-red-600">Inactive</span>}
        </div>
      ),
    },
    { key: 'mobile', label: 'Mobile' },
    { key: 'totalPurchases', label: 'Purchases', align: 'right', render: (c) => number(c.totalPurchases) },
    { key: 'totalSpent', label: 'Total spent', align: 'right', render: (c) => money(c.totalSpent) },
    { key: 'silverCount', label: 'Silver count', align: 'right', render: (c) => <span className="font-semibold text-brand-700">{number(c.silverCount)}</span> },
    { key: 'cardType', label: 'Card', render: (c) => <CardBadge cardType={c.cardType} /> },
    {
      key: 'nextReward',
      label: 'Next reward',
      render: (c) =>
        c.nextReward ? (
          <span className="text-xs">
            <span className="font-medium text-slate-800">{c.nextReward.name}</span>
            <span className="text-slate-500"> · {c.nextReward.remaining} to go</span>
          </span>
        ) : (
          <span className="text-xs text-emerald-600">All unlocked</span>
        ),
    },
    { key: 'registrationDate', label: 'Registered', render: (c) => date(c.registrationDate) },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {can('purchases.create') && <Button size="sm" variant="ghost" to={`/admin/purchases/new?customerId=${c.id}`}>+ Purchase</Button>}
          {can('customers.edit') && <Button size="sm" variant="ghost" to={`/admin/customers/${c.id}/edit`}>Edit</Button>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={data ? `${number(data.meta.total)} customers` : ' '}
        actions={can('customers.create') && <Button to="/admin/customers/new" icon={UserPlus}>New customer</Button>}
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search by name, mobile or customer ID…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search customers" />
          </div>
          <div className="flex gap-2">
            <Select
              className="w-48"
              value={`${f.sort}:${f.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split(':')
                setF({ sort, order })
              }}
              options={[
                ['createdAt:desc', 'Newest first'],
                ['createdAt:asc', 'Oldest first'],
                ['silverCount:desc', 'Highest count'],
                ['totalSpent:desc', 'Top spenders'],
                ['fullName:asc', 'Name A–Z'],
              ]}
              aria-label="Sort"
            />
            <Button variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters((s) => !s)}>Filters</Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-6">
            <Select label="Card type" value={f.cardType || ''} onChange={(e) => setF({ cardType: e.target.value })} placeholder="All cards" options={[['SILVER', 'Silver'], ['GOLD', 'Gold members']]} />
            <Input label="Min count" type="number" min={0} value={f.minCount || ''} onChange={(e) => setF({ minCount: e.target.value })} />
            <Input label="Max count" type="number" min={0} value={f.maxCount || ''} onChange={(e) => setF({ maxCount: e.target.value })} />
            <Input label="Registered from" type="date" value={f.from || ''} onChange={(e) => setF({ from: e.target.value })} />
            <Input label="Registered to" type="date" value={f.to || ''} onChange={(e) => setF({ to: e.target.value })} />
            <div className="flex items-end">
              <Button variant="ghost" onClick={() => { setSearch(''); reset() }}>Clear all</Button>
            </div>
          </div>
        )}

        {error ? (
          <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
        ) : (
          <Table
            columns={columns}
            rows={data?.items}
            loading={loading}
            onRowClick={(c) => navigate(`/admin/customers/${c.id}`)}
            empty={<EmptyState icon={Users} title="No customers found" message={f.q ? 'Try a different name, mobile or ID.' : 'Register your first customer to get started.'} />}
          />
        )}
        <Pagination meta={data?.meta} onPage={(page) => setF({ page })} />
      </Card>
    </div>
  )
}
