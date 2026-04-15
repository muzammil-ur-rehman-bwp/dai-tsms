/**
 * Chat message bubble.
 * Props: role ('user'|'assistant'), content (string)
 */
export default function AIMessage({ role, content }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
          ${isUser
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }
        `}
        aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
      >
        {content}
      </div>
    </div>
  )
}
