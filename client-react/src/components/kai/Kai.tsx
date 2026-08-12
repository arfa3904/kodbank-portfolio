import { useEffect, useRef, useState, type FormEvent } from 'react'
import { sendKaiMessage } from '../../api/kai'
import type { ChatMessage } from '../../types'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import './kai.css'

let idSeq = 0
const nextId = () => `m${++idSeq}`

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'bot',
  text: "Hi, I'm KAI 👋 — your KODBANK assistant. Ask me about your balance, transfers, or statements.",
}

export default function Kai() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)

  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to newest whenever the thread changes or typing toggles.
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || typing) return

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setTyping(true)

    try {
      const reply = await sendKaiMessage(text, history)
      setMessages((prev) => [...prev, { id: nextId(), role: 'bot', text: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'bot', text: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      <button
        className={`kai-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close KAI assistant' : 'Open KAI assistant'}
      >
        {open ? '×' : 'KAI'}
      </button>

      <div className={`kai-panel ${open ? 'is-open' : ''}`} role="dialog" aria-label="KAI assistant">
        <div className="kai-header">
          <div className="kai-header-id">
            <span className="kai-avatar">🤖</span>
            <div>
              <div className="kai-title">KAI Assistant</div>
              <div className="kai-status">
                <span className="kai-dot" /> Online
              </div>
            </div>
          </div>
          <button className="kai-close" onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
        </div>

        <div className="kai-thread" ref={threadRef}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {typing && <TypingIndicator />}
        </div>

        <form className="kai-input-row" onSubmit={handleSend}>
          <input
            ref={inputRef}
            className="kai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message KAI…"
            aria-label="Message KAI"
          />
          <button className="kai-send" type="submit" disabled={!input.trim() || typing} aria-label="Send">
            ➤
          </button>
        </form>
      </div>
    </>
  )
}
