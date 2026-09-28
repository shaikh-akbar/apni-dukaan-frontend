import { useRef, useState } from 'react'
import { Crown, Gift, ImagePlus, Pencil, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, ErrorState, Input, Modal, PageHeader, PageLoader, Select, Textarea, Toggle } from '../../components/ui'
import { useSettings, useToast } from '../../context/AppContext'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { api } from '../../lib/api'
import { date, humanize, money, REWARD_TYPES, toInputDate } from '../../lib/format'

const EMPTY = { name: '', description: '', requiredCount: '', rewardType: 'GIFT', rewardValue: '', isActive: true, startDate: '', endDate: '' }

function RewardModal({ reward, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(() =>
    reward ? { ...EMPTY, ...reward, description: reward.description || '', rewardValue: reward.rewardValue ?? '', startDate: toInputDate(reward.startDate), endDate: toInputDate(reward.endDate) } : EMPTY,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Reward name is required'
    if (!(Number(form.requiredCount) >= 1) || !Number.isInteger(Number(form.requiredCount))) e.requiredCount = 'Enter a whole number of at least 1'
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = 'End date must be after start date'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    const body = {
      name: form.name.trim(),
      description: form.description,
      requiredCount: Number(form.requiredCount),
      rewardType: form.rewardType,
      rewardValue: form.rewardValue === '' ? null : Number(form.rewardValue),
      isActive: form.isActive,
      startDate: form.startDate || null,
      endDate: form.endDate ? `${form.endDate}T23:59:59` : null,
    }
    try {
      reward ? await api.put(`/rewards/${reward.id}`, body) : await api.post('/rewards', body)
      toast.success(reward ? 'Reward updated' : 'Reward created')
      onSaved()
    } catch (err) {
      setErrors(err.fieldErrors)
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={reward ? 'Edit reward' : 'New reward'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={saving}>{reward ? 'Save changes' : 'Create reward'}</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Reward name" value={form.name} onChange={set('name')} error={errors.name} required className="sm:col-span-2" placeholder="e.g. Free T-Shirt" />
        <Textarea label="Description" value={form.description} onChange={set('description')} error={errors.description} rows={2} className="sm:col-span-2" />
        <Input label="Required Silver Count" type="number" min={1} value={form.requiredCount} onChange={set('requiredCount')} error={errors.requiredCount} required hint="Milestone at which this unlocks" />
        <Select label="Reward type" value={form.rewardType} onChange={set('rewardType')} options={REWARD_TYPES} />
        <Input label="Reward value" type="number" min={0} step="0.01" value={form.rewardValue} onChange={set('rewardValue')} error={errors.rewardValue} hint="Optional — for reporting" />
        <div className="flex items-end pb-2"><Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" /></div>
        <Input label="Start date" type="date" value={form.startDate} onChange={set('startDate')} hint="Optional" />
        <Input label="End date" type="date" value={form.endDate} onChange={set('endDate')} error={errors.endDate} hint="Optional" />
      </div>
      {reward && (
        <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          Changes apply going forward. Customers who already unlocked this reward keep it at the milestone they reached. Use <b>Loyalty history → Recalculate all</b> to apply a new milestone to existing customers.
        </p>
      )}
    </Modal>
  )
}

export default function Rewards() {
  const { can } = useAdminAuth()
  const { settings } = useSettings()
  const toast = useToast()
  const { data, error, reload } = useApi('/rewards')
  const [editing, setEditing] = useState(undefined)
  const fileRef = useRef(null)
  const [uploadFor, setUploadFor] = useState(null)
  const canManage = can('rewards.manage')

  const upload = async (file) => {
    if (!file || !uploadFor) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      await api.post(`/rewards/${uploadFor}/image`, fd)
      toast.success('Image updated')
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setUploadFor(null)
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Rewards"
        subtitle="Milestone rewards customers unlock as they collect Silver Counts."
        actions={canManage && <Button icon={Plus} onClick={() => setEditing(null)}>New reward</Button>}
      />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />

      {data.items.length === 0 ? (
        <Card><EmptyState icon={Gift} title="No rewards yet" message="Create your first milestone reward, e.g. a free gift at 25 purchases." action={canManage && <Button icon={Plus} onClick={() => setEditing(null)}>New reward</Button>} /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((r) => (
            <div key={r.id} className={`card flex flex-col overflow-hidden ${r.isActive ? '' : 'opacity-70'}`}>
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
                {r.image ? <img src={r.image} alt="" className="h-full w-full object-cover" /> : <Gift className="size-12 text-brand-300" />}
                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-700 shadow-sm">{r.requiredCount} purchases</span>
                {canManage && (
                  <button onClick={() => { setUploadFor(r.id); fileRef.current?.click() }} className="absolute top-3 right-3 rounded-full bg-white/90 p-1.5 text-slate-600 shadow-sm hover:text-brand-700" aria-label="Upload image">
                    <ImagePlus className="size-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{r.name}</h3>
                  {r.isActive ? <Badge color="green">Active</Badge> : <Badge>Inactive</Badge>}
                </div>
                {r.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</p>}
                <p className="mt-2 text-xs text-slate-500">
                  {humanize(r.rewardType)}{r.rewardValue ? ` · worth ${money(r.rewardValue)}` : ''}
                  {(r.startDate || r.endDate) && ` · ${r.startDate ? date(r.startDate) : '…'} – ${r.endDate ? date(r.endDate) : '…'}`}
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Link to={`/admin/claims?rewardId=${r.id}&status=AVAILABLE`} className="rounded-lg bg-amber-50 py-2 hover:bg-amber-100"><p className="text-lg font-bold text-amber-700">{r.stats.AVAILABLE}</p><p className="text-[11px] text-amber-800">Pending</p></Link>
                  <Link to={`/admin/claims?rewardId=${r.id}&status=CLAIMED`} className="rounded-lg bg-sky-50 py-2 hover:bg-sky-100"><p className="text-lg font-bold text-sky-700">{r.stats.CLAIMED}</p><p className="text-[11px] text-sky-800">Claimed</p></Link>
                  <Link to={`/admin/claims?rewardId=${r.id}&status=DELIVERED`} className="rounded-lg bg-emerald-50 py-2 hover:bg-emerald-100"><p className="text-lg font-bold text-emerald-700">{r.stats.DELIVERED}</p><p className="text-[11px] text-emerald-800">Delivered</p></Link>
                </div>
                {canManage && <Button variant="secondary" size="sm" icon={Pencil} className="mt-4" onClick={() => setEditing(r)}>Edit</Button>}
              </div>
            </div>
          ))}
          <div className="card flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gold-50 to-gold-100 p-6 text-center ring-1 ring-gold-300">
            <Crown className="size-10 text-gold-500" />
            <p className="font-bold text-gold-800">Gold Premium Card</p>
            <p className="text-sm text-gold-800/80">Unlocks at <b>{settings?.goldThreshold}</b> Silver Counts</p>
            {can('settings.manage') && <Button to="/admin/settings" variant="gold" size="sm">Change in settings</Button>}
          </div>
        </div>
      )}

      {editing !== undefined && <RewardModal reward={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload() }} />}
    </div>
  )
}
