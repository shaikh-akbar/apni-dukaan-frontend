import { useState } from 'react'
import { Plus, ShieldCheck, UserPlus } from 'lucide-react'
import { Avatar, Badge, Button, Card, ErrorState, Input, Modal, PageHeader, PageLoader, Select, Table, Toggle } from '../../components/ui'
import { cx } from '../../lib/cx'
import { useToast } from '../../context/AppContext'
import { useAdminAuth } from '../../context/AuthContext'
import { useApi } from '../../hooks/useApi'
import { api } from '../../lib/api'
import { dateTime } from '../../lib/format'

function StaffModal({ staff, roles, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(staff ? { name: staff.name, roleId: String(staff.role.id), isActive: staff.isActive, password: '' } : { name: '', email: '', password: '', roleId: String(roles.find((r) => r.key === 'STAFF')?.id || roles[0]?.id || '') })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!staff && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if ((!staff || form.password) && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) e.password = 'At least 8 characters with upper-case, lower-case and a number'
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    try {
      if (staff) {
        await api.put(`/staff/${staff.id}`, { name: form.name, roleId: Number(form.roleId), isActive: form.isActive, ...(form.password && { password: form.password }) })
      } else {
        await api.post('/staff', { ...form, roleId: Number(form.roleId) })
      }
      toast.success(staff ? 'Staff member updated' : 'Staff member added — they must change the password on first login')
      onSaved()
    } catch (err) {
      setErrors(err.fieldErrors)
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={staff ? `Edit ${staff.name}` : 'Add staff member'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={set('name')} error={errors.name} required />
        {!staff && <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} required autoComplete="off" />}
        <Select label="Role" value={form.roleId} onChange={set('roleId')} options={roles.map((r) => [String(r.id), r.name])} />
        <Input
          label={staff ? 'Reset password' : 'Temporary password'}
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="new-password"
          hint={staff ? 'Leave blank to keep the current password. A reset signs them out and forces a change at next login.' : 'They will be asked to change it on first login.'}
        />
        {staff && <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Active" description="Inactive staff cannot log in." />}
      </div>
    </Modal>
  )
}

function RoleEditor({ role, permissions, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState(role ? { name: role.name, description: role.description || '', permissions: role.permissions } : { key: '', name: '', description: '', permissions: [] })
  const [saving, setSaving] = useState(false)
  const locked = role?.key === 'SUPER_ADMIN'
  const groups = [...new Set(permissions.map((p) => p.group))]
  const toggle = (key) => setForm({ ...form, permissions: form.permissions.includes(key) ? form.permissions.filter((k) => k !== key) : [...form.permissions, key] })

  const save = async () => {
    setSaving(true)
    try {
      if (role) await api.put(`/roles/${role.id}`, { name: form.name, description: form.description, ...(!locked && { permissions: form.permissions }) })
      else await api.post('/roles', form)
      toast.success('Role saved — changes apply immediately')
      onSaved()
    } catch (e) {
      toast.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} size="lg" title={role ? `Role: ${role.name}` : 'New role'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save role</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {!role && <Input label="Key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })} hint="e.g. CASHIER" required />}
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={role ? '' : 'sm:col-span-2'} />
      </div>
      {locked ? (
        <p className="mt-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">Super Admin always has every permission.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {groups.map((g) => (
            <div key={g}>
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{g}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.filter((p) => p.group === g).map((p) => (
                  <label key={p.key} className={cx('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm', form.permissions.includes(p.key) ? 'border-brand-300 bg-brand-50' : 'border-slate-200')}>
                    <input type="checkbox" className="size-4 accent-brand-600" checked={form.permissions.includes(p.key)} onChange={() => toggle(p.key)} />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function Staff() {
  const { admin } = useAdminAuth()
  const staff = useApi('/staff')
  const roles = useApi('/roles')
  const [editing, setEditing] = useState(undefined)
  const [editingRole, setEditingRole] = useState(undefined)

  if (staff.error || roles.error) return <ErrorState error={staff.error || roles.error} onRetry={() => { staff.reload(); roles.reload() }} />
  if (!staff.data || !roles.data) return <PageLoader />

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{s.name} {s.id === admin.id && <span className="text-xs text-slate-400">(you)</span>}</p>
            <p className="text-xs text-slate-500">{s.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (s) => <Badge color={s.role.key === 'SUPER_ADMIN' ? 'brand' : 'slate'}>{s.role.name}</Badge> },
    { key: 'status', label: 'Status', render: (s) => (s.isActive ? (s.mustChangePassword ? <Badge color="amber">Password change pending</Badge> : <Badge color="green">Active</Badge>) : <Badge color="red">Inactive</Badge>) },
    { key: 'lastLoginAt', label: 'Last login', render: (s) => dateTime(s.lastLoginAt) },
    { key: 'actions', label: '', render: (s) => <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>Edit</Button> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Staff & roles" subtitle="Control who can access the admin panel and what they can do." actions={<Button icon={UserPlus} onClick={() => setEditing(null)}>Add staff</Button>} />
      <Card title="Staff" padded={false}>
        <Table columns={columns} rows={staff.data.items} />
      </Card>
      <Card title="Roles & permissions" action={<Button size="sm" variant="secondary" icon={Plus} onClick={() => setEditingRole(null)}>New role</Button>}>
        <div className="grid gap-3 sm:grid-cols-2">
          {roles.data.items.map((r) => (
            <button key={r.id} onClick={() => setEditingRole(r)} className="rounded-xl border border-slate-200 p-4 text-left hover:border-brand-300 hover:bg-brand-50/40">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck className="size-4 text-brand-600" /> {r.name}</p>
                <span className="text-xs text-slate-500">{r.adminCount} member{r.adminCount === 1 ? '' : 's'}</span>
              </div>
              {r.description && <p className="mt-1 text-sm text-slate-600">{r.description}</p>}
              <p className="mt-2 text-xs text-slate-500">{r.key === 'SUPER_ADMIN' ? 'All permissions' : `${r.permissions.length} of ${roles.data.permissions.length} permissions`}</p>
            </button>
          ))}
        </div>
      </Card>

      {editing !== undefined && <StaffModal staff={editing} roles={roles.data.items} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); staff.reload(); roles.reload() }} />}
      {editingRole !== undefined && <RoleEditor role={editingRole} permissions={roles.data.permissions} onClose={() => setEditingRole(undefined)} onSaved={() => { setEditingRole(undefined); roles.reload() }} />}
    </div>
  )
}
