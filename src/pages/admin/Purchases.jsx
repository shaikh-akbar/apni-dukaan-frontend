import { useEffect, useState } from 'react'
import { Filter, Plus, Search, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Table } from '../../components/ui'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi, useDebounced } from '../../hooks/useApi'
import { useQueryState } from '../../hooks/useQueryState'
import { date, money, number, PAYMENT_METHODS, paymentLabel } from '../../lib/format'

export default function Purchases() {
  const navigate = useNavigate()
  const { can } = useAdminAuth()
  const [f, setF, reset] = useQueryState({ sort: 'purchaseDate', order: 'desc' })
  const [search, setSearch] = useState(f.q || '')
  const q = useDebounced(search)
  const [showFilters, setShowFilters] = useState(!!(f.paymentMethod || f.status || f.from || f.to || f.minAmount || f.maxAmount || f.customerId))

  useEffect(() => {
    if ((f.q || '') !== q) setF({ q })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const { data, error, loading, reload } = useApi('/purchases', { ...f, pageSize: 20 })

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice', render: (p) => <span className="font-mono text-xs font-medium text-slate-900">{p.invoiceNumber}</span> },
    {
      key: 'customer',
      label: 'Customer',
      render: (p) => (
        <div>
          <p className="font-medium text-slate-900">{p.customer.fullName}</p>
          <p className="text-xs text-slate-500">{p.customer.customerCode}</p>
        </div>
      ),
    },
    { key: 'purchaseDate', label: 'Date', render: (p) => date(p.purchaseDate) },
    { key: 'finalAmount', label: 'Amount', align: 'right', render: (p) => <span className={p.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'font-medium'}>{money(p.finalAmount)}</span> },
    { key: 'paymentMethod', label: 'Payment', render: (p) => paymentLabel(p.paymentMethod) },
    { key: 'count', label: 'Loyalty count', align: 'right', render: (p) => (p.silverCountEarned ? <span className="font-semibold text-emerald-700">+{p.silverCountEarned}</span> : <span className="text-slate-400">0</span>) },
    { key: 'status', label: 'Status', render: (p) => (p.status === 'CANCELLED' ? <Badge color="red">Cancelled</Badge> : <Badge color="green">Active</Badge>) },
    { key: 'createdBy', label: 'Created by', render: (p) => p.createdBy.name },
  ]

  return (
    <div>
      <PageHeader
        title="Purchases"
        subtitle={data ? `${number(data.meta.total)} transactions` : ' '}
        actions={can('purchases.create') && <Button to="/admin/purchases/new" icon={Plus}>Add purchase</Button>}
      />
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search invoice, customer name, mobile or ID…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search purchases" />
          </div>
          <div className="flex gap-2">
            <Select
              className="w-48"
              value={`${f.sort}:${f.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split(':')
                setF({ sort, order })
              }}
              options={[['purchaseDate:desc', 'Newest first'], ['purchaseDate:asc', 'Oldest first'], ['finalAmount:desc', 'Highest amount'], ['finalAmount:asc', 'Lowest amount']]}
              aria-label="Sort"
            />
            <Button variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters((s) => !s)}>Filters</Button>
          </div>
        </div>
        {showFilters && (
          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-7">
            <Input label="From" type="date" value={f.from || ''} onChange={(e) => setF({ from: e.target.value })} />
            <Input label="To" type="date" value={f.to || ''} onChange={(e) => setF({ to: e.target.value })} />
            <Select label="Payment" value={f.paymentMethod || ''} onChange={(e) => setF({ paymentMethod: e.target.value })} placeholder="All methods" options={PAYMENT_METHODS} />
            <Select label="Status" value={f.status || ''} onChange={(e) => setF({ status: e.target.value })} placeholder="All" options={[['ACTIVE', 'Active'], ['CANCELLED', 'Cancelled']]} />
            <Input label="Min amount" type="number" min={0} value={f.minAmount || ''} onChange={(e) => setF({ minAmount: e.target.value })} />
            <Input label="Max amount" type="number" min={0} value={f.maxAmount || ''} onChange={(e) => setF({ maxAmount: e.target.value })} />
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
            onRowClick={(p) => navigate(`/admin/purchases/${p.id}`)}
            empty={<EmptyState icon={ShoppingBag} title="No purchases found" message="Try adjusting the filters." />}
          />
        )}
        <Pagination meta={data?.meta} onPage={(page) => setF({ page })} />
      </Card>
    </div>
  )
}
