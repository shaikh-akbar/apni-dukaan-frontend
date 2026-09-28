import { ArrowRight, Crown, Gift, Receipt, ShieldCheck, Smartphone, Star } from 'lucide-react'
import { Button } from '../../components/ui'
import { useSettings } from '../../context/AppContext'
import { useApi } from '../../hooks/useApi'
import { money } from '../../lib/format'
import Brand from '../../layouts/Brand'

export default function Landing() {
  const { settings } = useSettings()
  const { data } = useApi('/rewards/public')
  const rewards = data?.items || []
  const min = settings?.minPurchaseAmount ?? 500
  const gold = settings?.goldThreshold ?? 100

  const steps = [
    { icon: Smartphone, title: 'Register with your mobile', text: 'Sign up in a minute. No passwords: we email you a one-time code to log in.' },
    { icon: Receipt, title: `Shop for ${money(min)} or more`, text: `Every bill of ${money(min)}+ adds 1 Silver Count to your card automatically.` },
    { icon: Gift, title: 'Unlock rewards', text: 'Reach each milestone and your gift is ready to collect at the counter.' },
    { icon: Crown, title: `Go Gold at ${gold}`, text: 'Become a Gold Premium member with exclusive benefits.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <div className="flex items-center gap-2">
          <Button to="/login" variant="secondary" size="sm">Log in</Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_70%_0%,#e0e7ff_0%,transparent_70%),radial-gradient(40%_50%_at_10%_60%,#fef3c7_0%,transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <Star className="size-3.5 fill-current" /> {settings?.programName || 'Rewards program'}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Every purchase brings you closer to <span className="bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">Gold</span>.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-slate-600">
              Earn a Silver Count on every bill of {money(min)} or more at {settings?.shopName || 'our shop'}. Collect gifts along the way and become a Gold Premium member at {gold}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/register" size="lg" icon={ArrowRight}>Join for free</Button>
              <Button to="/login" size="lg" variant="secondary">I'm already a member</Button>
            </div>
          </div>

          <div className="card p-6">
            <p className="text-sm font-semibold text-slate-900">Your reward journey</p>
            <ol className="mt-4 space-y-3">
              {rewards.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-700 tabular-nums">{r.requiredCount}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{r.name}</p>
                    {r.description && <p className="truncate text-xs text-slate-500">{r.description}</p>}
                  </div>
                  <Gift className="ml-auto size-5 shrink-0 text-brand-500" />
                </li>
              ))}
              <li className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-gold-100 to-gold-300 p-3 ring-1 ring-gold-400/60">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/70 font-bold text-gold-800 tabular-nums">{gold}</span>
                <p className="font-semibold text-gold-800">Gold Premium Card</p>
                <Crown className="ml-auto size-5 text-gold-800" />
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white"><s.icon className="size-5" /></span>
                <span className="text-sm font-semibold text-slate-400">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
          <ShieldCheck className="size-4" /> One count per eligible bill. Counts are added by our staff when you pay, so just share your mobile number at the counter.
        </p>
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
        {settings?.shopName} {settings?.contactAddress && `· ${settings.contactAddress}`} {settings?.contactPhone && `· ${settings.contactPhone}`}
      </footer>
    </div>
  )
}
