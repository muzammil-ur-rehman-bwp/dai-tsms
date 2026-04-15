import { useMemo } from 'react'
import {
  SCHEDULING_WINDOW_START,
  SCHEDULING_WINDOW_END,
  SLOT_INTERVAL_MINUTES,
} from '../../lib/constants'
import { gridIndexToTime, timeToGridIndex, timeDiffMinutes } from '../../lib/utils'
import SlotCell from './SlotCell'

// Build the list of time labels for the left axis (08:00 – 19:45)
function buildTimeRows() {
  const rows = []
  const [sh, sm] = SCHEDULING_WINDOW_START.split(':').map(Number)
  const [eh, em] = SCHEDULING_WINDOW_END.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  for (let m = startMin; m < endMin; m += SLOT_INTERVAL_MINUTES) {
    const h = Math.floor(m / 60)
    const min = m % 60
    rows.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return rows
}

const TIME_ROWS = buildTimeRows() // 48 rows

/**
 * Renders the 08:00–20:00 scheduling grid with 15-min rows.
 *
 * Props:
 *   slots        - array of slot records (with course, teacher, room joined or passed separately)
 *   courses      - map of id → { name, code }
 *   teachers     - map of id → { name }
 *   rooms        - map of id → { name }
 *   conflicts    - Set of slot ids that have conflicts
 *   enabledDays  - array of day strings (e.g. ['monday','tuesday',...])
 *   onCellClick  - (day, startTime) => void
 *   onSlotClick  - (slot) => void
 */
export default function TimetableGrid({
  slots = [],
  courses = {},
  teachers = {},
  rooms = {},
  conflicts = new Set(),
  enabledDays = ['monday', 'tuesday', 'wednesday', 'thursday'],
  onCellClick,
  onSlotClick,
}) {
  // Build a map: day → gridIndex → slot (only the first slot starting at that index)
  const slotMap = useMemo(() => {
    const map = {}
    for (const day of enabledDays) {
      map[day] = {}
    }
    for (const slot of slots) {
      if (!map[slot.day_of_week]) continue
      const idx = timeToGridIndex(slot.start_time)
      if (map[slot.day_of_week][idx] === undefined) {
        map[slot.day_of_week][idx] = slot
      }
    }
    return map
  }, [slots, enabledDays])

  // Track which grid rows are "occupied" (covered by a multi-row slot) per day
  const occupiedRows = useMemo(() => {
    const occ = {}
    for (const day of enabledDays) {
      occ[day] = new Set()
    }
    for (const slot of slots) {
      if (!occ[slot.day_of_week]) continue
      const startIdx = timeToGridIndex(slot.start_time)
      const duration = timeDiffMinutes(slot.start_time, slot.end_time)
      const rowSpan = Math.round(duration / SLOT_INTERVAL_MINUTES)
      // Mark rows 1..rowSpan-1 as occupied (row 0 is the slot start, rendered there)
      for (let i = 1; i < rowSpan; i++) {
        occ[slot.day_of_week].add(startIdx + i)
      }
    }
    return occ
  }, [slots, enabledDays])

  const ROW_HEIGHT = 28 // px per 15-min row

  return (
    <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `64px repeat(${enabledDays.length}, minmax(100px, 1fr))`,
          minWidth: `${64 + enabledDays.length * 100}px`,
        }}
      >
        {/* Header row */}
        <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 px-2 py-2 text-xs font-medium text-gray-500 text-center">
          Time
        </div>
        {enabledDays.map(day => (
          <div
            key={day}
            className="sticky top-0 z-20 bg-gray-50 border-b border-l border-gray-200 px-2 py-2 text-xs font-semibold text-gray-700 text-center capitalize"
          >
            {day}
          </div>
        ))}

        {/* Time rows */}
        {TIME_ROWS.map((time, rowIdx) => (
          <>
            {/* Time label */}
            <div
              key={`time-${time}`}
              className={`border-b border-gray-100 px-2 flex items-start justify-end pr-2 text-xs text-gray-400 ${rowIdx % 4 === 0 ? 'font-medium text-gray-600' : ''}`}
              style={{ height: ROW_HEIGHT }}
            >
              {rowIdx % 4 === 0 ? time : ''}
            </div>

            {/* Day cells */}
            {enabledDays.map(day => {
              const slot = slotMap[day]?.[rowIdx]
              const isOccupied = occupiedRows[day]?.has(rowIdx)

              if (isOccupied) {
                // This row is covered by a multi-row slot rendered above
                return (
                  <div
                    key={`${day}-${rowIdx}-occupied`}
                    className="border-b border-l border-gray-100"
                    style={{ height: ROW_HEIGHT }}
                  />
                )
              }

              if (slot) {
                const duration = timeDiffMinutes(slot.start_time, slot.end_time)
                const rowSpan = Math.round(duration / SLOT_INTERVAL_MINUTES)
                return (
                  <div
                    key={`${day}-${rowIdx}-slot`}
                    className="border-b border-l border-gray-100 relative"
                    style={{ height: ROW_HEIGHT * rowSpan }}
                  >
                    <SlotCell
                      slot={slot}
                      course={courses[slot.course_id]}
                      teacher={teachers[slot.teacher_id]}
                      room={rooms[slot.room_id]}
                      hasConflict={conflicts.has(slot.id)}
                      onClick={() => onSlotClick?.(slot)}
                    />
                  </div>
                )
              }

              // Empty clickable cell
              return (
                <div
                  key={`${day}-${rowIdx}-empty`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Empty cell: ${day} at ${time}`}
                  onClick={() => onCellClick?.(day, time)}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onCellClick?.(day, time)}
                  className="border-b border-l border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                  style={{ height: ROW_HEIGHT }}
                />
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
