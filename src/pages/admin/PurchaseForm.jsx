import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CustomerPicker from '../../components/CustomerPicker'
import { Button, Card, ErrorState, Input, PageHeader, PageLoader, Select, Textarea, Toggle } from '../../components/ui'
import { useSettings, useToast } from '../../context/AppContext'
import { api } from '../../lib/api'
import { money, PAYMENT_METHODS, toInputDateTime } from '../../lib/format'

const toPaise = (v) => Math.round(Number(v || 0) * 100)
const EMPTY_ITEM = { productName: '', quantity: 1, unitPrice: '' }

/** Mirrors backend LoyaltyService.evaluatePurchase — for the live preview only. */
function previewCount(finalAmount, { minAmount, multiple, maxPerPurchase }, eligible) {
  if (!eligible || !(minAmount > 0) || finalAmount < minAmount) return 0
  if (!multiple) return 1
  return Math.max(1, Math.min(Math.floor(toPaise(finalAmount) / toPaise(minAmount)), maxPerPurchase || 1))
}

export default function PurchaseForm() {
  const { id } = useParams()
  const isEdit = !!id
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { settings } = useSettings()

  const [customer, setCustomer] = useState(null)
  const [original, setOriginal] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [useItems, setUseItems] = useState(false)
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [form, setForm] = useState({ invoiceNumber: '', purchaseDate: toInputDateTime(), totalAmount: '', discount: '', paymentMethod: 'CASH', isEligible: true, notes: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit || !!params.get('customerId'))

  // Load purchase (edit) or preselected customer (?customerId=)
  useEffect(() => {
    const cid = params.get('customerId')
    if (isEdit) {
      api
        .get(`/purchases/${id}`)
        .then(({ purchase: p }) => {
          setOriginal(p)
          setCustomer({ ...p.customer, silverCount: undefined })
          setForm({
            invoiceNumber: p.invoiceNumber,
            purchaseDate: toInputDateTime(p.purchaseDate),
            totalAmount: String(p.totalAmount),
            discount: p.discount ? String(p.discount) : '',
            paymentMethod: p.paymentMethod,
            isEligible: p.isEligible,
            notes: p.notes || '',
          })
          if (p.items.length) {
            setUseItems(true)
            setItems(p.items.map((i) => ({ productName: i.productName, quantity: i.quantity, unitPrice: String(i.unitPrice) })))
          }
          return api.get(`/customers/${p.customerId}`).then(({ customer }) => setCustomer(customer))
        })
        .catch(setLoadError)
        .finally(() => setLoading(false))
    } else if (cid) {
      api
        .get(`/customers/${cid}`)
        .then(({ customer }) => setCustomer(customer))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [id, isEdit, params])

  const itemsTotalP = items.reduce((s, it) => s + toPaise(it.unitPrice) * (Number(it.quantity) || 0), 0)
  const totalP = useItems ? itemsTotalP : toPaise(form.totalAmount)
  const finalP = Math.max(0, totalP - toPaise(form.discount))
  const finalAmount = finalP / 100

  // Edits are evaluated with the purchase's original rule snapshot (as the backend does)
  const rules = useMemo(
    () =>
      original
        ? { minAmount: Number(original.ruleMinAmount), multiple: original.ruleMultiple, maxPerPurchase: settings?.maxCountsPerPurchase }
        : { minAmount: Number(settings?.minPurchaseAmount || 500), multiple: !!settings?.multipleCountsPerPurchase, maxPerPurchase: settings?.maxCountsPerPurchase },
    [original, settings],
  )
  const earn = previewCount(finalAmount, rules, form.isEligible)
  const delta = earn - (original?.silverCountEarned || 0)
  const currentCount = customer?.silverCount
  const shortBy = rules.minAmount - finalAmount

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setItem = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)))

  const validate = () => {
    const e = {}
    if (!customer) e.customerId = 'Select a customer'
    if (!form.invoiceNumber.trim()) e.invoiceNumber = 'Invoice number is required'
    else if (!/^[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(form.invoiceNumber.trim())) e.invoiceNumber = 'Letters, digits, / _ - only'
    if (!form.purchaseDate) e.purchaseDate = 'Purchase date is required'
    else if (new Date(form.purchaseDate) > new Date(Date.now() + 60_000)) e.purchaseDate = 'Purchase date cannot be in the future'
    if (useItems) {
      items.forEach((it, i) => {
        if (!it.productName.trim()) e[`items.${i}.productName`] = 'Required'
        if (!(Number(it.quantity) >= 1)) e[`items.${i}.quantity`] = 'Min 1'
        if (!(Number(it.unitPrice) >= 0) || it.unitPrice === '') e[`items.${i}.unitPrice`] = 'Required'
      })
    }
    if (!(totalP > 0)) e.totalAmount = 'Total amount must be greater than zero'
    if (toPaise(form.discount) < 0) e.discount = 'Discount cannot be negative'
    if (toPaise(form.discount) > totalP) e.discount = 'Discount cannot exceed the total'
    return e
  }

  const submit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setSaving(true)
    const body = {
      invoiceNumber: form.invoiceNumber.trim(),
      purchaseDate: new Date(form.purchaseDate).toISOString(),
      paymentMethod: form.paymentMethod,
      discount: Number(form.discount || 0),
      isEligible: form.isEligible,
      notes: form.notes,
      ...(useItems
        ? { items: items.map((it) => ({ productName: it.productName.trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })) }
        : { totalAmount: Number(form.totalAmount), ...(isEdit && original?.items.length ? { items: [] } : {}) }),
    }
    try {
      const res = isEdit ? await api.put(`/purchases/${id}`, { ...body, version: original.version }) : await api.post('/purchases', { ...body, customerId: customer.id })
      const { loyalty } = res
      const extra = [
        loyalty.unlocked?.length ? `Unlocked: ${loyalty.unlocked.map((u) => u.name).join(', ')}` : null,
        loyalty.gold === 'UPGRADED' ? '👑 Upgraded to Gold Premium!' : null,
      ].filter(Boolean)
      toast.success(
        extra.length ? extra.join(' · ') : `Silver count ${loyalty.previousCount} → ${loyalty.newCount}`,
        isEdit ? 'Purchase updated' : `Purchase ${res.purchase.invoiceNumber} saved`,
      )
      navigate(isEdit ? `/admin/purchases/${id}` : `/admin/customers/${customer.id}`)
    } catch (err) {
      const fe = err.fieldErrors
      if (err.code === 'DUPLICATE_INVOICE') fe.invoiceNumber = err.message
      setErrors(fe)
      toast.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loadError) return <ErrorState error={loadError} />
  if (loading) return <PageLoader />
  if (original?.status === 'CANCELLED') return <ErrorState error={{ message: 'Cancelled purchases cannot be edited.' }} />

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={isEdit ? `Edit ${original.invoiceNumber}` : 'Add purchase'} subtitle={!isEdit && `Bills of ${money(settings?.minPurchaseAmount)} or more earn a Silver Count automatically.`} back={isEdit ? `/admin/purchases/${id}` : '/admin/purchases'} />
      <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Customer & bill">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><CustomerPicker value={customer} onChange={setCustomer} error={errors.customerId} disabled={isEdit} required /></div>
              <Input label="Invoice number" value={form.invoiceNumber} onChange={set('invoiceNumber')} error={errors.invoiceNumber} required placeholder="INV-10234" hint="Must be unique — prevents double counting" inputClassName="font-mono uppercase" />
              <Input label="Purchase date & time" type="datetime-local" value={form.purchaseDate} onChange={set('purchaseDate')} error={errors.purchaseDate} required max={toInputDateTime()} />
              <Select label="Payment method" value={form.paymentMethod} onChange={set('paymentMethod')} options={PAYMENT_METHODS} required />
            </div>
          </Card>

          <Card title="Amount" action={<Toggle checked={useItems} onChange={setUseItems} label="Itemise products" />}>
            {useItems ? (
              <div className="space-y-3">
                <div className="hidden grid-cols-12 gap-2 text-xs font-medium text-slate-500 sm:grid">
                  <span className="col-span-6">Product</span><span className="col-span-2">Qty</span><span className="col-span-3">Unit price</span>
                </div>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 items-start gap-2">
                    <input className={`input col-span-12 sm:col-span-6 ${errors[`items.${i}.productName`] ? 'input-error' : ''}`} placeholder="Product name" value={it.productName} onChange={(e) => setItem(i, 'productName', e.target.value)} aria-label="Product name" />
                    <input className={`input col-span-4 sm:col-span-2 ${errors[`items.${i}.quantity`] ? 'input-error' : ''}`} type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, 'quantity', e.target.value)} aria-label="Quantity" />
                    <input className={`input col-span-6 sm:col-span-3 ${errors[`items.${i}.unitPrice`] ? 'input-error' : ''}`} type="number" min={0} step="0.01" placeholder="0.00" value={it.unitPrice} onChange={(e) => setItem(i, 'unitPrice', e.target.value)} aria-label="Unit price" />
                    <button type="button" onClick={() => setItems(items.length > 1 ? items.filter((_, j) => j !== i) : [{ ...EMPTY_ITEM }])} className="col-span-2 flex h-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 sm:col-span-1" aria-label="Remove item">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" icon={Plus} onClick={() => setItems([...items, { ...EMPTY_ITEM }])}>Add product</Button>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-sm"><span className="text-slate-600">Items total</span><span className="font-semibold tabular-nums">{money(itemsTotalP / 100, { decimals: 2 })}</span></div>
                {errors.totalAmount && <p className="text-xs text-red-600">{errors.totalAmount}</p>}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Total amount" type="number" min={0} step="0.01" value={form.totalAmount} onChange={set('totalAmount')} error={errors.totalAmount} required placeholder="0.00" />
              </div>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Discount" type="number" min={0} step="0.01" value={form.discount} onChange={set('discount')} error={errors.discount} placeholder="0.00" />
              <div>
                <p className="label">Final amount</p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-lg font-bold tabular-nums text-slate-900">{money(finalAmount, { decimals: 2 })}</p>
              </div>
            </div>
          </Card>

          <Card title="Loyalty & notes">
            <Toggle checked={form.isEligible} onChange={(v) => setForm({ ...form, isEligible: v })} label="Eligible for loyalty count" description="Turn off to exclude this bill (e.g. bulk/wholesale or excluded items)." />
            <Textarea label="Notes" className="mt-4" value={form.notes} onChange={set('notes')} maxLength={1000} rows={2} />
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className={`card p-5 ${earn > 0 ? 'ring-2 ring-emerald-200' : ''}`}>
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Sparkles className="size-4 text-brand-600" /> Loyalty preview</p>
              <p className={`mt-3 text-3xl font-extrabold ${earn > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isEdit ? (delta > 0 ? `+${delta}` : delta) : `+${earn}`}
                <span className="ml-1 text-sm font-medium text-slate-500">{isEdit ? 'change' : `Silver Count${earn === 1 ? '' : 's'}`}</span>
              </p>
              {currentCount !== undefined && (
                <p className="mt-1 text-sm text-slate-600">
                  {customer.fullName.split(' ')[0]}: {currentCount} → <b>{currentCount + (isEdit ? delta : earn)}</b>
                </p>
              )}
              {!form.isEligible ? (
                <p className="mt-3 text-xs text-slate-500">Marked as not eligible — no count.</p>
              ) : finalAmount > 0 && shortBy > 0 ? (
                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-xs text-amber-800"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {money(shortBy, { decimals: 2 })} short of the {money(rules.minAmount)} minimum.</p>
              ) : earn > 0 && !rules.multiple && finalAmount >= rules.minAmount * 2 ? (
                <p className="mt-3 text-xs text-slate-500">One count per bill, regardless of amount.</p>
              ) : null}
              {isEdit && <p className="mt-3 text-xs text-slate-500">Edits use this bill's original rule (min {money(rules.minAmount)}), not today's settings.</p>}
            </div>
            <Button type="submit" size="lg" className="w-full" loading={saving}>{isEdit ? 'Save changes' : 'Save purchase'}</Button>
            <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
