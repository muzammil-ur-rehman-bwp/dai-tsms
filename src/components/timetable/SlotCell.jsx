import { SLOT_INTERVAL_MINUTES } from '../../lib/constants'
import { timeDiffMinutes } from '../../lib/utils'

// 12-color accessible palette for course color-coding
const SLOT_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4',
  '#84CC16', '#F97316', '#EC4899', '#6366F1', '#14B8A6', '#A855F7',
]

// Text colors paired with each background for readability
const SLOT_TEXT_COLORS = [
  '#1E3A8A', '#4C1D95', '#064E3B', '#78350F', '#7F1D1D', '#164E63',
  '#365314', '#7C2D12', '#831843', '#312E81', '#134E4A', '#581C87',
]

function hashCourseCode(code) {
  if (!code) return 0
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(hash) % SLOT_COLORS.length
}

/**
 * Renders an occupied slot spanning the correct number of rows based on duration.
 *
 * Props:
 *   slot       - slot record { start_time, end_time, ... }
 *   course     - { name, code }
 *   teacher    - { name }
 *   room       - { name }
 *   hasConflict - boolean
 *   onClick    - () => void
 */
export default function SlotCell({ slot, course, teacher, room, hasConflict, onClick }) {
  const durationMinutes = timeDiffMinutes(slot.start_time, slot.end_time)
  const rowSpan = Math.round(durationMinutes / SLOT_INTERVAL_MINUTES)

  const colorIndex = hashCourseCode(course?.code)
  const bgColor = SLOT_COLORS[colorIndex]
  const textColor = SLOT_TEXT_COLORS[colorIndex]

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Slot: ${course?.name ?? 'Unknown'} — ${teacher?.name ?? ''} — ${room?.name ?? ''} — ${slot.start_time}–${slot.end_time}${hasConflict ? ' (has conflicts)' : ''}`}
      onClick={onClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
      className={`
        absolute inset-x-0.5 rounded-md px-1.5 py-1 cursor-pointer overflow-hidden
        transition-opacity hover:opacity-90 select-none
        ${hasConflict ? 'ring-2 ring-red-500 ring-offset-1' : ''}
      `}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        top: 0,
        height: `calc(${rowSpan * 100}% - 2px)`,
        zIndex: 10,
      }}
    >
      {hasConflict && (
        <span className="absolute top-1 right-1 flex h-2 w-2" aria-hidden="true">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
        </span>
      )}
      <p className="text-xs font-semibold leading-tight truncate">{course?.name ?? '—'}</p>
      {rowSpan >= 3 && (
        <p className="text-xs leading-tight truncate opacity-80">{teacher?.name ?? ''}</p>
      )}
      {rowSpan >= 4 && (
        <p className="text-xs leading-tight truncate opacity-70">{room?.name ?? ''}</p>
      )}
    </div>
  )
}
