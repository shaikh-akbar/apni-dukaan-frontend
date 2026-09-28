import { useState } from 'react'
import { Ban, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { loyaltyColumns } from '../../components/columns'
import { Badge, Button, Card, ConfirmModal, DescriptionList, ErrorState, PageHeader, PageLoader, Table, Textarea } from '../../components/ui'
import { useToast } from '../../context/AppContext'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { api } from '../../lib/api'
import { dateTime, money, paymentLabel } from '../../lib/format'

export default function PurchaseDetail() {
  const { id } = useParams()
  const toast = useToast()
  const { can } = useAdminAuth()
  const { data, error, reload } = useApi(`/purchases/${id}`)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <PageLoader />
  const p = data.purchase
  const cancelled = p.status === 'CANCELLED'

  const cancel = async () => {
    if (!reason.trim()) return toast.error('Please enter a reason')
    setCancelling(true)
    try {
      const { loyalty } = await api.del(`/purchases/${id}`, { reason: reason.trim() })
      toast.success(loyalty.previousCount !== loyalty.newCount ? `Silver count ${loyalty.previousCount} → ${loyalty.newCount}` : 'No loyalty change', 'Purchase cancelled')
      setCancelOpen(false)
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        back="/admin/purchases"
        title={<span className="flex flex-wrap items-center gap-3"><span className="font-mono">{p.invoiceNumber}</span>{cancelled ? <Badge color="red">Cancelled</Badge> : <Badge color="green">Active</Badge>}</span>}
        subtitle={dateTime(p.purchaseDate)}
        actions={
          !cancelled && (
            <>
              {can('purchases.edit') && <Button variant="secondary" icon={Pencil} to={`/admin/purchases/${id}/edit`}>Edit</Button>}
              {can('purchases.cancel') && <Button variant="danger" icon={Ban} onClick={() => setCancelOpen(true)}>Cancel purchase</Button>}
            </>
          )
        }
      />

      {cancelled && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Cancelled on {dateTime(p.cancelledAt)} by {p.cancelledBy?.name || '—'}. Reason: <b>{p.cancelReason}</b>
          {p.silverCountEarned > 0 && <> — the {p.silverCountEarned} Silver Count earned was reversed.</>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Bill" className="lg:col-span-2">
          {p.items.length > 0 && (
            <div className="-mx-5 mb-5 overflow-x-auto border-b border-slate-100">
              <table className="min-w-full text-sm">
                <thead><tr><th className="table-th">Product</th><th className="table-th text-right">Qty</th><th className="table-th text-right">Unit price</th><th className="table-th text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {p.items.map((i) => (
                    <tr key={i.id}><td className="table-td">{i.productName}</td><td className="table-td text-right">{i.quantity}</td><td className="table-td text-right tabular-nums">{money(i.unitPrice, { decimals: 2 })}</td><td className="table-td text-right tabular-nums">{money(i.lineTotal, { decimals: 2 })}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Total</dt><dd className="tabular-nums">{money(p.totalAmount, { decimals: 2 })}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Discount</dt><dd className="tabular-nums">− {money(p.discount, { decimals: 2 })}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-bold"><dt>Final amount</dt><dd className="tabular-nums">{money(p.finalAmount, { decimals: 2 })}</dd></div>
          </dl>
          {p.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{p.notes}</p>}
        </Card>

        <div className="space-y-6">
          <Card title="Details">
            <DescriptionList
              items={[
                ['Customer', <Link to={`/admin/customers/${p.customer.id}`} className="font-medium text-brand-700 hover:underline">{p.customer.fullName} ({p.customer.customerCode})</Link>],
                ['Payment method', paymentLabel(p.paymentMethod)],
                ['Loyalty', p.silverCountEarned ? <Badge color="green">+{p.silverCountEarned} Silver Count</Badge> : <Badge>{p.isEligible ? 'Below minimum' : 'Excluded'}</Badge>],
                ['Rule applied', `Min ${money(p.ruleMinAmount)}${p.ruleMultiple ? ', multiple counts' : ', 1 per bill'}`],
                ['Created by', `${p.createdBy.name} · ${dateTime(p.createdAt)}`],
                ['Last edited', p.updatedBy ? `${p.updatedBy.name} · ${dateTime(p.updatedAt)}` : null],
              ]}
            />
          </Card>
        </div>
      </div>

      <Card title="Loyalty ledger for this purchase" padded={false}>
        <Table columns={loyaltyColumns({ showCustomer: false })} rows={p.loyaltyTransactions} empty={<p className="px-5 py-6 text-sm text-slate-500">This purchase did not change the loyalty count.</p>} />
      </Card>

      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        loading={cancelling}
        danger
        title={`Cancel ${p.invoiceNumber}?`}
        message={`The purchase stays in history as cancelled${p.silverCountEarned ? ` and ${p.silverCountEarned} Silver Count will be removed from ${p.customer.fullName}` : ''}. Unclaimed rewards that are no longer reached will be revoked.`}
        confirmLabel="Cancel purchase"
      >
        <Textarea label="Reason" required className="mt-3" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} placeholder="e.g. Customer returned items" />
      </ConfirmModal>
    </div>
  )
}
