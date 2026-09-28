let currency = 'INR'
export const setCurrency = (c) => {
  if (c) currency = c
}

const moneyFmt = new Map()
export function money(n, { decimals } = {}) {
  const value = Number(n || 0)
  const d = decimals ?? (Number.isInteger(value) ? 0 : 2)
  const key = `${currency}:${d}`
  if (!moneyFmt.has(key)) {
    moneyFmt.set(key, new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d }))
  }
  return moneyFmt.get(key).format(value)
}

export const number = (n) => new Intl.NumberFormat('en-IN').format(Number(n || 0))

export function date(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function dateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** yyyy-mm-dd for <input type="date"> (local time) */
export function toInputDate(d) {
  if (!d) return ''
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}

/** yyyy-mm-ddThh:mm for <input type="datetime-local"> */
export function toInputDateTime(d) {
  const x = d ? new Date(d) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${toInputDate(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}`
}

export const humanize = (s) => (s ? s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : '')

export const plural = (n, word, pluralWord = `${word}s`) => `${number(n)} ${n === 1 ? word : pluralWord}`

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

export const PAYMENT_METHODS = [
  ['CASH', 'Cash'],
  ['UPI', 'UPI'],
  ['CARD', 'Card'],
  ['NET_BANKING', 'Net banking'],
  ['WALLET', 'Wallet'],
  ['OTHER', 'Other'],
]
export const paymentLabel = (v) => PAYMENT_METHODS.find(([k]) => k === v)?.[1] || v

export const REWARD_TYPES = [
  ['GIFT', 'Gift'],
  ['VOUCHER', 'Voucher'],
  ['DISCOUNT', 'Discount'],
  ['SERVICE', 'Service'],
  ['OTHER', 'Other'],
]

export const MOBILE_RE = /^[6-9]\d{9}$/
export const normalizeMobile = (v) => String(v || '').replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '')
