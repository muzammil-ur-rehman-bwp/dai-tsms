import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { TimetableProvider, useTimetableContext } from '../../contexts/TimetableContext'
import TimetableGrid from '../../components/timetable/TimetableGrid'
import SlotForm from '../../components/timetable/SlotForm'
import TimetableFilters from '../../components/timetable/TimetableFilters'
import AIChatPanel from '../../components/ai/AIChatPanel'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ErrorBanner from '../../components/ui/ErrorBanner'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import Badge from '../../components/ui/Badge'
import { DAYS_OF_WEEK, STANDARD_DAYS, EXTENDED_DAYS } from '../../lib/constants'
import { detectConflicts, findFreeWindow, derivePerSlotDuration } from '../../lib/utils'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

// ─── Inner page (consumes TimetableContext) ──────────────────────────────────

function SchedulingPageInner() {
  const navigate = useNavigate()
  const {
    timetable,
    slots,
    assignments,
    loading,
    error: ctxError,
    refetch,
    addSlotOptimistic,
    removeSlotOptimistic,
  } = useTimetableContext()

  const [filters, setFilters] = useState({ section: '', teacher: '', room: '', day: '' })
  const [slotFormOpen, setSlotFormOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)
  const [initialDay, setInitialDay] = useState('')
  const [initialStartTime, setInitialStartTime] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [pageError, setPageError] = useState('')
  const [dayToggling, setDayToggling] = useState(false)
  const [disableDayDialog, setDisableDayDialog] = useState(null) // { day, unresolvable: [] }

  // Enabled days derived from timetable
  const enabledDays = useMemo(() => {
    if (!timetable) return STANDARD_DAYS
    return DAYS_OF_WEEK.filter(d => timetable[`day_${d}`])
  }, [timetable])

  // Build lookup maps for courses, teachers, rooms
  const { coursesMap, teachersMap, roomsMap } = useMemo(() => {
    const coursesMap = {}
    const teachersMap = {}
    const roomsMap = {}
    for (const a of assignments) {
      if (a.course) coursesMap[a.course.id] = a.course
      if (a.teacher) teachersMap[a.teacher.id] = a.teacher
    }
    // Also collect rooms from slots (rooms aren't in assignments)
    return { coursesMap, teachersMap, roomsMap }
  }, [assignments])

  // Fetch rooms separately for the map
  const [roomsData, setRoomsData] = useState({})
  useMemo(() => {
    if (slots.length === 0) return
    const roomIds = [...new Set(slots.map(s => s.room_id).filter(Boolean))]
    if (roomIds.length === 0) return
    supabase
      .from('rooms')
      .select('id, name')
      .in('id', roomIds)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        for (const r of data) map[r.id] = r
        setRoomsData(map)
      })
  }, [slots])

  // Detect conflicts across all slots
  const conflictSlotIds = useMemo(() => {
    const ids = new Set()
    for (let i = 0; i < slots.length; i++) {
      const others = slots.filter((_, j) => j !== i)
      const conflicts = detectConflicts(slots[i], others)
      if (conflicts.length > 0) ids.add(slots[i].id)
    }
    return ids
  }, [slots])

  // Apply filters
  const filteredSlots = useMemo(() => {
    return slots.filter(s => {
      if (filters.section && s.section_id !== filters.section) return false
      if (filters.teacher && s.teacher_id !== filters.teacher) return false
      if (filters.room && s.room_id !== filters.room) return false
      if (filters.day && s.day_of_week !== filters.day) return false
      return true
    })
  }, [slots, filters])

  // Course completion status
  const completionStatus = useMemo(() => {
    return assignments.map(a => {
      const count = slots.filter(
        s => s.course_id === a.course?.id && s.section_id === a.section?.id
      ).length
      return { assignment: a, count, complete: count >= 2 }
    })
  }, [assignments, slots])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleCellClick(day, startTime) {
    setEditingSlot(null)
    setInitialDay(day)
    setInitialStartTime(startTime)
    setSlotFormOpen(true)
  }

  function handleSlotClick(slot) {
    setEditingSlot(slot)
    setInitialDay(slot.day_of_week)
    setInitialStartTime(slot.start_time)
    setSlotFormOpen(true)
  }

  async function handleDeleteSlot() {
    if (!deleteTarget) return
    const { error } = await supabase.from('slots').delete().eq('id', deleteTarget.id)
    if (error) setPageError(error.message)
    else {
      removeSlotOptimistic(deleteTarget.id)
      await refetch()
    }
    setDeleteTarget(null)
  }

  // Scheduling days toggle
  async function handleDayToggle(day, enabled) {
    if (!timetable) return
    setDayToggling(true)
    setPageError('')

    if (!enabled) {
      // Disabling: check for occupied slots on this day
      const occupiedOnDay = slots.filter(s => s.day_of_week === day)
      if (occupiedOnDay.length > 0) {
        // Try auto-reschedule
        const otherDays = enabledDays.filter(d => d !== day)
        const unresolvable = []
        for (const slot of occupiedOnDay) {
          const free = findFreeWindow(slot, otherDays, slots.filter(s => s.id !== slot.id))
          if (!free) unresolvable.push(slot)
        }
        if (unresolvable.length > 0) {
          setDisableDayDialog({ day, unresolvable })
          setDayToggling(false)
          return
        }
        // Auto-reschedule all
        for (const slot of occupiedOnDay) {
          const free = findFreeWindow(slot, otherDays, slots.filter(s => s.id !== slot.id))
          if (free) {
            await supabase.from('slots').update({
              day_of_week: free.day,
              start_time: free.startTime,
              end_time: free.endTime,
            }).eq('id', slot.id)
          }
        }
      }
    }

    const { error } = await supabase
      .from('timetables')
      .update({ [`day_${day}`]: enabled })
      .eq('id', timetable.id)

    if (error) setPageError(error.message)
    else await refetch()
    setDayToggling(false)
  }

  async function handleForceDisableDay() {
    if (!disableDayDialog) return
    const { day } = disableDayDialog
    const { error } = await supabase
      .from('timetables')
      .update({ [`day_${day}`]: false })
      .eq('id', timetable.id)
    if (error) setPageError(error.message)
    else await refetch()
    setDisableDayDialog(null)
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton rows={6} />
      </div>
    )
  }

  if (!timetable) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Timetable not found.</p>
        <button
          onClick={() => navigate('/admin/timetables')}
          aria-label="Back to timetables"
          className="mt-3 text-sm text-primary underline"
        >
          ← Back to Timetables
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/admin/timetables')}
                aria-label="Back to timetables"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Timetables
              </button>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mt-1">{timetable.name}</h1>
            <p className="text-sm text-gray-500">{timetable.academic_period?.name}</p>
          </div>
          <Badge variant={timetable.status}>
            {timetable.status.charAt(0).toUpperCase() + timetable.status.slice(1)}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <ErrorBanner message={pageError || ctxError} onDismiss={() => setPageError('')} />

          {/* Scheduling days configuration */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Scheduling Days</h2>
            <div className="flex flex-wrap gap-4">
              {DAYS_OF_WEEK.map(day => {
                const isStandard = STANDARD_DAYS.includes(day)
                const isEnabled = enabledDays.includes(day)
                return (
                  <label
                    key={day}
                    className={`flex items-center gap-2 text-sm ${isStandard ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={isStandard || dayToggling}
                      onChange={e => handleDayToggle(day, e.target.checked)}
                      aria-label={`Toggle ${day}`}
                      className="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                    <span className="capitalize">{day}</span>
                    {isStandard && <span className="text-xs text-gray-400">(always on)</span>}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Filters */}
          <TimetableFilters
            timetableId={timetable.id}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Timetable grid */}
          <TimetableGrid
            slots={filteredSlots}
            courses={coursesMap}
            teachers={teachersMap}
            rooms={roomsData}
            conflicts={conflictSlotIds}
            enabledDays={filters.day ? [filters.day] : enabledDays}
            onCellClick={handleCellClick}
            onSlotClick={handleSlotClick}
          />

          {/* Course completion status */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Course Completion Status</h2>
            {completionStatus.length === 0 ? (
              <p className="text-sm text-gray-400">No course-section assignments found.</p>
            ) : (
              <div className="space-y-1.5">
                {completionStatus.map(({ assignment: a, count, complete }) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {a.course?.code} — {a.section?.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {complete ? (
                        <CheckCircleIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-danger" aria-hidden="true" />
                      )}
                      <span className={`text-xs font-medium ${complete ? 'text-accent' : 'text-danger'}`}>
                        {count}/2
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel: AI chat */}
      <AIChatPanel
        timetable={timetable}
        slots={slots}
        assignments={assignments}
      />

      {/* Slot form modal */}
      <SlotForm
        open={slotFormOpen}
        timetable={timetable}
        initialDay={initialDay}
        initialStartTime={initialStartTime}
        slot={editingSlot}
        onClose={() => { setSlotFormOpen(false); setEditingSlot(null) }}
        onSaved={async () => {
          await refetch()
          // Show delete button on edit
          if (editingSlot) setDeleteTarget(null)
        }}
      />

      {/* Delete confirmation */}
      {editingSlot && slotFormOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => { setDeleteTarget(editingSlot); setSlotFormOpen(false) }}
            aria-label="Delete this slot"
            className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 shadow-lg"
          >
            Delete Slot
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Slot"
        message="Are you sure you want to delete this slot? This cannot be undone."
        onConfirm={handleDeleteSlot}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Safe-disable day dialog */}
      <ConfirmDialog
        open={!!disableDayDialog}
        title={`Cannot Auto-Reschedule All Slots on ${disableDayDialog?.day ?? ''}`}
        message={`${disableDayDialog?.unresolvable?.length ?? 0} slot(s) could not be automatically rescheduled. Disabling this day will leave those slots on a disabled day. Do you want to proceed anyway?`}
        onConfirm={handleForceDisableDay}
        onCancel={() => setDisableDayDialog(null)}
      />
    </div>
  )
}

// ─── Page wrapper with TimetableProvider ─────────────────────────────────────

export default function TimetableSchedulingPage() {
  const { id } = useParams()

  return (
    <TimetableProvider timetableId={id}>
      <SchedulingPageInner />
    </TimetableProvider>
  )
}
