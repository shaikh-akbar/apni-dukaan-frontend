import { useEffect, useState } from 'react'
import { MailCheck } from 'lucide-react'
import { Button, Input } from './ui'

/** 6-digit OTP entry with resend countdown. Shows the dev OTP when the API echoes it. */
export default function OtpStep({ sentTo, devOtp, onSubmit, onResend, onBack, loading, error, submitLabel = 'Verify & continue' }) {
  const [otp, setOtp] = useState('')
  const [wait, setWait] = useState(30)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(otp)
      }}
      className="space-y-4"
    >
      <div className="flex items-start gap-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900 ring-1 ring-brand-100">
        <MailCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <p>
          We emailed a 6-digit code to <span className="font-semibold">{sentTo}</span>.{' '}
          <button type="button" onClick={onBack} className="font-medium text-brand-700 underline-offset-2 hover:underline">Change</button>
          <span className="mt-0.5 block text-xs text-brand-800/70">Can't find it? Check your spam or promotions folder.</span>
        </p>
      </div>
      {devOtp && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          Development mode: your code is <span className="font-mono font-bold tracking-widest">{devOtp}</span>
        </p>
      )}
      <Input
        label="Verification code"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="••••••"
        inputClassName="text-center font-mono text-2xl tracking-[0.5em]"
        error={error}
        required
      />
      <Button type="submit" className="w-full" size="lg" loading={loading} disabled={otp.length !== 6}>
        {submitLabel}
      </Button>
      <p className="text-center text-sm text-slate-500">
        {wait > 0 ? (
          <>Resend code in {wait}s</>
        ) : (
          <button
            type="button"
            className="font-medium text-brand-600 hover:underline"
            onClick={async () => {
              if (await onResend()) {
                setWait(30)
                setOtp('')
              }
            }}
          >
            Resend code
          </button>
        )}
      </p>
    </form>
  )
}
