import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input, PageHeader } from '../../components/ui'
import { useToast } from '../../context/AppContext'
import { useAdminAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

export default function ChangePassword() {
  const { admin, setAdmin } = useAdminAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.currentPassword) errs.currentPassword = 'Required'
    if (!STRONG.test(form.newPassword)) errs.newPassword = 'At least 8 characters with upper-case, lower-case and a number'
    if (form.newPassword !== form.confirm) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      const { admin: updated } = await api.post('/auth/admin/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword })
      setAdmin(updated)
      toast.success('Password changed. Other sessions have been signed out.')
      navigate('/admin', { replace: true })
    } catch (err) {
      setErrors({ currentPassword: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="Change password" />
      {admin?.mustChangePassword && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <KeyRound className="mt-0.5 size-4 shrink-0" /> For security, please set a new password before continuing.
        </p>
      )}
      <Card>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input label="Current password" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} required />
          <Input label="New password" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} hint="8+ characters, with upper-case, lower-case and a number" required />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} required />
          <Button type="submit" className="w-full" loading={saving}>Update password</Button>
        </form>
      </Card>
    </div>
  )
}
