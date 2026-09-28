// Loyalty journey visuals — shared by the customer portal and the admin customer profile.
// All numbers come from the API's `journey` object (computed by the backend LoyaltyService).
import { Check, Crown, Gift, Lock, Sparkles, Star } from 'lucide-react'
import { date, number, plural } from '../lib/format'
import { Badge, ClaimBadge, ProgressBar } from './ui'
import { cx } from '../lib/cx'

/** Headline card: "You have 18 Silver Counts — 7 more to unlock Free T-Shirt". */
export function JourneyHero({ journey, name, compact }) {
  const { silverCount, goldThreshold, goldProgressPercent, remainingToGold, nextMilestone, nextProgressPercent, cardType } = journey
  const isGold = cardType === 'GOLD'
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-2xl p-6 text-white shadow-lg',
        isGold ? 'bg-gradient-to-br from-gold-500 via-gold-600 to-gold-800' : 'bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900',
      )}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-white/80">{name ? `Hi ${name.split(' ')[0]} 👋` : 'Loyalty progress'}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            {isGold ? <Crown className="size-3.5" /> : <Star className="size-3.5" />} {isGold ? 'Gold Premium' : 'Silver Card'}
          </span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <p className="text-5xl font-extrabold tabular-nums tracking-tight">{number(silverCount)}</p>
          <p className="pb-1.5 text-white/80">Silver {silverCount === 1 ? 'Count' : 'Counts'}</p>
        </div>

        {nextMilestone ? (
          <p className="mt-2 text-lg font-semibold">
            <span className="text-gold-300">{plural(nextMilestone.remaining, 'more purchase')}</span> to unlock {nextMilestone.type === 'GOLD' ? 'Gold Premium' : nextMilestone.name}
          </p>
        ) : (
          <p className="mt-2 text-lg font-semibold">You've unlocked every milestone. Thank you for shopping with us! 🎉</p>
        )}

        {!compact && nextMilestone && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-white/80">
              <span>Next: {nextMilestone.name}</span>
              <span className="tabular-nums">{silverCount} / {nextMilestone.requiredCount}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gold-300 transition-all duration-700" style={{ width: `${nextProgressPercent}%` }} />
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl bg-black/15 p-4 backdrop-blur-sm">
          <div className="mb-1.5 flex justify-between text-xs text-white/85">
            <span className="inline-flex items-center gap-1"><Crown className="size-3.5" /> Gold Premium</span>
            <span className="tabular-nums">{Math.min(silverCount, goldThreshold)} / {goldThreshold} · {goldProgressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-100 transition-all duration-700" style={{ width: `${goldProgressPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/85">
            {isGold ? 'You are a Gold Premium member.' : `${plural(remainingToGold, 'more eligible purchase')} to become Gold Premium.`}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Vertical journey: every milestone with ✓ / 🔒, remaining purchases and reward status.
 * `onClaim(milestone)` shows a Claim button on AVAILABLE rewards (customer portal).
 */
export function MilestoneTimeline({ journey, onClaim, claimingId }) {
  const { milestones, silverCount } = journey
  return (
    <ol className="relative space-y-1">
      {milestones.map((m, i) => {
        const done = m.unlocked
        const isNext = journey.nextMilestone && m === milestones.find((x) => !x.unlocked)
        const isGold = m.type === 'GOLD'
        const segPct = done ? 100 : Math.min(100, (silverCount / Math.max(1, m.requiredCount)) * 100)
        return (
          <li key={`${m.type}-${m.rewardId ?? 'gold'}`} className="relative flex gap-4 pb-5 last:pb-0">
            {i < milestones.length - 1 && (
              <span className={cx('absolute top-10 bottom-0 left-5 w-0.5 -translate-x-1/2', milestones[i + 1].unlocked ? 'bg-emerald-400' : 'bg-slate-200')} aria-hidden />
            )}
            <div
              className={cx(
                'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                done ? (isGold ? 'bg-gradient-to-br from-gold-300 to-gold-500 text-gold-800' : 'bg-emerald-500 text-white') : isNext ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400',
              )}
            >
              {done ? isGold ? <Crown className="size-5" /> : <Check className="size-5" /> : isGold ? <Crown className="size-5" /> : isNext ? <Gift className="size-5" /> : <Lock className="size-4" />}
            </div>

            <div className={cx('min-w-0 flex-1 rounded-xl border p-3.5', isNext ? 'border-brand-200 bg-brand-50/50' : done ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200 bg-white')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{number(m.requiredCount)} purchases</p>
                  <p className={cx('font-semibold', isGold ? 'text-gold-700' : 'text-slate-900')}>{m.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {done ? (
                    isGold ? <Badge color="gold">Unlocked</Badge> : <ClaimBadge status={m.status} />
                  ) : (
                    <Badge color={isNext ? 'brand' : 'slate'}>
                      <Lock className="size-3" /> {plural(m.remaining, 'purchase')} to go
                    </Badge>
                  )}
                  {onClaim && m.status === 'AVAILABLE' && (
                    <button
                      onClick={() => onClaim(m)}
                      disabled={claimingId === m.customerRewardId}
                      className="rounded-lg bg-gold-400 px-3 py-1 text-xs font-semibold text-gold-800 shadow-sm hover:bg-gold-300 disabled:opacity-60"
                    >
                      {claimingId === m.customerRewardId ? 'Claiming…' : 'Claim'}
                    </button>
                  )}
                </div>
              </div>
              {m.description && <p className="mt-1 text-sm text-slate-600">{m.description}</p>}
              {done && m.unlockedAt && <p className="mt-1 text-xs text-emerald-700">Unlocked on {date(m.unlockedAt)}</p>}
              {!done && (
                <div className="mt-2.5">
                  <ProgressBar value={segPct} size="sm" tone={isGold ? 'gold' : 'brand'} label={`Progress to ${m.name}`} />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Compact "18/25 → 7 more" list, e.g. for the admin profile side panel. */
export function MilestoneChecklist({ journey }) {
  return (
    <ul className="space-y-2">
      {journey.milestones.map((m) => (
        <li key={`${m.type}-${m.rewardId ?? 'gold'}`} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            {m.unlocked ? <Check className="size-4 shrink-0 text-emerald-600" /> : <Lock className="size-4 shrink-0 text-slate-400" />}
            <span className="shrink-0 font-medium tabular-nums text-slate-500">{m.requiredCount}</span>
            <span className={cx('truncate', m.type === 'GOLD' ? 'font-semibold text-gold-700' : 'text-slate-800')}>{m.name}</span>
          </span>
          {m.unlocked ? (m.type === 'GOLD' ? <Badge color="gold">Gold</Badge> : <ClaimBadge status={m.status} />) : <span className="shrink-0 text-xs text-slate-500">{m.remaining} to go</span>}
        </li>
      ))}
    </ul>
  )
}

/** The physical-looking membership card (Silver or Gold Premium). */
export function MembershipCard({ customer, programName = 'Apni Dukaan Rewards' }) {
  const card = customer.membershipCard
  const isGold = customer.cardType === 'GOLD' && card?.status !== 'INACTIVE'
  return (
    <div
      className={cx(
        'relative aspect-[1.586/1] w-full max-w-md overflow-hidden rounded-2xl p-5 shadow-xl sm:p-6',
        isGold
          ? 'gold-shine bg-[linear-gradient(135deg,#fde68a_0%,#f5b83d_45%,#d99a1e_80%,#c0841c_100%)] text-[#3f2604]'
          : 'bg-[radial-gradient(120%_120%_at_0%_0%,#ffffff_0%,#e5e9f0_40%,#b8c1cf_80%,#8a94a6_100%)] text-slate-700',
      )}
      aria-label={isGold ? 'Gold Premium membership card' : 'Silver membership card'}
    >
      <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(45deg,#000_0_1px,transparent_1px_12px)]" aria-hidden />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase opacity-80">{programName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-extrabold tracking-wide sm:text-2xl">
              {isGold ? <Crown className="size-6" /> : <Sparkles className="size-5" />}
              {isGold ? 'GOLD PREMIUM' : 'SILVER MEMBER'}
            </p>
          </div>
          <div className="h-8 w-11 rounded-md bg-gradient-to-br from-yellow-100 to-yellow-400 shadow-inner ring-1 ring-black/10" aria-hidden />
        </div>
        <div>
          <p className="font-mono text-sm tracking-[0.2em] opacity-90 sm:text-base">{isGold && card ? card.cardNumber : customer.customerCode.replace(/(.{2})(?=.)/g, '$1 ')}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-bold uppercase sm:text-lg">{customer.fullName}</p>
              {isGold && <p className="text-xs opacity-80">ID {customer.customerCode}</p>}
            </div>
            <div className="text-right text-xs">
              <p className="opacity-75">{isGold ? 'Gold member since' : 'Member since'}</p>
              <p className="font-semibold">{date(isGold ? card.upgradedAt : customer.registrationDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GoldBenefits({ benefits }) {
  const list = (benefits || '').split('\n').map((s) => s.trim()).filter(Boolean)
  if (!list.length) return null
  return (
    <ul className="space-y-2">
      {list.map((b) => (
        <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
          <Star className="mt-0.5 size-4 shrink-0 fill-gold-400 text-gold-500" /> {b}
        </li>
      ))}
    </ul>
  )
}
