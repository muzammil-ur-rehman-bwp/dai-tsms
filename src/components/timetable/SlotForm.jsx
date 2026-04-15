import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { supabase } from '../../lib/supabase'
import {
  SCHEDULING_WINDOW_START,
  SCHEDULING_WINDOW_END,
  SLOT_INTERVAL_MINUTES,
  DAYS_OF_WEEK,
} from '../../lib/constants'
import {
  addMinutes,
  derivePerSlotDuration,
  isInSchedulingWindow,
  isOnGrid,
  gridIndexToTime,
  timeToGridIndex,
} from '../../lib/utils'
import { useConflictDetection } from '../../hooks/useConflictDetection'

// Build all valid start times for the 15-min grid picker
function buildTimeOptions() {
  const options = []
  const [sh, sm] = SCHEDULING_WINDOW_START.split(':').map(Number)
  const [eh, em] = SCHEDULING_WINDOW_END.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  for (let m = startMin; m < endMin; m += SLOT_INTERVAL_MINUTES) {
    const h = Math.floor(m / 60)
    const min = m % 60
    options.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  }
  return options
}

const TIME_OPTIONS = buildTimeOptions()

/**
 * Modal form to create/edit a slot.
 *
 * Props:
 *   open           - boolean
 *   timetable      - timetable record (with day_* booleans)
 *   initialDay     - pre-filled day string
 *   initialStartTime - pre-filled start time
 *   slot           - existing slot (for edit mode)
 *   onClose        - () => void
 *   onSaved        - () => void
 */
export default function SlotForm({
  open,
  timetable,
  initialDay,
  initialStartTime,
  slot,
  onClose,
  onSaved,
}) {
  const isEdit = !!slot

  const [assignments, setAssignments] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [day, setDay] = useState('')
  const [startTime, setStartTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)

  const { checkConflicts } = useConflictDetection(timetable?.id)

  // Derive enabled days from timetable
  const enabledDays = timetable
    ? DAYS_OF_WEEK.filter(d => timetable[`day_${d}`])
    : ['monday', 'tuesday', 'wednesday', 'thursday']

  useEffect(() => {
    if (!open || !timetable) return
    setErrors([])
    setLoading(true)

    Promise.all([
      supabase
        .from('course_section_assignments')
        .select(`
          id,
          course:courses(id, name, code, contact_hours_minutes),
          section:sections(id, name),
          teacher:teachers(id, name)
        `)
        .eq('timetable_id', timetable.id),
      supabase
        .from('rooms')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
    ]).then(([assignRes, roomRes]) => {
      setAssignments(assignRes.data ?? [])
      setRooms(roomRes.data ?? [])
      setLoading(false)
    })

    if (isEdit) {
      // Find assignment matching slot
      setSelectedRoom(slot.room_id ?? '')
      setDay(slot.day_of_week ?? '')
      setStartTime(slot.start_time ?? '')
    } else {
      setSelectedAssignment('')
      setSelectedRoom('')
      setDay(initialDay ?? enabledDays[0] ?? '')
      setStartTime(initialStartTime ?? SCHEDULING_WINDOW_START)
    }
  }, [open, timetable?.id, isEdit])

  // When editing, set assignment after assignments load
  useEffect(() => {
    if (isEdit && slot && assignments.length > 0) {
      const match = assignments.find(
        a => a.course?.id === slot.course_id && a.section?.id === slot.section_id
      )
      if (match) setSelectedAssignment(match.id)
    }
  }, [assignments, isEdit, slot])

  const currentAssignment = assignments.find(a => a.id === selectedAssignment)
  const derivedDuration = currentAssignment?.course?.contact_hours_minutes
    ? (() => {
        try { return derivePerSlotDuration(currentAssignment.course.contact_hours_minutes) }
        catch { return null }
      })()
    : null

  const endTime = derivedDuration && startTime ? addMinutes(startTime, derivedDuration) : null

  async function handleSubmit() {
    const errs = []

    if (!selectedAssignment) errs.push('Please select a course/section assignment.')
    if (!selectedRoom) errs.push('Please select a room.')
    if (!day) errs.push('Please select a day.')
    if (!startTime) errs.push('Please select a start time.')

    if (errs.length > 0) { setErrors(errs); return }

    if (!enabledDays.includes(day)) {
      errs.push(`Day "${day}" is not enabled for this timetable.`)
    }

    if (!isOnGrid(startTime)) {
      errs.push('Start time must be on the 15-minute grid.')
    }

    if (!derivedDuration) {
      errs.push('Could not derive slot duration from course contact hours.')
    }

    if (errs.length > 0) { setErrors(errs); return }

    const computedEnd = addMinutes(startTime, derivedDuration)

    if (!isInSchedulingWindow(startTime, computedEnd)) {
      errs.push(`Slot must be within ${SCHEDULING_WINDOW_START}–${SCHEDULING_WINDOW_END}.`)
    }

    if (errs.length > 0) { setErrors(errs); return }

    const assignment = currentAssignment

    // Weekly slot count check (max 2 per course+section)
    const { data: existingSlots } = await supabase
      .from('slots')
      .select('id')
      .eq('timetable_id', timetable.id)
      .eq('course_id', assignment.course.id)
      .eq('section_id', assignment.section.id)

    const existingCount = (existingSlots ?? []).filter(s => !isEdit || s.id !== slot?.id).length
    if (existingCount >= 2) {
      errs.push('This course already has 2 slots scheduled for this section this week (maximum reached).')
    }

    if (errs.length > 0) { setErrors(errs); return }

    const newSlotData = {
      timetable_id: timetable.id,
      assignment_id: assignment.id,
      day_of_week: day,
      start_time: startTime,
      end_time: computedEnd,
      course_id: assignment.course.id,
      teacher_id: assignment.teacher.id,
      room_id: selectedRoom,
      section_id: assignment.section.id,
    }

    // Conflict detection
    const conflictList = await checkConflicts(newSlotData, isEdit ? slot?.id : null)
    if (conflictList.length > 0) {
      const types = [...new Set(conflictList.map(c => c.type))]
      errs.push(`Scheduling conflict detected: ${types.join(', ')} conflict(s). Please choose a different time or resource.`)
    }

    if (errs.length > 0) { setErrors(errs); return }

    setSaving(true)
    let dbError
    if (isEdit) {
      const { error } = await supabase.from('slots').update(newSlotData).eq('id', slot.id)
      dbError = error
    } else {
      const { error } = await supabase.from('slots').insert(newSlotData)
      dbError = error
    }
    setSaving(false)

    if (dbError) {
      setErrors([dbError.message])
    } else {
      onSaved?.()
      onClose?.()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white shadow-xl p-6 space-y-4 my-4">
          <Dialog.Title className="text-base font-semibold text-gray-900">
            {isEdit ? 'Edit Slot' : 'Create Slot'}
          </Dialog.Title>

          {loading && <p className="text-sm text-gray-500">Loading options…</p>}

          {errors.length > 0 && (
            <ul className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
              {errors.map((e, i) => (
                <li key={i} className="text-sm text-red-700">{e}</li>
              ))}
            </ul>
          )}

          {/* Course / Section / Teacher */}
          <div>
            <label htmlFor="sf-assignment" className="block text-xs font-medium text-gray-600 mb-1">
              Course / Section / Teacher
            </label>
            <select
              id="sf-assignment"
              value={selectedAssignment}
              onChange={e => setSelectedAssignment(e.target.value)}
              aria-label="Select course section assignment"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select Assignment —</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.course?.code} — {a.section?.name} — {a.teacher?.name}
                </option>
              ))}
            </select>
            {derivedDuration && (
              <p className="mt-1 text-xs text-gray-500">
                Slot duration: <strong>{derivedDuration} min</strong>
              </p>
            )}
          </div>

          {/* Room */}
          <div>
            <label htmlFor="sf-room" className="block text-xs font-medium text-gray-600 mb-1">Room</label>
            <select
              id="sf-room"
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              aria-label="Select room"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select Room —</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Day */}
          <div>
            <label htmlFor="sf-day" className="block text-xs font-medium text-gray-600 mb-1">Day</label>
            <select
              id="sf-day"
              value={day}
              onChange={e => setDay(e.target.value)}
              aria-label="Select day of week"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select Day —</option>
              {enabledDays.map(d => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="sf-start" className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
            <select
              id="sf-start"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              aria-label="Select start time"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select Start Time —</option>
              {TIME_OPTIONS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {endTime && (
              <p className="mt-1 text-xs text-gray-500">
                End time: <strong>{endTime}</strong>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              aria-label="Cancel slot form"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              aria-label={isEdit ? 'Save slot changes' : 'Create slot'}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Slot'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
