import { ArrowRight, Gift, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import { JourneyHero, MilestoneChecklist } from '../../components/loyalty'
import { Badge, Button, Card, CardBadge, DescriptionList, EmptyState } from '../../components/ui'
import { useCustomerAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { date, money, number } from '../../lib/format'

export default function CustomerDashboard() {
  const { session } = useCustomerAuth()
  const { customer, journey, stats } = session
  const recent = useApi('/me/purchases', { pageSize: 5 })
  const available = journey.milestones.filter((m) => m.status === 'AVAILABLE')

  // "7 more → Gift 1, 32 more → Gift 2 …" — every upcoming milestone, spelled out
  const upcoming = journey.milestones.filter((m) => !m.unlocked)

  return (
    <div className="space-y-6">
      <JourneyHero journey={journey} name={customer.fullName} />

      {available.length > 0 && (
        <Link to="/me/rewards" className="flex items-center gap-4 rounded-2xl border border-gold-300 bg-gradient-to-r from-gold-50 to-gold-100 p-4 shadow-sm hover:shadow">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-400 text-gold-800"><Gift className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gold-800">🎁 Reward available!</p>
            <p className="truncate text-sm text-gold-800/80">{available.map((m) => m.name).join(', ')} ready to collect.</p>
          </div>
          <ArrowRight className="size-5 text-gold-800" />
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card title="Your road ahead" className="lg:col-span-3">
          {upcoming.length ? (
            <ol className="space-y-3">
              {upcoming.map((m, i) => (
                <li key={`${m.type}-${m.rewardId ?? 'g'}`} className="flex items-center gap-4">
                  <div className="w-24 shrink-0 text-right">
                    <p className="text-2xl font-extrabold tabular-nums text-brand-700">{number(m.remaining)}</p>
                    <p className="text-[11px] leading-tight text-slate-500">more {m.remaining === 1 ? 'purchase' : 'purchases'}</p>
                  </div>
                  <ArrowRight className={`size-4 shrink-0 ${i === 0 ? 'text-brand-500' : 'text-slate-300'}`} />
                  <div className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${m.type === 'GOLD' ? 'bg-gradient-to-r from-gold-100 to-gold-300 text-gold-800' : i === 0 ? 'bg-brand-50' : 'bg-slate-50'}`}>
                    <p className="font-semibold leading-tight">{m.type === 'GOLD' ? '👑 Gold Premium Card' : m.name}</p>
                    <p className="text-xs opacity-75">at {m.requiredCount} counts</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-600">You've reached every milestone. Keep shopping to enjoy your Gold benefits!</p>
          )}
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Every bill of {money(session.settings.minPurchaseAmount)} or more earns 1 Silver Count.
          </p>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Milestones">
            <MilestoneChecklist journey={journey} />
          </Card>
          <Card title="Membership">
            <DescriptionList
              items={[
                ['Name', customer.fullName],
                ['Customer ID', <span className="font-mono">{customer.customerCode}</span>],
                ['Mobile', `+91 ${customer.mobile}`],
                ['Current card', <CardBadge cardType={customer.cardType} />],
                ['Member since', date(customer.registrationDate)],
                ['Total spent', money(stats.totalSpent)],
              ]}
            />
          </Card>
        </div>
      </div>

      <Card title="Recent purchases" action={<Button to="/me/purchases" variant="ghost" size="sm">View all</Button>} padded={false}>
        {recent.data?.items?.length ? (
          <ul className="divide-y divide-slate-100">
            {recent.data.items.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{money(p.finalAmount)}</p>
                  <p className="text-xs text-slate-500">{date(p.purchaseDate)} · {p.invoiceNumber}</p>
                </div>
                {p.status === 'CANCELLED' ? (
                  <Badge color="red">Cancelled</Badge>
                ) : p.silverCountEarned > 0 ? (
                  <Badge color="green">+{p.silverCountEarned} Silver Count</Badge>
                ) : (
                  <Badge>Below {money(session.settings.minPurchaseAmount)}</Badge>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Receipt} title="No purchases yet" message="Share your mobile number at the billing counter to start earning Silver Counts." />
        )}
      </Card>
    </div>
  )
}
