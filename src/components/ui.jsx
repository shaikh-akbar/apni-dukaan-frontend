// Shared UI primitives. Kept deliberately small: Tailwind classes + a few behaviours.
import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react'

import { cx } from '../lib/cx'

// ───────────── Buttons ─────────────
const BTN = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm disabled:bg-brand-300',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm disabled:text-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm disabled:bg-red-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  gold: 'bg-gradient-to-r from-gold-400 to-gold-500 text-gold-800 hover:from-gold-300 hover:to-gold-400 shadow-sm',
}
const SIZE = { sm: 'px-2.5 py-1.5 text-xs gap-1.5', md: 'px-4 py-2 text-sm gap-2', lg: 'px-5 py-2.5 text-base gap-2' }

// type defaults to "button" so buttons inside forms never submit by accident; pass type="submit" explicitly
export function Button({ variant = 'primary', size = 'md', loading, disabled, icon: Icon, className, children, to, type = 'button', ...props }) {
  const cls = cx(
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
    BTN[variant],
    SIZE[size],
    className,
  )
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
    </>
  )
  if (to) return <Link to={to} className={cls} {...props}>{content}</Link>
  return (
    <button type={type} className={cls} disabled={loading || disabled} {...props}>
      {content}
    </button>
  )
}

// ───────────── Form fields ─────────────
export function Field({ label, error, hint, required, children, className, htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

export function Input({ label, error, hint, required, className, inputClassName, ...props }) {
  const id = useId()
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <input id={id} className={cx('input', error && 'input-error', inputClassName)} aria-invalid={!!error} required={required} {...props} />
    </Field>
  )
}

export function Select({ label, error, hint, required, className, options = [], placeholder, ...props }) {
  const id = useId()
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <select id={id} className={cx('input pr-8', error && 'input-error')} aria-invalid={!!error} required={required} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </Field>
  )
}

export function Textarea({ label, error, hint, required, className, ...props }) {
  const id = useId()
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <textarea id={id} className={cx('input min-h-20', error && 'input-error')} aria-invalid={!!error} {...props} />
    </Field>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={cx('flex items-start gap-3', disabled ? 'opacity-60' : 'cursor-pointer')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-slate-300')}
      >
        <span className={cx('absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4.5' : 'translate-x-0.5')} />
      </button>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  )
}

// ───────────── Layout bits ─────────────
export function Card({ className, children, title, action, padded = true }) {
  return (
    <section className={cx('card', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link to={back} className="mb-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ChevronLeft className="size-4" /> Back
          </Link>
        )}
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const BADGE = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  gold: 'bg-gradient-to-r from-gold-100 to-gold-300 text-gold-800 ring-gold-400/60',
  silver: 'bg-gradient-to-r from-silver-50 to-silver-100 text-silver-700 ring-silver-300',
}
export function Badge({ color = 'slate', children, className }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', BADGE[color], className)}>{children}</span>
}

export function CardBadge({ cardType }) {
  return cardType === 'GOLD' ? <Badge color="gold">★ Gold Premium</Badge> : <Badge color="silver">Silver</Badge>
}

const CLAIM = {
  AVAILABLE: ['amber', 'Available'],
  CLAIMED: ['blue', 'Claimed'],
  DELIVERED: ['green', 'Delivered'],
  CANCELLED: ['red', 'Cancelled'],
  REVOKED: ['slate', 'Revoked'],
  LOCKED: ['slate', 'Locked'],
}
export function ClaimBadge({ status }) {
  const [c, l] = CLAIM[status] || ['slate', status]
  return <Badge color={c}>{l}</Badge>
}

export function Spinner({ className }) {
  return <Loader2 className={cx('size-5 animate-spin text-brand-600', className)} aria-label="Loading" />
}

export function PageLoader() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Spinner className="size-7" />
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-8 text-center">
      <AlertCircle className="size-8 text-red-500" />
      <p className="text-sm text-slate-700">{error?.message || 'Something went wrong'}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="rounded-full bg-slate-100 p-3">
        <Icon className="size-6 text-slate-400" />
      </div>
      <p className="font-medium text-slate-800">{title}</p>
      {message && <p className="max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, tone = 'brand', hint }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    gold: 'bg-gold-100 text-gold-600',
    sky: 'bg-sky-50 text-sky-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="card flex items-start gap-4 p-4">
      {Icon && (
        <div className={cx('rounded-xl p-2.5', tones[tone])}>
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}

export function ProgressBar({ value, tone = 'brand', size = 'md', label }) {
  const pct = Math.max(0, Math.min(100, value || 0))
  const tones = {
    brand: 'bg-gradient-to-r from-brand-500 to-brand-700',
    gold: 'bg-gradient-to-r from-gold-300 to-gold-500',
    silver: 'bg-gradient-to-r from-silver-300 to-silver-500',
    green: 'bg-emerald-500',
  }
  const h = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }[size]
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-slate-200/70', h)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx('h-full rounded-full transition-all duration-700', tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ───────────── Table ─────────────
export function Table({ columns, rows, rowKey = 'id', empty, onRowClick, loading }) {
  return (
    <div className="relative overflow-x-auto">
      {loading && rows?.length > 0 && <div className="absolute inset-0 z-10 bg-white/50" />}
      <table className="min-w-full divide-y divide-slate-100">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cx('table-th', c.align === 'right' && 'text-right', c.className)}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows?.map((row) => (
            <tr key={row[rowKey]} className={cx(onRowClick && 'cursor-pointer hover:bg-slate-50')} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c) => (
                <td key={c.key} className={cx('table-td', c.align === 'right' && 'text-right tabular-nums', c.tdClassName)}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && !rows?.length && <PageLoader />}
      {!loading && !rows?.length && (empty || <EmptyState title="Nothing here yet" />)}
    </div>
  )
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) {
    return meta ? <p className="px-4 py-3 text-xs text-slate-500">{meta.total} result{meta.total === 1 ? '' : 's'}</p> : null
  }
  const from = (meta.page - 1) * meta.pageSize + 1
  const to = Math.min(meta.total, meta.page * meta.pageSize)
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <p className="text-xs text-slate-500">
        {from}–{to} of {meta.total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page" icon={ChevronLeft} />
        <span className="px-2 text-xs text-slate-600">
          Page {meta.page} / {meta.totalPages}
        </span>
        <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} aria-label="Next page" icon={ChevronRight} />
      </div>
    </div>
  )
}

// ───────────── Modal ─────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector('input,select,textarea,button')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cx('flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', w)}>
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, loading, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      {message && <p className="text-sm text-slate-600">{message}</p>}
      {children}
    </Modal>
  )
}

export function Avatar({ name, src, size = 'md' }) {
  const s = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-lg', xl: 'size-24 text-2xl' }[size]
  if (src) return <img src={src} alt={name} className={cx('shrink-0 rounded-full object-cover ring-2 ring-white', s)} />
  // Only words starting with a letter, so "Ahmed (Owner)" → "AO", not "A("
  const letters = (name || '?').split(/[\s()]+/).filter((w) => /^\p{L}/u.test(w)).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
  return <div className={cx('flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ring-2 ring-white', s)}>{letters}</div>
}

export function DescriptionList({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-medium text-slate-500">{k}</dt>
          <dd className="mt-0.5 text-sm break-words text-slate-900">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

