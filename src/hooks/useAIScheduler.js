import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { detectConflicts, addMinutes, derivePerSlotDuration } from '../lib/utils'
import { DAYS_OF_WEEK, SCHEDULING_WINDOW_START, SCHEDULING_WINDOW_END } from '../lib/constants'

const LLM_API_KEY = import.meta.env.VITE_LLM_API_KEY
const LLM_API_URL = import.meta.env.VITE_LLM_API_URL

/**
 * Builds the system prompt with timetable context.
 */
function buildSystemPrompt(timetable, slots, assignments) {
  const enabledDays = DAYS_OF_WEEK.filter(d => timetable?.[`day_${d}`])

  const assignmentSummary = (assignments ?? []).map(a =>
    `- ${a.course?.code} (${a.course?.name}, ${a.course?.contact_hours_minutes / 2} min/slot) → Section: ${a.section?.name}, Teacher: ${a.teacher?.name}`
  ).join('\n')

  const slotSummary = (slots ?? []).map(s =>
    `- ${s.day_of_week} ${s.start_time}–${s.end_time}: course_id=${s.course_id}, teacher_id=${s.teacher_id}, room_id=${s.room_id}, section_id=${s.section_id}`
  ).join('\n')

  return `You are an AI scheduling assistant for the DAI-TSMS timetable system.

Timetable: "${timetable?.name ?? 'Unknown'}"
Scheduling window: ${SCHEDULING_WINDOW_START}–${SCHEDULING_WINDOW_END}
Enabled days: ${enabledDays.join(', ')}
Grid granularity: 15 minutes

Constraints:
- Each course must have exactly 2 slots per week
- Each slot duration = course.contact_hours_minutes / 2 (must be in {30,45,60,75,90})
- No teacher, room, or section conflicts allowed
- All times must be on the 15-minute grid

Course-Section Assignments:
${assignmentSummary || '(none)'}

Currently Scheduled Slots:
${slotSummary || '(none)'}

When proposing slots, respond with a JSON block in this exact format:
\`\`\`json
{
  "proposals": [
    {
      "course_id": "uuid",
      "section_id": "uuid",
      "teacher_id": "uuid",
      "room_id": "uuid",
      "day_of_week": "monday",
      "start_time": "09:00",
      "end_time": "10:00"
    }
  ]
}
\`\`\`

Always explain your reasoning before the JSON block.`
}

/**
 * Parses JSON slot proposals from an AI response string.
 */
function parseProposals(content) {
  try {
    const match = content.match(/```json\s*([\s\S]*?)```/)
    if (!match) return null
    const parsed = JSON.parse(match[1])
    return parsed.proposals ?? null
  } catch {
    return null
  }
}

/**
 * Hook that manages AI scheduling conversation.
 *
 * @param {{ timetable, slots, assignments }} context
 * @returns {{ messages, proposals, sending, error, sendMessage, approveProposals, rejectProposals, isConfigured }}
 */
export function useAIScheduler({ timetable, slots = [], assignments = [] }) {
  const [messages, setMessages] = useState([])
  const [proposals, setProposals] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const isConfigured = !!(LLM_API_KEY && LLM_API_URL)

  const sendMessage = useCallback(async (userText) => {
    if (!isConfigured || !userText.trim()) return

    setError('')
    const userMsg = { role: 'user', content: userText }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setSending(true)

    try {
      const systemPrompt = buildSystemPrompt(timetable, slots, assignments)

      const response = await fetch(`${LLM_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedMessages,
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const assistantContent = data.choices?.[0]?.message?.content ?? ''
      const assistantMsg = { role: 'assistant', content: assistantContent }
      setMessages(prev => [...prev, assistantMsg])

      // Parse proposals
      const parsed = parseProposals(assistantContent)
      if (parsed && parsed.length > 0) {
        // Run conflict detection on each proposal
        const enriched = parsed.map(p => {
          const conflicts = detectConflicts(p, slots)
          return { ...p, hasConflict: conflicts.length > 0, conflicts }
        })
        setProposals(enriched)
      }
    } catch (err) {
      setError(err.message ?? 'Failed to contact AI service.')
    } finally {
      setSending(false)
    }
  }, [messages, timetable, slots, assignments, isConfigured])

  const approveProposals = useCallback(async () => {
    if (!proposals || proposals.length === 0) return

    const toInsert = proposals.map(p => ({
      timetable_id: timetable.id,
      day_of_week: p.day_of_week,
      start_time: p.start_time,
      end_time: p.end_time,
      course_id: p.course_id,
      teacher_id: p.teacher_id,
      room_id: p.room_id,
      section_id: p.section_id,
    }))

    const { error: dbErr } = await supabase.from('slots').insert(toInsert)
    if (dbErr) {
      setError(`Failed to save proposals: ${dbErr.message}`)
    } else {
      setProposals(null)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `✓ ${toInsert.length} slot(s) have been saved to the timetable.` },
      ])
    }
  }, [proposals, timetable])

  const rejectProposals = useCallback(() => {
    setProposals(null)
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Proposals rejected. Feel free to ask for different suggestions.' },
    ])
  }, [])

  return {
    messages,
    proposals,
    sending,
    error,
    sendMessage,
    approveProposals,
    rejectProposals,
    isConfigured,
  }
}
