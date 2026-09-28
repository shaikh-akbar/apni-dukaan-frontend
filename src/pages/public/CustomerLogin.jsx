import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../../components/AuthShell'
import OtpStep from '../../components/OtpStep'
import { Button, Input } from '../../components/ui'
import { useCustomerAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { MOBILE_RE, normalizeMobile } from '../../lib/format'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Accepts a mobile number or an email; returns the normalised value or null. */
function parseLogin(raw) {
  const v = raw.trim()
  if (v.includes('@')) return EMAIL_RE.test(v) ? v.toLowerCase() : null
  const m = normalizeMobile(v)
  return MOBILE_RE.test(m) ? m : null
}

export default function CustomerLogin() {
  const { session, refresh } = useCustomerAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [login, setLogin] = useState('')
  const [step, setStep] = useState('identify')
  const [sent, setSent] = useState(null) // { sentTo, devOtp }
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to={location.state?.from || '/me'} replace />

  const requestOtp = async () => {
    const value = parseLogin(login)
    if (!value) {
      setError('Enter a valid 10-digit mobile number or email address')
      return false
    }
    setLoading(true)
    setError(null)
    setErrorCode(null)
    try {
      const res = await api.post('/auth/otp', { login: value })
      setLogin(value)
      setSent(res)
      setStep('otp')
      return true
    } catch (e) {
      setError(e.message)
      setErrorCode(e.code || (e.status === 404 ? 'NOT_FOUND' : null))
      return false
    } finally {
      setLoading(false)
    }
  }

  const verify = async (otp) => {
    setLoading(true)
    setError(null)
    try {
      await api.post('/auth/login', { login, otp })
      await refresh()
      navigate(location.state?.from || '/me', { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your mobile number or email. We'll email you a one-time code."
      footer={<>New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create your loyalty account</Link></>}
    >
      {step === 'identify' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            requestOtp()
          }}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Mobile number or email"
            autoComplete="username"
            placeholder="98765 43210 or you@example.com"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            error={error}
            autoFocus
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>Email me a code</Button>
          {errorCode === 'NOT_FOUND' && <Button to="/register" variant="secondary" className="w-full">Register now</Button>}
        </form>
      ) : (
        <OtpStep
          sentTo={sent?.sentTo}
          devOtp={sent?.devOtp}
          loading={loading}
          error={error}
          onSubmit={verify}
          onBack={() => {
            setStep('identify')
            setError(null)
          }}
          onResend={requestOtp}
          submitLabel="Log in"
        />
      )}
    </AuthShell>
  )
}
