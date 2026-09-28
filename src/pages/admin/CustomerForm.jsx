import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CustomerFields, { validateCustomer } from '../../components/CustomerFields'
import { Button, Card, ErrorState, PageHeader, PageLoader, Toggle } from '../../components/ui'
import { useToast } from '../../context/AppContext'
import { api } from '../../lib/api'
import { normalizeMobile, toInputDate } from '../../lib/format'

const EMPTY = { fullName: '', mobile: '', email: '', dateOfBirth: '', gender: '', address: '', city: '', pincode: '', registrationDate: '', isActive: true }

export default function CustomerForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(isEdit ? null : EMPTY)
  const [loadError, setLoadError] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    api
      .get(`/customers/${id}`)
      .then(({ customer: c }) =>
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? EMPTY[k]])),
          dateOfBirth: toInputDate(c.dateOfBirth),
          registrationDate: toInputDate(c.registrationDate),
        }),
      )
      .catch(setLoadError)
  }, [id, isEdit])

  const submit = async (e) => {
    e.preventDefault()
    const data = { ...form, mobile: normalizeMobile(form.mobile) }
    const errs = validateCustomer(data)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      const body = { ...data }
      if (!body.registrationDate) delete body.registrationDate
      if (!isEdit) delete body.isActive
      const { customer } = isEdit ? await api.put(`/customers/${id}`, body) : await api.post('/customers', body)
      toast.success(isEdit ? 'Customer updated' : `Customer ${customer.customerCode} created`)
      navigate(`/admin/customers/${customer.id}`)
    } catch (err) {
      setErrors(err.code === 'DUPLICATE_MOBILE' ? { mobile: err.message } : err.fieldErrors)
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loadError) return <ErrorState error={loadError} />
  if (!form) return <PageLoader />

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={isEdit ? 'Edit customer' : 'Register new customer'} subtitle={!isEdit && 'A customer ID is generated automatically. Mobile numbers must be unique.'} back={isEdit ? `/admin/customers/${id}` : '/admin/customers'} />
      <form onSubmit={submit} noValidate>
        <Card>
          <CustomerFields value={form} onChange={setForm} errors={errors} showRegistrationDate />
          {isEdit && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Account active" description="Inactive customers cannot log in and no purchases can be added for them." />
            </div>
          )}
        </Card>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={saving}>{isEdit ? 'Save changes' : 'Register customer'}</Button>
        </div>
      </form>
    </div>
  )
}
