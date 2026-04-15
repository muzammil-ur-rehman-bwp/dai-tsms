import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { detectConflicts } from '../../lib/utils'

/**
 * Modal form to submit a swap request.
 * Props:
 *   teacherId  - current teacher's UUID
 *   onClose    - () => void
 *   onSubmitted - () => void  (called after successful submission)
 */
export default function SwapRequestForm({ teacherId, onClose, onSubmitted }) {
  const { user } = useAuth()
  const [mySlots, setMySlots] = useState([])
  const [otherTeachers, setOtherTeachers] = useState([])
  const [targetTeacherId, setTargetTeacherId] = useState('')
  const [targetSlots, setTargetSlots] = useState([])
  const [mySlotId, setMySlotId] = useState('')
  const [targetSlotId, setTargetSlotId] = useState('')
  const [allSlots, setAllSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [conflictWarning, setConflictWarning] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      // Get active published timetable
      const { data: tt } = await supabase
        .from('timetables')
        .select('id')
        .eq('status', 'published')
        .limit(1)
        .single()

      if (!tt) { setLoading(false); return }

      const [{ data: mine }, { data: all }, { data: teachers }] = await Promise.all([
        supabase.from('slots').select('*, course:courses(name,code), room:rooms(name), section:sections(name)')
          .eq('timetable_id', tt.id).eq('teacher_id', teacherId),
        supabase.from('slots').select('*').eq('timetable_id', tt.id),
        supabase.from('teachers').select('id, name').eq('is_active', true).neq('id', teacherId).order('name'),
      ])

      setMySlots(mine ?? [])
      setAllSlots(all ?? [])
      setOtherTeachers(teachers ?? [])
      setLoading(false)
    }
    load()
  }, [teacherId])

  // Load target teacher's slots when teacher changes
  useEffect(() => {
    if (!targetTeacherId) { setTargetSlots([]); return }
    const filtered = allSlots.filter(s => s.teacher_id === targetTeacherId)
    setTargetSlots(filtered)
    setTargetSlotId('')
  }, [targetTeacherId, allSlots])

  // Client-side conflict pre-check
  useEffect(() => {
    setConflictWarning(null)
    if (!mySlotId || !targetSlotId) return

    const mySlot = mySlots.find(s => s.id === mySlotId)
    const targetSlot = allSlots.find(s => s.id === targetSlotId)
    if (!mySlot || !targetSlot) return

    // Check if swapping would cause conflicts:
    // mySlot moves to targetSlot's day/time, targetSlot moves to mySlot's day/time
    const otherSlots = allSlots.filter(s => s.id !== mySlotId && s.id !== targetSlotId)

    const mySwapped = { ...mySlot, day_of_week: targetSlot.day_of_week, start_time: targetSlot.start_time, end_time: targetSlot.end_time }
    const targetSwapped = { ...targetSlot, day_of_week: mySlot.day_of_week, start_time: mySlot.start_time, end_time: mySlot.end_time }

    const c1 = detectConflicts(mySwapped, otherSlots)
    const c2 = detectConflicts(targetSwapped, otherSlots)

    if (c1.length > 0 || c2.length > 0) {
      setConflictWarning(`Warning: This swap may cause ${c1.length + c2.length} conflict(s). You can still submit for review.`)
    }
  }, [mySlotId, targetSlotId, mySlots, allSlots])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!mySlotId || !targetSlotId) return
    setSubmitting(true)
    setError(null)

    const targetSlot = allSlots.find(s => s.id === targetSlotId)

    const { error: insertErr } = await supabase.from('swap_requests').insert({
      requesting_slot_id: mySlotId,
      target_slot_id: targetSlotId,
      requesting_teacher_id: teacherId,
      target_teacher_id: targetSlot?.teacher_id,
      status: 'pending',
    })

    setSubmitting(false)
    if (insertErr) { setError(insertErr.message); return }
    onSubmitted?.()
    onClose?.()
  }

  function formatSlot(slot) {
    const day = slot.day_of_week?.charAt(0).toUpperCase() + slot.day_of_week?.slice(1)
    return `${slot.course?.name ?? '?'} — ${day} ${slot.start_time}–${slot.end_time} (${slot.section?.name ?? '?'})`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Submit swap request"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Request Slot Swap</h2>
          <button
            onClick={onClose}
            aria-label="Close swap request form"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-gray-200 animate-pulse" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* My slot */}
            <div>
              <label htmlFor="my-slot" className="block text-sm font-medium text-gray-700 mb-1">
                Your slot to swap
              </label>
              <select
                id="my-slot"
                value={mySlotId}
                onChange={e => setMySlotId(e.target.value)}
                required
                aria-label="Select your slot to swap"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Select your slot —</option>
                {mySlots.map(s => (
                  <option key={s.id} value={s.id}>{formatSlot(s)}</option>
                ))}
              </select>
            </div>

            {/* Target teacher */}
            <div>
              <label htmlFor="target-teacher" className="block text-sm font-medium text-gray-700 mb-1">
                Target teacher
              </label>
              <select
                id="target-teacher"
                value={targetTeacherId}
                onChange={e => setTargetTeacherId(e.target.value)}
                required
                aria-label="Select target teacher"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">— Select teacher —</option>
                {otherTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Target slot */}
            {targetTeacherId && (
              <div>
                <label htmlFor="target-slot" className="block text-sm font-medium text-gray-700 mb-1">
                  Target slot
                </label>
                <select
                  id="target-slot"
                  value={targetSlotId}
                  onChange={e => setTargetSlotId(e.target.value)}
                  required
                  aria-label="Select target slot"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— Select target slot —</option>
                  {targetSlots.map(s => (
                    <option key={s.id} value={s.id}>{formatSlot(s)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Conflict warning */}
            {conflictWarning && (
              <p className="text-xs text-warning bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                {conflictWarning}
              </p>
            )}

            {error && <p className="text-xs text-danger">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Cancel swap request"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !mySlotId || !targetSlotId}
                aria-label="Submit swap request"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
