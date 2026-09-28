import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useApi, useDebounced } from '../hooks/useApi'
import { Avatar, CardBadge, Field, Spinner } from './ui'

/** Type-ahead customer search by name / mobile / ID. */
export default function CustomerPicker({ value, onChange, error, disabled, label = 'Customer', required }) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const q = useDebounced(text, 250)
  const boxRef = useRef(null)
  const { data, loading } = useApi(open && q.length >= 2 ? '/customers' : null, { q, pageSize: 8, isActive: 'true' })

  useEffect(() => {
    const close = (e) => !boxRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  if (value) {
    return (
      <Field label={label} error={error} required={required}>
        <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-3 py-2">
          <Avatar name={value.fullName} src={value.profilePhoto} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{value.fullName}</p>
            <p className="text-xs text-slate-500">{value.customerCode} · {value.mobile} · {value.silverCount} counts</p>
          </div>
          <CardBadge cardType={value.cardType} />
          {!disabled && (
            <button type="button" onClick={() => onChange(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Change customer">
              <X className="size-4" />
            </button>
          )}
        </div>
      </Field>
    )
  }

  return (
    <Field label={label} error={error} required={required} hint="Search by name, mobile number or customer ID">
      <div ref={boxRef} className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className={`input pl-9 ${error ? 'input-error' : ''}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="e.g. 98765 or Rahul or AD000012"
          autoComplete="off"
          aria-label="Search customer"
        />
        {open && q.length >= 2 && (
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {loading && <div className="flex justify-center py-4"><Spinner /></div>}
            {!loading && data?.items?.length === 0 && <p className="px-4 py-3 text-sm text-slate-500">No active customer matches “{q}”.</p>}
            {!loading &&
              data?.items?.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    onChange(c)
                    setText('')
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50"
                >
                  <Avatar name={c.fullName} src={c.profilePhoto} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{c.fullName}</p>
                    <p className="text-xs text-slate-500">{c.customerCode} · {c.mobile}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-700">{c.silverCount}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </Field>
  )
}
