import { useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Award, CalendarCheck, Crown, Gift, IndianRupee, PackageCheck, ShoppingBag, Sparkles, Timer, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, CardBadge, ErrorState, PageHeader, PageLoader, StatCard } from '../../components/ui'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { date, money, number } from '../../lib/format'

const shortDay = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
const compactMoney = (n) => (n >= 100000 ? `${+(n / 100000).toFixed(1)}L` : n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n))

function ChartTooltip({ active, payload, label, formatter = number }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-slate-900">{label && /^\d{4}-/.test(label) ? date(label) : label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-slate-600">
          <span className="size-2 rounded-full" style={{ background: p.color || p.payload.fill }} /> {p.name}: <span className="font-semibold text-slate-900">{formatter(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [days, setDays] = useState(30)
  const { data, error, loading, reload } = useApi('/dashboard', { days })
  const { admin, can } = useAdminAuth()
  const navigate = useNavigate()

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading && !data) return <PageLoader />
  const t = data.totals

  const cardMix = [
    { name: 'Silver', value: t.silverMembers, fill: '#94a3b8' },
    { name: 'Gold', value: t.goldMembers, fill: '#e0a526' },
  ]
  const rewardMix = [
    { name: 'Pending', value: data.rewardStatus.AVAILABLE || 0, fill: '#f59e0b' },
    { name: 'Claimed', value: data.rewardStatus.CLAIMED || 0, fill: '#0ea5e9' },
    { name: 'Delivered', value: data.rewardStatus.DELIVERED || 0, fill: '#10b981' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${admin.name.split(' ')[0]}`}
        subtitle="Here's how your loyalty program is doing."
        actions={
          <>
            {can('customers.create') && <Button variant="secondary" to="/admin/customers/new" icon={Users}>New customer</Button>}
            {can('purchases.create') && <Button to="/admin/purchases/new" icon={ShoppingBag}>Add purchase</Button>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's purchases" value={number(t.todayPurchases)} icon={CalendarCheck} tone="sky" />
        <StatCard label="Today's revenue" value={money(t.todayRevenue)} icon={IndianRupee} tone="green" />
        <StatCard label="Total customers" value={number(t.totalCustomers)} icon={Users} />
        <StatCard label="Gold members" value={number(t.goldMembers)} icon={Crown} tone="gold" />
        <StatCard label="Total purchases" value={number(t.totalPurchases)} icon={ShoppingBag} tone="slate" />
        <StatCard label="Total revenue" value={money(t.totalRevenue)} icon={IndianRupee} tone="green" />
        <StatCard label="Silver counts issued" value={number(t.silverCountsIssued)} icon={Sparkles} tone="brand" />
        <StatCard label="Rewards unlocked" value={number(t.rewardsUnlocked)} icon={Award} tone="rose" />
        <StatCard label="Rewards pending" value={number(t.rewardsPending)} icon={Timer} tone="amber" hint="Unlocked, not yet claimed" />
        <StatCard label="Rewards claimed" value={number(t.rewardsClaimed)} icon={Gift} tone="sky" hint={`${number(t.rewardsDelivered)} delivered`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Revenue & purchases"
          action={
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs">
              {[7, 30, 90].map((d) => (
                <button key={d} onClick={() => setDays(d)} className={`rounded-md px-2.5 py-1 font-medium ${days === d ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {d}d
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis yAxisId="rev" tickFormatter={compactMoney} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="cnt" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip formatter={(v) => (v > 50 ? money(v) : number(v))} />} />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2} fill="url(#rev)" />
                <Area yAxisId="cnt" type="monotone" dataKey="purchases" name="Purchases" stroke="#10b981" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Members by card">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cardMix} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                  {cardMix.map((c) => <Cell key={c.name} fill={c.fill} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-sm">
            {cardMix.map((c) => (
              <span key={c.name} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: c.fill }} />{c.name} <b>{c.value}</b></span>
            ))}
          </div>
          <h3 className="mt-6 mb-2 text-sm font-semibold text-slate-900">Rewards</h3>
          <div className="space-y-2">
            {rewardMix.map((r) => {
              const total = rewardMix.reduce((s, x) => s + x.value, 0) || 1
              return (
                <div key={r.name}>
                  <div className="flex justify-between text-xs text-slate-600"><span>{r.name}</span><span className="font-medium">{r.value}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(r.value / total) * 100}%`, background: r.fill }} /></div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Customers by Silver Count" className="xl:col-span-1">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.countDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="customers" name="Customers" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent transactions" className="xl:col-span-2" padded={false} action={<Button to="/admin/purchases" variant="ghost" size="sm">View all</Button>}>
          <ul className="divide-y divide-slate-100">
            {data.recentPurchases.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/purchases/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{p.customer.fullName}</p>
                    <p className="text-xs text-slate-500">{p.invoiceNumber} · {date(p.purchaseDate)} · by {p.createdBy.name}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${p.status === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{money(p.finalAmount)}</span>
                  {p.status === 'CANCELLED' ? <Badge color="red">Cancelled</Badge> : p.silverCountEarned > 0 ? <Badge color="green">+{p.silverCountEarned}</Badge> : <Badge>0</Badge>}
                </Link>
              </li>
            ))}
            {!data.recentPurchases.length && <li className="px-5 py-8 text-center text-sm text-slate-500">No purchases yet.</li>}
          </ul>
        </Card>
      </div>

      <Card title="Recent customers" padded={false} action={<Button to="/admin/customers" variant="ghost" size="sm">View all</Button>}>
        <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
          {data.recentCustomers.map((c) => (
            <button key={c.id} onClick={() => navigate(`/admin/customers/${c.id}`)} className="flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{c.fullName}</p>
                <p className="text-xs text-slate-500">{c.customerCode} · joined {date(c.registrationDate)}</p>
              </div>
              <CardBadge cardType={c.cardType} />
              <span className="text-sm font-semibold tabular-nums text-brand-700">{c.silverCount}</span>
            </button>
          ))}
        </div>
      </Card>
      <p className="flex items-center gap-1.5 text-xs text-slate-400"><PackageCheck className="size-3.5" /> Figures exclude cancelled purchases.</p>
    </div>
  )
}
