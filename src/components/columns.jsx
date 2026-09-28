import { Link } from 'react-router-dom'
import { date, dateTime, money, paymentLabel } from '../lib/format'
import { Badge } from './ui'

/** Purchase history columns shared by the customer portal and admin customer profile. */
export function purchaseColumns({ minAmount, showAddedBy = true }) {
  return [
    { key: 'purchaseDate', label: 'Date', render: (p) => date(p.purchaseDate) },
    { key: 'invoiceNumber', label: 'Invoice', render: (p) => <span className="font-mono text-xs">{p.invoiceNumber}</span> },
    { key: 'finalAmount', label: 'Amount', align: 'right', render: (p) => <span className={p.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'font-medium'}>{money(p.finalAmount)}</span> },
    { key: 'paymentMethod', label: 'Paid by', render: (p) => paymentLabel(p.paymentMethod) },
    {
      key: 'eligible',
      label: 'Eligible?',
      render: (p) =>
        p.status === 'CANCELLED' ? <Badge color="red">Cancelled</Badge> : p.silverCountEarned > 0 ? <Badge color="green">Eligible</Badge> : <Badge>{p.isEligible ? `Below ${money(minAmount)}` : 'Excluded'}</Badge>,
    },
    {
      key: 'count',
      label: 'Silver count',
      render: (p) =>
        p.status === 'CANCELLED' && p.silverCountEarned > 0 ? (
          <span className="text-slate-400 line-through">+{p.silverCountEarned}</span>
        ) : p.silverCountEarned > 0 ? (
          <span className="font-semibold text-emerald-700">+{p.silverCountEarned} Silver Count</span>
        ) : (
          '—'
        ),
    },
    ...(showAddedBy ? [{ key: 'addedBy', label: 'Added by', render: (p) => p.addedBy || p.createdBy?.name || '—' }] : []),
  ]
}

const ACTION = {
  COUNT_ADDED: ['green', 'Silver Count Added'],
  COUNT_REMOVED: ['red', 'Silver Count Removed'],
  COUNT_ADJUSTED: ['amber', 'Count Adjusted'],
  REWARD_UNLOCKED: ['brand', 'Reward Unlocked'],
  REWARD_REVOKED: ['slate', 'Reward Revoked'],
  GOLD_UPGRADE: ['gold', 'Gold Upgrade'],
  GOLD_DOWNGRADE: ['slate', 'Gold Removed'],
}
export const LOYALTY_ACTIONS = Object.entries(ACTION).map(([k, [, l]]) => [k, l])

/** Loyalty ledger columns (admin loyalty history + customer profile tab). */
export function loyaltyColumns({ showCustomer = true } = {}) {
  return [
    { key: 'createdAt', label: 'Date', render: (t) => dateTime(t.createdAt) },
    ...(showCustomer
      ? [{ key: 'customer', label: 'Customer', render: (t) => <Link to={`/admin/customers/${t.customerId}`} className="font-medium text-brand-700 hover:underline">{t.customer?.fullName}</Link> }]
      : []),
    { key: 'action', label: 'Action', render: (t) => { const [c, l] = ACTION[t.action] || ['slate', t.action]; return <Badge color={c}>{l}</Badge> } },
    {
      key: 'delta',
      label: 'Change',
      align: 'right',
      render: (t) => (t.delta ? <span className={`font-semibold ${t.delta > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{t.delta > 0 ? `+${t.delta}` : t.delta}</span> : '—'),
    },
    { key: 'previousCount', label: 'Previous', align: 'right' },
    { key: 'newCount', label: 'New', align: 'right', render: (t) => <span className="font-semibold">{t.newCount}</span> },
    { key: 'reason', label: 'Reason', render: (t) => <span className="whitespace-normal">{t.reason}</span>, tdClassName: 'min-w-56 max-w-md' },
    { key: 'invoiceNumber', label: 'Invoice', render: (t) => (t.purchaseId ? <Link to={`/admin/purchases/${t.purchaseId}`} className="font-mono text-xs text-brand-700 hover:underline">{t.invoiceNumber}</Link> : '—') },
    { key: 'admin', label: 'Admin', render: (t) => t.admin?.name || 'System' },
  ]
}
