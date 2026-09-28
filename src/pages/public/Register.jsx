import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/AuthShell'
import CustomerFields, { validateCustomer } from '../../components/CustomerFields'
import OtpStep from '../../components/OtpStep'
import { Button } from '../../components/ui'
import { useCustomerAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import { api } from '../../lib/api'
import { normalizeMobile } from '../../lib/format'

const EMPTY = { fullName: '', mobile: '', email: '', dateOfBirth: '', gender: '', address: '', city: '', pincode: '' }

export default function Register() {
  const { session, refresh } = useCustomerAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState('details')
  const [sent, setSent] = useState(null) // { sentTo, devOtp }
  const [otpError, setOtpError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/me" replace />

  const sendOtp = async () => {
    const data = { ...form, mobile: normalizeMobile(form.mobile), email: form.email.trim().toLowerCase() }
    const errs = validateCustomer(data, { requireEmail: true })
    setErrors(errs)
    if (Object.keys(errs).length) return false
    setLoading(true)
    try {
      const res = await api.post('/auth/register/otp', { mobile: data.mobile, email: data.email, fullName: data.fullName })
      setForm(data)
      setSent(res)
      setStep('otp')
      return true
    } catch (e) {
      setErrors(e.fieldErrors)
      if (step === 'otp') setStep('details')
      if (!e.details?.length) toast.error(e)
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (otp) => {
    setLoading(true)
    setOtpError(null)
    try {
      const { customer } = await api.post('/auth/register', { ...form, otp })
      await refresh()
      toast.success(`Your customer ID is ${customer.customerCode}`, 'Welcome aboard!')
      navigate('/me', { replace: true })
    } catch (e) {
      if (e.details?.length && !e.fieldErrors.otp) {
        setErrors(e.fieldErrors)
        setStep('details')
      } else setOtpError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      wide={step === 'details'}
      title={step === 'details' ? 'Join the rewards program' : 'Verify your email'}
      subtitle={step === 'details' ? 'It takes less than a minute. Share your mobile number at the counter to earn counts; we email your login codes.' : undefined}
      footer={<>Already a member? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></>}
    >
      {step === 'details' ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            sendOtp()
          }}
          className="space-y-5"
        >
          <CustomerFields value={form} onChange={setForm} errors={errors} emailRequired />
          <Button type="submit" size="lg" className="w-full" loading={loading}>Continue</Button>
        </form>
      ) : (
        <OtpStep
          sentTo={sent?.sentTo}
          devOtp={sent?.devOtp}
          loading={loading}
          error={otpError}
          onSubmit={register}
          onBack={() => setStep('details')}
          onResend={sendOtp}
          submitLabel="Create my account"
        />
      )}
    </AuthShell>
  )
}
