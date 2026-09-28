import { useRef, useState } from 'react'
import { AlertTriangle, Crown, Gift, ImagePlus, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card, ErrorState, Input, PageHeader, PageLoader, Textarea, Toggle } from '../../components/ui'
import { useSettings, useToast } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { api } from '../../lib/api'
import { money } from '../../lib/format'

const FIELDS = ['programName', 'minPurchaseAmount', 'multipleCountsPerPurchase', 'maxCountsPerPurchase', 'goldThreshold', 'goldBenefits', 'shopName', 'contactPhone', 'contactEmail', 'contactAddress', 'currency', 'currencySymbol']

export default function SettingsPage() {
  const { data, error, reload } = useApi('/settings/loyalty')
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <PageLoader />
  // Keyed by updatedAt: after a save the form re-initialises from the fresh values
  return <SettingsForm key={data.settings.updatedAt} settings={data.settings} reload={reload} />
}

function SettingsForm({ settings: s, reload }) {
  const toast = useToast()
  const { reload: reloadPublic } = useSettings()
  const rewards = useApi('/rewards')
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((k) => [k, s[k] ?? ''])))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const logoRef = useRef(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const dirty = FIELDS.some((k) => String(form[k] ?? '') !== String(s[k] ?? ''))
  const loyaltyChanged = ['minPurchaseAmount', 'multipleCountsPerPurchase', 'goldThreshold'].some((k) => String(form[k]) !== String(s[k]))

  const save = async () => {
    const e = {}
    if (!(Number(form.minPurchaseAmount) > 0)) e.minPurchaseAmount = 'Must be greater than zero'
    if (!(Number(form.goldThreshold) >= 1) || !Number.isInteger(Number(form.goldThreshold))) e.goldThreshold = 'Whole number, at least 1'
    if (!(Number(form.maxCountsPerPurchase) >= 1)) e.maxCountsPerPurchase = 'At least 1'
    if (!form.shopName.trim()) e.shopName = 'Required'
    if (!form.programName.trim()) e.programName = 'Required'
    if (!/^[A-Za-z]{3}$/.test(form.currency)) e.currency = '3-letter code, e.g. INR'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      await api.put('/settings/loyalty', {
        ...form,
        minPurchaseAmount: Number(form.minPurchaseAmount),
        maxCountsPerPurchase: Number(form.maxCountsPerPurchase),
        goldThreshold: Number(form.goldThreshold),
      })
      toast.success('Settings saved')
      reload()
      reloadPublic()
    } catch (err) {
      setErrors(err.fieldErrors)
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  const uploadLogo = async (file) => {
    if (!file) return
    const fd = new FormData()
    fd.append('logo', file)
    try {
      await api.post('/settings/logo', fd)
      toast.success('Logo updated')
      reload()
      reloadPublic()
    } catch (e) {
      toast.error(e)
    }
  }

  const milestones = [...(rewards.data?.items || []).filter((r) => r.isActive).map((r) => ({ n: r.requiredCount, label: r.name })), { n: Number(form.goldThreshold) || 0, label: 'Gold Premium Card', gold: true }].sort((a, b) => a.n - b.n)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure the loyalty program without touching code."
        actions={<Button onClick={save} loading={saving} disabled={!dirty}>Save changes</Button>}
      />

      <Card title={<span className="flex items-center gap-2"><Gift className="size-4 text-brand-600" /> Loyalty rules</span>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Program name" value={form.programName} onChange={set('programName')} error={errors.programName} required className="sm:col-span-2" />
          <Input label="Minimum purchase amount" type="number" min={1} step="0.01" value={form.minPurchaseAmount} onChange={set('minPurchaseAmount')} error={errors.minPurchaseAmount} required hint={`Bills of ${money(form.minPurchaseAmount || 0)} or more earn a Silver Count`} />
          <Input label="Gold Premium threshold" type="number" min={1} value={form.goldThreshold} onChange={set('goldThreshold')} error={errors.goldThreshold} required hint="Silver Counts needed for Gold" />
          <div className="sm:col-span-2">
            <Toggle
              checked={form.multipleCountsPerPurchase}
              onChange={(v) => setForm({ ...form, multipleCountsPerPurchase: v })}
              label="Award multiple counts for large bills"
              description={`Off (recommended): every eligible bill earns exactly 1 count. On: a ${money((form.minPurchaseAmount || 0) * 3)} bill earns 3 counts.`}
            />
          </div>
          {form.multipleCountsPerPurchase && (
            <Input label="Max counts per bill" type="number" min={1} value={form.maxCountsPerPurchase} onChange={set('maxCountsPerPurchase')} error={errors.maxCountsPerPurchase} />
          )}
        </div>

        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Milestones</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {milestones.map((m) => (
              <span key={`${m.label}-${m.n}`} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${m.gold ? 'bg-gold-100 text-gold-800 ring-gold-300' : 'bg-white text-slate-700 ring-slate-200'}`}>
                {m.gold && <Crown className="size-3.5" />} <b className="tabular-nums">{m.n}</b> → {m.label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Reward milestones (e.g. 25 / 50 / 75) are managed on the <Link to="/admin/rewards" className="font-medium text-brand-700 hover:underline">Rewards</Link> page.
          </p>
        </div>

        {loyaltyChanged && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            New rules apply to purchases recorded from now on. Past purchases keep the rule they were recorded under. To re-check rewards and Gold status for existing customers, run <b>Loyalty history → Recalculate all</b> afterwards.
          </p>
        )}
      </Card>

      <Card title={<span className="flex items-center gap-2"><Crown className="size-4 text-gold-500" /> Gold Premium benefits</span>}>
        <Textarea label="Benefits (one per line)" value={form.goldBenefits || ''} onChange={set('goldBenefits')} rows={5} hint="Shown on customers' Gold card and rewards page" />
      </Card>

      <Card title={<span className="flex items-center gap-2"><Store className="size-4 text-slate-600" /> Shop</span>}>
        <div className="mb-5 flex items-center gap-4">
          {s.shopLogo ? <img src={s.shopLogo} alt="Shop logo" className="size-16 rounded-xl object-cover ring-1 ring-slate-200" /> : <div className="flex size-16 items-center justify-center rounded-xl bg-slate-100"><Store className="size-7 text-slate-400" /></div>}
          <div>
            <Button variant="secondary" size="sm" icon={ImagePlus} onClick={() => logoRef.current?.click()}>Upload logo</Button>
            <p className="mt-1 text-xs text-slate-500">PNG, JPG or WEBP up to 2 MB</p>
            <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Shop name" value={form.shopName} onChange={set('shopName')} error={errors.shopName} required />
          <Input label="Contact phone" value={form.contactPhone || ''} onChange={set('contactPhone')} error={errors.contactPhone} />
          <Input label="Contact email" type="email" value={form.contactEmail || ''} onChange={set('contactEmail')} error={errors.contactEmail} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency" value={form.currency} onChange={set('currency')} error={errors.currency} maxLength={3} inputClassName="uppercase" />
            <Input label="Symbol" value={form.currencySymbol} onChange={set('currencySymbol')} error={errors.currencySymbol} maxLength={5} />
          </div>
          <Textarea label="Address" value={form.contactAddress || ''} onChange={set('contactAddress')} rows={2} className="sm:col-span-2" />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving} disabled={!dirty}>Save changes</Button>
      </div>
    </div>
  )
}
