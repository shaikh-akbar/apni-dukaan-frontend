import { useState } from 'react'
import { Button, ConfirmModal, Textarea } from './ui'
import { useToast } from '../context/AppContext'
import { api } from '../lib/api'

/** Status buttons for one reward claim, matching the backend's allowed transitions. */
const NEXT = {
  AVAILABLE: [['CLAIMED', 'Mark claimed', 'secondary'], ['DELIVERED', 'Deliver', 'primary'], ['CANCELLED', 'Cancel', 'ghost']],
  CLAIMED: [['DELIVERED', 'Deliver', 'primary'], ['AVAILABLE', 'Undo claim', 'ghost'], ['CANCELLED', 'Cancel', 'ghost']],
  CANCELLED: [['AVAILABLE', 'Reopen', 'ghost']],
}

const COPY = {
  CLAIMED: ['Mark as claimed?', 'The customer has asked for this reward.'],
  DELIVERED: ['Mark as delivered?', 'Confirm the reward has been handed over to the customer. This is final.'],
  CANCELLED: ['Cancel this reward?', 'The customer will no longer be able to claim it. It will not be unlocked again automatically.'],
  AVAILABLE: ['Make available again?', 'The reward goes back to “Available” for the customer.'],
}

export default function ClaimActions({ claim, onDone }) {
  const toast = useToast()
  const [target, setTarget] = useState(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const actions = NEXT[claim.status] || []
  if (!actions.length) return null

  const apply = async () => {
    setLoading(true)
    try {
      await api.patch(`/reward-claims/${claim.id}`, { status: target, notes: notes || undefined })
      toast.success(`Reward ${target.toLowerCase()}`)
      setTarget(null)
      setNotes('')
      onDone?.()
    } catch (e) {
      toast.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      {actions.map(([s, label, variant]) => (
        <Button key={s} size="sm" variant={variant} onClick={() => setTarget(s)}>{label}</Button>
      ))}
      <ConfirmModal
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={apply}
        loading={loading}
        danger={target === 'CANCELLED'}
        title={target ? COPY[target][0] : ''}
        message={target ? COPY[target][1] : ''}
        confirmLabel="Confirm"
      >
        <Textarea label="Note (optional)" className="mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2} />
      </ConfirmModal>
    </div>
  )
}
