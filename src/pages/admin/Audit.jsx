import { useState } from 'react'
import { FileClock } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Modal, PageHeader, Pagination, Select, Table } from '../../components/ui'
import { useApi } from '../../hooks/useApi'
import { useQueryState } from '../../hooks/useQueryState'
import { dateTime, humanize } from '../../lib/format'

const ENTITIES = [['customer', 'Customer'], ['purchase', 'Purchase'], ['reward', 'Reward'], ['customer_reward', 'Reward claim'], ['settings', 'Settings'], ['admin_user', 'Staff'], ['role', 'Role']]

const tone = (action) => (/FAILED|CANCELLED|REVOKED|DOWNGRADE|REVIEW/.test(action) ? 'red' : /CREATED|UPGRADE|DELIVERED|REGISTERED/.test(action) ? 'green' : /UPDATED|CHANGED|RECALC/.test(action) ? 'amber' : 'slate')

export default function Audit() {
  const [f, setF] = useQueryState()
  const { data, error, loading, reload } = useApi('/audit-logs', { ...f, pageSize: 30 })
  const [open, setOpen] = useState(null)

  const columns = [
    { key: 'createdAt', label: 'When', render: (a) => dateTime(a.createdAt) },
    { key: 'actor', label: 'Actor', render: (a) => (a.admin ? a.admin.name : a.actorType === 'CUSTOMER' ? `Customer #${a.actorId}` : 'System') },
    { key: 'action', label: 'Action', render: (a) => <Badge color={tone(a.action)}>{humanize(a.action)}</Badge> },
    { key: 'entity', label: 'Record', render: (a) => `${humanize(a.entity)}${a.entityId ? ` #${a.entityId}` : ''}` },
    { key: 'ip', label: 'IP', render: (a) => <span className="font-mono text-xs text-slate-500">{a.ip || '—'}</span> },
    { key: 'view', label: '', render: (a) => (a.before || a.after ? <Button size="sm" variant="ghost" onClick={() => setOpen(a)}>Details</Button> : null) },
  ]

  return (
    <div>
      <PageHeader title="Audit log" subtitle="Who changed what, and when. Records are never deleted." />
      <Card padded={false}>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Select label="Record type" value={f.entity || ''} onChange={(e) => setF({ entity: e.target.value })} placeholder="All" options={ENTITIES} />
          <Input label="Record ID" value={f.entityId || ''} onChange={(e) => setF({ entityId: e.target.value })} />
          <Input label="Action contains" value={f.action || ''} onChange={(e) => setF({ action: e.target.value.toUpperCase() })} placeholder="e.g. PURCHASE" />
          <Input label="From" type="date" value={f.from || ''} onChange={(e) => setF({ from: e.target.value })} />
          <Input label="To" type="date" value={f.to || ''} onChange={(e) => setF({ to: e.target.value })} />
        </div>
        {error ? <div className="p-4"><ErrorState error={error} onRetry={reload} /></div> : <Table columns={columns} rows={data?.items} loading={loading} empty={<EmptyState icon={FileClock} title="No audit entries" />} />}
        <Pagination meta={data?.meta} onPage={(page) => setF({ page })} />
      </Card>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? humanize(open.action) : ''} size="xl">
        {open && (
          <div className="grid gap-4 lg:grid-cols-2">
            {['before', 'after'].map((k) => (
              <div key={k}>
                <p className="mb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">{k}</p>
                <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{open[k] ? JSON.stringify(open[k], null, 2) : '—'}</pre>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
