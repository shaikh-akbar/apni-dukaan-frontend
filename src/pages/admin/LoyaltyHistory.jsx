import { useEffect, useState } from 'react'
import { History, RefreshCw, Search } from 'lucide-react'
import { LOYALTY_ACTIONS, loyaltyColumns } from '../../components/columns'
import { Button, Card, ConfirmModal, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, Table } from '../../components/ui'
import { useToast } from '../../context/AppContext'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi, useDebounced } from '../../hooks/useApi'
import { useQueryState } from '../../hooks/useQueryState'
import { api } from '../../lib/api'

export default function LoyaltyHistory() {
  const toast = useToast()
  const { can } = useAdminAuth()
  const [f, setF] = useQueryState()
  const [search, setSearch] = useState(f.q || '')
  const q = useDebounced(search)
  useEffect(() => {
    if ((f.q || '') !== q) setF({ q })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  const { data, error, loading, reload } = useApi('/loyalty', { ...f, pageSize: 25 })

  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const runRecalc = async (dryRun) => {
    setBusy(true)
    try {
      const r = await api.post('/loyalty/recalculate', { dryRun })
      if (dryRun) setPreview(r)
      else {
        toast.success(`${r.customersChanged} customer(s) updated`, 'Recalculation complete')
        setPreview(null)
        reload()
      }
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Loyalty history"
        subtitle="Every Silver Count change, reward unlock and Gold upgrade — the full audit trail."
        actions={can('loyalty.recalculate') && <Button variant="secondary" icon={RefreshCw} loading={busy && !preview} onClick={() => runRecalc(true)}>Recalculate all</Button>}
      />
      <Card padded={false}>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <span className="label">Search</span>
            <Search className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-slate-400" />
            <input className="input pl-9" placeholder="Customer, mobile, ID or invoice…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select label="Action" value={f.action || ''} onChange={(e) => setF({ action: e.target.value })} placeholder="All actions" options={LOYALTY_ACTIONS} />
          <Input label="From" type="date" value={f.from || ''} onChange={(e) => setF({ from: e.target.value })} />
          <Input label="To" type="date" value={f.to || ''} onChange={(e) => setF({ to: e.target.value })} />
        </div>
        {error ? (
          <div className="p-4"><ErrorState error={error} onRetry={reload} /></div>
        ) : (
          <Table columns={loyaltyColumns()} rows={data?.items} loading={loading} empty={<EmptyState icon={History} title="No loyalty activity" />} />
        )}
        <Pagination meta={data?.meta} onPage={(page) => setF({ page })} />
      </Card>

      <ConfirmModal
        open={!!preview}
        onClose={() => setPreview(null)}
        onConfirm={preview?.customersChanged ? () => runRecalc(false) : () => setPreview(null)}
        loading={busy}
        title="Recalculate all customers"
        confirmLabel={preview?.customersChanged ? `Apply to ${preview.customersChanged} customer(s)` : 'Close'}
      >
        {preview && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>Checked <b>{preview.customersChecked}</b> customers against their purchase ledger and the current reward & Gold settings.</p>
            {preview.customersChanged ? (
              <ul className="max-h-60 list-disc space-y-1 overflow-y-auto rounded-lg bg-amber-50 p-3 pl-7 text-amber-900">
                {preview.results.map((r) => (
                  <li key={r.customerId}>
                    Customer #{r.customerId}: {r.countDrift ? `count ${r.previousCount} → ${r.newCount}; ` : ''}
                    {r.unlocked.length ? `unlock ${r.unlocked.map((u) => u.name).join(', ')}; ` : ''}
                    {r.revoked.length ? `revoke ${r.revoked.map((u) => u.name).join(', ')}; ` : ''}
                    {r.gold ? `gold ${r.gold.toLowerCase()}` : ''}
                    {r.flagged.length ? ` (${r.flagged.length} to review)` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">Everything is consistent. Nothing to change.</p>
            )}
            <p className="text-xs text-slate-500">Nothing changes until you apply. Historical purchases are never re-evaluated — each keeps the rule it was recorded under.</p>
          </div>
        )}
      </ConfirmModal>
    </div>
  )
}
