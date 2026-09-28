import { Input, Select, Textarea } from './ui'
import { MOBILE_RE } from '../lib/format'

/** Client-side checks mirror the API's; the server re-validates everything. */
// eslint-disable-next-line react-refresh/only-export-components
export function validateCustomer(v, { requireMobile = true, requireEmail = false } = {}) {
  const e = {}
  if (!v.fullName?.trim()) e.fullName = 'Full name is required'
  else if (!/^[\p{L}\p{M} .'-]+$/u.test(v.fullName.trim())) e.fullName = "Name can only contain letters, spaces and . ' -"
  if (requireMobile && !MOBILE_RE.test(v.mobile || '')) e.mobile = 'Enter a valid 10-digit mobile number'
  if (requireEmail && !v.email?.trim()) e.email = 'Email is required — your login codes are sent there'
  else if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email address'
  if (v.pincode && !/^\d{6}$/.test(v.pincode)) e.pincode = 'Pincode must be 6 digits'
  if (v.dateOfBirth && new Date(v.dateOfBirth) >= new Date()) e.dateOfBirth = 'Enter a valid date of birth'
  return e
}

export default function CustomerFields({ value, onChange, errors = {}, mobileLocked, showRegistrationDate, emailRequired }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" value={value.fullName} onChange={set('fullName')} error={errors.fullName} required autoComplete="name" className="sm:col-span-2" />
      <Input
        label="Mobile number"
        type="tel"
        inputMode="numeric"
        value={value.mobile}
        onChange={set('mobile')}
        error={errors.mobile}
        required
        disabled={mobileLocked}
        hint={mobileLocked ? 'Contact the shop to change your registered number' : 'Must be unique — share it at the counter to earn counts'}
        autoComplete="tel-national"
      />
      <Input label="Email" type="email" value={value.email || ''} onChange={set('email')} error={errors.email} autoComplete="email" required={emailRequired} hint="Login codes are sent to this email" />
      <Input label="Date of birth" type="date" value={value.dateOfBirth || ''} onChange={set('dateOfBirth')} error={errors.dateOfBirth} hint="Optional" max={new Date().toISOString().slice(0, 10)} />
      <Select
        label="Gender"
        value={value.gender || ''}
        onChange={set('gender')}
        error={errors.gender}
        placeholder="Prefer not to say"
        options={[['MALE', 'Male'], ['FEMALE', 'Female'], ['OTHER', 'Other']]}
      />
      <Textarea label="Address" value={value.address || ''} onChange={set('address')} error={errors.address} rows={2} className="sm:col-span-2" autoComplete="street-address" />
      <Input label="City" value={value.city || ''} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
      <Input label="Pincode" inputMode="numeric" value={value.pincode || ''} onChange={set('pincode')} error={errors.pincode} autoComplete="postal-code" />
      {showRegistrationDate && (
        <Input label="Registration date" type="date" value={value.registrationDate || ''} onChange={set('registrationDate')} error={errors.registrationDate} max={new Date().toISOString().slice(0, 10)} hint="Defaults to today" />
      )}
    </div>
  )
}
