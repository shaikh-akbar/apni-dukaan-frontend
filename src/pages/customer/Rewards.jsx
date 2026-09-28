import { useState } from 'react'
import { Crown } from 'lucide-react'
import { GoldBenefits, MembershipCard, MilestoneTimeline } from '../../components/loyalty'
import { Card, ConfirmModal, PageHeader } from '../../components/ui'
import { useToast } from '../../context/AppContext'
import { useCustomerAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { plural } from '../../lib/format'

export default function CustomerRewards() {
  const { session, refresh } = useCustomerAuth()
  const toast = useToast()
  const [confirm, setConfirm] = useState(null)
  const [claimingId, setClaimingId] = useState(null)
  const { customer, journey, settings } = session

  const claim = async () => {
    const m = confirm
    setConfirm(null)
    setClaimingId(m.customerRewardId)
    try {
      await api.post(`/me/rewards/${m.customerRewardId}/claim`, {})
      toast.success('Show this screen at the counter to collect your reward.', `${m.name} claimed`)
      await refresh()
    } catch (e) {
      toast.error(e)
    } finally {
      setClaimingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My rewards"
        subtitle={
          journey.nextMilestone
            ? `${plural(journey.nextMilestone.remaining, 'more eligible purchase')} to unlock ${journey.nextMilestone.name}.`
            : 'All milestones unlocked!'
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card title="Reward journey">
            <MilestoneTimeline journey={journey} onClaim={setConfirm} claimingId={claimingId} />
          </Card>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <MembershipCard customer={customer} programName={settings.programName} />
          <Card title={<span className="flex items-center gap-2"><Crown className="size-4 text-gold-500" /> Gold Premium benefits</span>}>
            {customer.cardType !== 'GOLD' && (
              <p className="mb-3 text-sm text-slate-600">
                Reach <span className="font-semibold">{journey.goldThreshold}</span> Silver Counts to unlock:
              </p>
            )}
            <GoldBenefits benefits={settings.goldBenefits} />
          </Card>
          <Card title="How claiming works">
            <ol className="list-decimal space-y-1.5 pl-4 text-sm text-slate-600">
              <li>When you reach a milestone, the reward shows as <b>Available</b>.</li>
              <li>Tap <b>Claim</b> and visit the shop.</li>
              <li>Our staff hand it over and mark it <b>Delivered</b>.</li>
            </ol>
            <p className="mt-3 text-xs text-slate-500">Each reward can be claimed once.</p>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={claim}
        title={`Claim ${confirm?.name}?`}
        message="We'll mark this reward as claimed. Collect it at the shop counter — each reward can be claimed only once."
        confirmLabel="Claim reward"
      />
    </div>
  )
}
