import { useRef, useState } from 'react'
import { Camera, Pencil, RefreshCw, ShoppingBag } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { loyaltyColumns, purchaseColumns } from '../../components/columns'
import { GoldBenefits, JourneyHero, MembershipCard, MilestoneTimeline } from '../../components/loyalty'
import {
  Avatar, Badge, Button, Card, CardBadge, ClaimBadge, ConfirmModal, DescriptionList, EmptyState, ErrorState, PageHeader, PageLoader, Pagination, StatCard, Table,
} from '../../components/ui'
import { cx } from '../../lib/cx'
import { useSettings, useToast } from '../../context/AppContext'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { api } from '../../lib/api'
import { date, dateTime, humanize, money, number } from '../../lib/format'
import ClaimActions from '../../components/ClaimActions'


const TABS = [
  ['overview', 'Overview'],
  ['purchases', 'Purchase history'],
  ['loyalty', 'Loyalty history'],
  ['rewards', 'Rewards'],
]

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { can } = useAdminAuth()
  const { settings } = useSettings()
  const [tab, setTab] = useState('overview')
  const overview = useApi(`/customers/${id}`)
  const fileRef = useRef(null)
  const [recalc, setRecalc] = useState(null)
  const [recalcLoading, setRecalcLoading] = useState(false)

  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />
  if (!overview.data) return <PageLoader />
  const { customer, journey, stats } = overview.data

  const uploadPhoto = async (file) => {
    if (!file) return
    const fd = new FormData()
    fd.append('photo', file)
    try {
      await api.post(`/customers/${id}/photo`, fd)
      overview.reload()
      toast.success('Photo updated')
    } catch (e) {
      toast.error(e)
    }
  }

  const previewRecalc = async () => {
    setRecalcLoading(true)
    try {
      setRecalc(await api.post(`/customers/${id}/loyalty/recalculate`, { dryRun: true }))
    } catch (e) {
      toast.error(e)
    } finally {
      setRecalcLoading(false)
    }
  }

  const applyRecalc = async () => {
    setRecalcLoading(true)
    try {
      await api.post(`/customers/${id}/loyalty/recalculate`, { dryRun: false })
      toast.success('Loyalty state recalculated')
      setRecalc(null)
      overview.reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setRecalcLoading(false)
    }
  }

  const recalcHasChanges = recalc && (recalc.countDrift || recalc.unlocked.length || recalc.revoked.length || recalc.gold)

  return (
    <div className="space-y-6">
      <PageHeader
        back="/admin/customers"
        title={
          <span className="flex items-center gap-3">
            <span className="relative">
              <Avatar name={customer.fullName} src={customer.profilePhoto} size="lg" />
              {can('customers.edit') && (
                <button onClick={() => fileRef.current?.click()} className="absolute -right-1 -bottom-1 rounded-full bg-white p-1 text-slate-600 shadow ring-1 ring-slate-200 hover:text-brand-600" aria-label="Change photo">
                  <Camera className="size-3.5" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
            </span>
            <span className="min-w-0">
              <span className="block truncate">{customer.fullName}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-normal text-slate-500">
                <span className="font-mono">{customer.customerCode}</span> · +91 {customer.mobile} <CardBadge cardType={customer.cardType} />
                {!customer.isActive && <Badge color="red">Inactive</Badge>}
              </span>
            </span>
          </span>
        }
        actions={
          <>
            {can('loyalty.recalculate') && <Button variant="secondary" icon={RefreshCw} onClick={previewRecalc} loading={recalcLoading && !recalc}>Recalculate</Button>}
            {can('customers.edit') && <Button variant="secondary" icon={Pencil} to={`/admin/customers/${id}/edit`}>Edit</Button>}
            {can('purchases.create') && customer.isActive && <Button icon={ShoppingBag} to={`/admin/purchases/new?customerId=${id}`}>Add purchase</Button>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Silver count" value={number(stats.silverCount)} tone="brand" />
        <StatCard label="Eligible purchases" value={number(stats.eligiblePurchases)} tone="green" hint={`${number(stats.totalPurchases)} transactions in total`} />
        <StatCard label="Total spent" value={money(stats.totalSpent)} tone="sky" />
        <StatCard label="Last purchase" value={stats.lastPurchaseDate ? date(stats.lastPurchaseDate) : '—'} tone="slate" />
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cx('-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap', tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <JourneyHero journey={journey} />
            <Card title="Reward milestones">
              <MilestoneTimeline journey={journey} />
            </Card>
          </div>
          <div className="space-y-6 lg:col-span-2">
            <MembershipCard customer={customer} programName={settings?.programName} />
            {customer.membershipCard && (
              <Card title="Gold membership">
                <DescriptionList
                  items={[
                    ['Card number', <span className="font-mono">{customer.membershipCard.cardNumber}</span>],
                    ['Status', <Badge color={customer.membershipCard.status === 'ACTIVE' ? 'green' : 'slate'}>{humanize(customer.membershipCard.status)}</Badge>],
                    ['Gold since', date(customer.membershipCard.upgradedAt)],
                  ]}
                />
                <div className="mt-4"><GoldBenefits benefits={customer.membershipCard.benefits} /></div>
              </Card>
            )}
            <Card title="Personal information">
              <DescriptionList
                items={[
                  ['Mobile', `+91 ${customer.mobile}`],
                  ['Email', customer.email],
                  ['Date of birth', customer.dateOfBirth && date(customer.dateOfBirth)],
                  ['Gender', humanize(customer.gender) || null],
                  ['Address', [customer.address, customer.city, customer.pincode].filter(Boolean).join(', ') || null],
                  ['Registered', date(customer.registrationDate)],
                  ['Registered by', customer.createdBy?.name || 'Self sign-up'],
                ]}
              />
            </Card>
          </div>
        </div>
      )}

      {tab === 'purchases' && <PurchasesTab id={id} minAmount={settings?.minPurchaseAmount} onOpen={(p) => navigate(`/admin/purchases/${p.id}`)} />}
      {tab === 'loyalty' && <LoyaltyTab id={id} />}
      {tab === 'rewards' && <RewardsTab id={id} canProcess={can('rewards.process')} onChange={overview.reload} />}

      <ConfirmModal
        open={!!recalc}
        onClose={() => setRecalc(null)}
        onConfirm={recalcHasChanges ? applyRecalc : () => setRecalc(null)}
        loading={recalcLoading}
        title="Recalculate loyalty"
        confirmLabel={recalcHasChanges ? 'Apply changes' : 'Close'}
      >
        {recalc && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>Rebuilds the Silver count from this customer's active purchases and re-checks rewards and Gold status against the <b>current</b> program settings.</p>
            {recalcHasChanges ? (
              <ul className="list-disc space-y-1 rounded-lg bg-amber-50 p-3 pl-7 text-amber-900">
                {recalc.countDrift !== 0 && <li>Silver count {recalc.previousCount} → {recalc.newCount}</li>}
                {recalc.unlocked.map((u) => <li key={u.rewardId}>Unlock “{u.name}” ({u.requiredCount})</li>)}
                {recalc.revoked.map((u) => <li key={u.rewardId}>Revoke unclaimed “{u.name}”</li>)}
                {recalc.gold && <li>Gold: {humanize(recalc.gold)}</li>}
              </ul>
            ) : (
              <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">Everything is already consistent. No changes needed.</p>
            )}
            {recalc.flagged.length > 0 && <p className="text-xs text-red-700">{recalc.flagged.length} claimed/delivered reward(s) are above the current count and need manual review.</p>}
          </div>
        )}
      </ConfirmModal>
    </div>
  )
}

function PurchasesTab({ id, minAmount, onOpen }) {
  const [page, setPage] = useState(1)
  const { data, loading } = useApi(`/customers/${id}/purchases`, { page, pageSize: 15 })
  return (
    <Card padded={false}>
      <Table columns={purchaseColumns({ minAmount })} rows={data?.items} loading={loading} onRowClick={onOpen} empty={<EmptyState title="No purchases yet" />} />
      <Pagination meta={data?.meta} onPage={setPage} />
    </Card>
  )
}

function LoyaltyTab({ id }) {
  const [page, setPage] = useState(1)
  const { data, loading } = useApi(`/customers/${id}/loyalty`, { page, pageSize: 20 })
  return (
    <Card padded={false}>
      <Table columns={loyaltyColumns({ showCustomer: false })} rows={data?.items} loading={loading} empty={<EmptyState title="No loyalty activity yet" />} />
      <Pagination meta={data?.meta} onPage={setPage} />
    </Card>
  )
}

function RewardsTab({ id, canProcess, onChange }) {
  const { data, loading, reload } = useApi(`/customers/${id}/rewards`)
  const columns = [
    { key: 'reward', label: 'Reward', render: (r) => <span className="font-medium text-slate-900">{r.reward.name}</span> },
    { key: 'milestone', label: 'Milestone', align: 'right' },
    { key: 'status', label: 'Status', render: (r) => <ClaimBadge status={r.status} /> },
    { key: 'unlockedAt', label: 'Unlocked', render: (r) => date(r.unlockedAt) },
    { key: 'claimedAt', label: 'Claimed', render: (r) => date(r.claimedAt) },
    { key: 'deliveredAt', label: 'Delivered', render: (r) => date(r.deliveredAt) },
    { key: 'processedBy', label: 'Processed by', render: (r) => r.processedBy?.name || '—' },
    { key: 'notes', label: 'Notes', render: (r) => <span className="text-xs text-slate-500" title={r.notes || ''}>{r.notes || '—'}</span> },
    ...(canProcess ? [{ key: 'actions', label: '', render: (r) => <ClaimActions claim={r} onDone={() => { reload(); onChange() }} /> }] : []),
  ]
  return (
    <Card padded={false}>
      <Table columns={columns} rows={data?.items} loading={loading} empty={<EmptyState title="No rewards unlocked yet" message="Rewards appear here as the customer reaches each milestone." />} />
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">Last refreshed {dateTime(new Date())}</p>
    </Card>
  )
}
