import { useState, type FormEvent } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import RecipientChips from './RecipientChips'
import { useReceivers } from '../../hooks/useReceivers'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { transfer } from '../../api/banking'
import { ApiError } from '../../api/client'
import { formatCurrency } from '../../utils/stats'
import './transfer.css'

type Banner = { type: 'success' | 'error'; text: string } | null

export default function TransferPage() {
  const { receivers, loading } = useReceivers()
  const { balance, setBalance } = useAuth()
  const { show } = useToast()

  const [receiver, setReceiver] = useState('')
  const [amount, setAmount] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  // Validation errors are only surfaced once the user has tried to submit, so
  // an empty/untouched form never shows errors on load.
  const [submitted, setSubmitted] = useState(false)

  const amountNum = parseFloat(amount)
  const receiverError = receiver.trim() === '' ? 'Enter a recipient (account ID or email).' : null
  const amountError =
    isNaN(amountNum) || amountNum <= 0
      ? 'Enter an amount greater than zero.'
      : balance != null && amountNum > balance
        ? 'Amount exceeds your available balance.'
        : null
  const valid = !receiverError && !amountError

  // Resolve the friendly name for whatever is in the field (a picked chip's Cid
  // or a typed value), so the user can see who they're sending to.
  const matchedReceiver = receivers.find(
    (r) => String(r.Cid) === receiver.trim() || r.email === receiver.trim(),
  )
  const recipientLabel = matchedReceiver?.Cname || receiver.trim()

  function pickReceiver(value: string) {
    setReceiver(value)
    setBanner(null)
  }

  function handleReview(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setBanner(null)
    if (!valid) return
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    setSending(true)
    try {
      const res = await transfer(receiver.trim(), amountNum)
      setBalance(res.new_balance)
      setBanner({
        type: 'success',
        text: `${formatCurrency(res.transfer_amount)} sent to ${res.receiver_name}. New balance: ${formatCurrency(res.new_balance)}`,
      })
      show(`Transfer of ${formatCurrency(res.transfer_amount)} completed.`, 'success')
      setReceiver('')
      setAmount('')
      setSubmitted(false)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Transfer failed. Please try again.'
      setBanner({ type: 'error', text: msg })
      show(msg, 'error')
    } finally {
      setSending(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <div>
        <h1 className="page-title">Transfer money</h1>
        <p className="page-subtitle">Send funds to another KODBANK account.</p>
      </div>

      {banner && <div className={`banner banner--${banner.type}`}>{banner.text}</div>}

      <div className="transfer-grid">
        <Card className="transfer-form-card">
          <div className="transfer-balance-pill">
            Available: <strong>{balance == null ? '—' : formatCurrency(balance)}</strong>
          </div>
          <form onSubmit={handleReview} className="transfer-form" noValidate>
            <Input
              id="receiver"
              label="Recipient (account ID or email)"
              placeholder="e.g. 2 or user@email.com"
              value={receiver}
              onChange={(e) => {
                setReceiver(e.target.value)
                setBanner(null)
              }}
              autoComplete="off"
              error={submitted ? receiverError : null}
              hint={
                matchedReceiver
                  ? `Sending to ${matchedReceiver.Cname} (#${matchedReceiver.Cid})`
                  : undefined
              }
            />
            <Input
              id="amount"
              label="Amount (₹)"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setBanner(null)
              }}
              error={submitted ? amountError : null}
            />
            <Button type="submit" block>
              Review transfer
            </Button>
          </form>
        </Card>

        <Card className="transfer-chips-card">
          <div className="section-head">
            <span className="section-title">Recent recipients</span>
          </div>
          <RecipientChips
            receivers={receivers}
            loading={loading}
            selectedId={receiver.trim()}
            onPick={pickReceiver}
          />
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title="Confirm transfer"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} loading={sending}>
              Send {valid ? formatCurrency(amountNum) : ''}
            </Button>
          </>
        }
      >
        <div className="confirm-body">
          <div className="confirm-amount">{valid ? formatCurrency(amountNum) : '—'}</div>
          <div className="confirm-row">
            <span className="muted">To</span>
            <span>{recipientLabel}</span>
          </div>
          <div className="confirm-row">
            <span className="muted">From</span>
            <span>Your savings account</span>
          </div>
          {balance != null && valid && (
            <div className="confirm-row">
              <span className="muted">Balance after</span>
              <span>{formatCurrency(balance - amountNum)}</span>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
