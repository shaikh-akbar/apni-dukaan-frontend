import { useRef, useState } from 'react'
import { Camera, Pencil } from 'lucide-react'
import CustomerFields, { validateCustomer } from '../../components/CustomerFields'
import { MembershipCard, MilestoneChecklist } from '../../components/loyalty'
import { Avatar, Button, Card, CardBadge, DescriptionList, Modal, PageHeader } from '../../components/ui'
import { useToast } from '../../context/AppContext'
import { useCustomerAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { date, humanize, money, number, toInputDate } from '../../lib/format'
import CustomerPurchases from './Purchases'

export default function CustomerProfile() {
  const { session, refresh } = useCustomerAuth()
  const toast = useToast()
  const { customer, journey, stats, settings } = session
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const openEdit = () => {
    setForm({ ...customer, dateOfBirth: toInputDate(customer.dateOfBirth), email: customer.email || '', gender: customer.gender || '' })
    setErrors({})
    setEditing(true)
  }

  const save = async () => {
    const errs = validateCustomer(form, { requireMobile: false })
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      const { fullName, email, dateOfBirth, gender, address, city, pincode } = form
      await api.put('/me', { fullName, email, dateOfBirth, gender, address, city, pincode })
      await refresh()
      toast.success('Profile updated')
      setEditing(false)
    } catch (e) {
      setErrors(e.fieldErrors)
      if (!e.details.length) toast.error(e)
    } finally {
      setSaving(false)
    }
  }

  const uploadPhoto = async (file) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error('Photo must be under 2 MB')
    const fd = new FormData()
    fd.append('photo', file)
    try {
      await api.post('/me/photo', fd)
      await refresh()
      toast.success('Photo updated')
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" actions={<Button variant="secondary" icon={Pencil} onClick={openEdit}>Edit profile</Button>} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={customer.fullName} src={customer.profilePhoto} size="xl" />
                <button onClick={() => fileRef.current?.click()} className="absolute right-0 bottom-0 rounded-full bg-brand-600 p-1.5 text-white shadow ring-2 ring-white hover:bg-brand-700" aria-label="Change photo">
                  <Camera className="size-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-900">{customer.fullName}</h2>
                <p className="font-mono text-sm text-slate-500">{customer.customerCode}</p>
                <div className="mt-1.5"><CardBadge cardType={customer.cardType} /></div>
              </div>
            </div>
          </Card>

          <Card title="Personal information">
            <DescriptionList
              items={[
                ['Name', customer.fullName],
                ['Mobile', `+91 ${customer.mobile}`],
                ['Email', customer.email],
                ['Date of birth', customer.dateOfBirth ? date(customer.dateOfBirth) : null],
                ['Gender', humanize(customer.gender)],
                ['Address', [customer.address, customer.city, customer.pincode].filter(Boolean).join(', ') || null],
                ['Registration date', date(customer.registrationDate)],
              ]}
            />
          </Card>

          <Card title="Loyalty information">
            <DescriptionList
              items={[
                ['Current card', <CardBadge cardType={customer.cardType} />],
                ['Current Silver Count', <span className="text-lg font-bold text-brand-700">{number(stats.silverCount)}</span>],
                ['Total eligible purchases', number(stats.eligiblePurchases)],
                ['Total transactions', number(stats.totalPurchases)],
                ['Total purchase amount', money(stats.totalSpent)],
                ['Gold status', customer.cardType === 'GOLD' ? `Gold since ${date(customer.membershipCard?.upgradedAt)}` : `${number(journey.remainingToGold)} counts to Gold`],
              ]}
            />
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <MembershipCard customer={customer} programName={settings.programName} />
          <Card title="Reward progress">
            <MilestoneChecklist journey={journey} />
          </Card>
        </div>
      </div>

      <CustomerPurchases />

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit profile"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save changes</Button>
          </>
        }
      >
        {form && <CustomerFields value={form} onChange={setForm} errors={errors} mobileLocked />}
      </Modal>
    </div>
  )
}
