import type { ChatMessage } from '../../types'

export default function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`kai-msg kai-msg--${message.role}`}>
      <div className={`kai-bubble kai-bubble--${message.role}`}>{message.text}</div>
    </div>
  )
}
