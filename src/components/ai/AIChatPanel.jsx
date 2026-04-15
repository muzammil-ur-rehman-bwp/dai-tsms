import { useRef, useState, useEffect } from 'react'
import { ChevronRightIcon, ChevronLeftIcon, PaperAirplaneIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useAIScheduler } from '../../hooks/useAIScheduler'
import AIMessage from './AIMessage'
import AIProposalCard from './AIProposalCard'

/**
 * Collapsible sidebar AI chat panel.
 *
 * Props:
 *   timetable   - timetable record
 *   slots       - array of slot records
 *   assignments - array of assignment records
 */
export default function AIChatPanel({ timetable, slots = [], assignments = [] }) {
  const [collapsed, setCollapsed] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const {
    messages,
    proposals,
    sending,
    error,
    sendMessage,
    approveProposals,
    rejectProposals,
    isConfigured,
  } = useAIScheduler({ timetable, slots, assignments })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, proposals])

  function handleSend() {
    if (!input.trim() || sending) return
    sendMessage(input.trim())
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (collapsed) {
    return (
      <div className="flex flex-col items-center w-10 bg-white border-l border-gray-200 py-4">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand AI chat panel"
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <span
          className="mt-4 text-xs font-medium text-gray-400 writing-mode-vertical"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          AI Assistant
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-80 bg-white border-l border-gray-200 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">AI Scheduling Assistant</span>
          {isConfigured && (
            <span className="inline-flex h-2 w-2 rounded-full bg-accent" aria-label="AI connected" />
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse AI chat panel"
          className="p-1 rounded-md hover:bg-gray-200 text-gray-500"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Config error banner */}
      {!isConfigured && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
          <ExclamationCircleIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-amber-700">
            AI Assistant is disabled. Set <code className="font-mono">VITE_LLM_API_KEY</code> and{' '}
            <code className="font-mono">VITE_LLM_API_URL</code> environment variables to enable.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && isConfigured && (
          <p className="text-xs text-gray-400 text-center mt-4">
            Ask me to suggest slots, resolve conflicts, or optimize the schedule.
          </p>
        )}
        {messages.map((msg, i) => (
          <AIMessage key={i} role={msg.role} content={msg.content} />
        ))}
        {proposals && (
          <AIProposalCard
            proposals={proposals.map(p => ({
              ...p,
              course: p.course_id,
              section: p.section_id,
              teacher: p.teacher_id,
              room: p.room_id,
              day: p.day_of_week,
              startTime: p.start_time,
              endTime: p.end_time,
            }))}
            onApprove={approveProposals}
            onReject={rejectProposals}
          />
        )}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConfigured || sending}
            placeholder={isConfigured ? 'Ask the AI assistant…' : 'AI disabled'}
            aria-label="AI chat input"
            rows={2}
            className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!isConfigured || sending || !input.trim()}
            aria-label="Send message to AI"
            className="self-end rounded-md bg-primary p-2 text-white hover:bg-primary-700 disabled:opacity-40"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {sending && (
          <p className="mt-1 text-xs text-gray-400 animate-pulse">AI is thinking…</p>
        )}
      </div>
    </div>
  )
}
