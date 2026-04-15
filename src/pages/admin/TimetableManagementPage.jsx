import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorBanner from '../../components/ui/ErrorBanner'
import Badge from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Dialog } from '@headlessui/react'
import { splitSlot, mergeSlots, detectConflicts, timeDiffMinutes } from '../../lib/utils'
import { SUPPORTED_DURATIONS } from '../../lib/constants'

function CreateTimetableModal({ open, onClose, onCreated }) {
  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    supabase
      .from('academic_periods')
      .select('id, name')
      .order('name')
      .then(({ data }) => setPeriods(data ?? []))
  }, [open])

  async function handleCreate() {
    if (!selectedPeriod) { setError('Please select an academic period.'); return }
    setSaving(true)
    setError('')
    const period = periods.find(p => p.id === selectedPeriod)
    const name = `${period.name} Timetable`
    const { error: err } = await supabase.from('timetables').insert({
      name,
      academic_period_id: selectedPeriod,
      status: 'draft',
      day_monday: true, day_tuesday: true, day_wednesday: true, day_thursday: true,
      day_friday: false, day_saturday: false, day_sunday: false,
    })
    if (err) {
      if (err.code === '23505') setError('A timetable for this academic period already exists.')
      else setError(err.message)
    } else {
      setSelectedPeriod('')
      onCreated()
      onClose()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white shadow-xl p-6 space-y-4">
          <Dialog.Title className="text-base font-semibold text-gray-900">Create New Timetable</Dialog.Title>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label htmlFor="tt-period" className="block text-xs font-medium text-gray-600 mb-1">Academic Period</label>
            <select
              id="tt-period"
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              aria-label="Select academic period for timetable"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select Period —</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {selectedPeriod && (
            <p className="text-xs text-gray-500">
              Name: <strong>{periods.find(p => p.id === selectedPeriod)?.name} Timetable</strong>
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} aria-label="Cancel" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={saving} aria-label="Create timetable" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

// ─── Convert Timetable Modal ─────────────────────────────────────────────────

function ConvertTimetableModal({ open, sourceTimetable, onClose, onConverted }) {
  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [targetDuration, setTargetDuration] = useState('')
  const [step, setStep] = useState('config') // 'config' | 'conflicts' | 'done'
  const [conflictReport, setConflictReport] = useState([])
  const [convertedSlots, setConvertedSlots] = useState([])
  const [newTimetableId, setNewTimetableId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) { setStep('config'); setError(''); setSelectedPeriod(''); setTargetDuration(''); return }
    supabase
      .from('academic_periods')
      .select('id, name')
      .order('name')
      .then(({ data }) => setPeriods(data ?? []))
  }, [open])

  async function handlePreview() {
    if (!selectedPeriod || !targetDuration) { setError('Please select a period and target duration.'); return }
    setSaving(true)
    setError('')

    // Load source slots
    const { data: sourceSlots } = await supabase
      .from('slots')
      .select('*')
      .eq('timetable_id', sourceTimetable.id)

    if (!sourceSlots || sourceSlots.length === 0) {
      setError('No slots to convert.')
      setSaving(false)
      return
    }

    const target = parseInt(targetDuration, 10)
    const converted = []

    for (const slot of sourceSlots) {
      const sourceDuration = timeDiffMinutes(slot.start_time, slot.end_time)
      try {
        if (target < sourceDuration) {
          // Split
          const splits = splitSlot(slot, target)
          converted.push(...splits)
        } else if (target > sourceDuration) {
          // Merge: find consecutive slots with same assignment
          const sameAssignment = sourceSlots.filter(
            s => s.assignment_id === slot.assignment_id &&
                 s.day_of_week === slot.day_of_week &&
                 s.id !== slot.id
          )
          // Only merge if not already processed
          if (!converted.some(c => c._sourceId === slot.id)) {
            try {
              const toMerge = [slot, ...sameAssignment].sort((a, b) =>
                a.start_time.localeCompare(b.start_time)
              )
              const merged = mergeSlots(toMerge, target)
              converted.push({ ...merged, _sourceId: slot.id })
            } catch {
              converted.push({ ...slot, _sourceId: slot.id })
            }
          }
        } else {
          converted.push({ ...slot })
        }
      } catch (e) {
        converted.push({ ...slot }) // keep original on error
      }
    }

    // Run conflict detection
    const conflicts = []
    for (let i = 0; i < converted.length; i++) {
      const others = converted.filter((_, j) => j !== i)
      const slotConflicts = detectConflicts(converted[i], others)
      if (slotConflicts.length > 0) {
        conflicts.push({ slot: converted[i], conflicts: slotConflicts })
      }
    }

    setConvertedSlots(converted)
    setConflictReport(conflicts)
    setStep('conflicts')
    setSaving(false)
  }

  async function handleConfirm() {
    setSaving(true)
    setError('')

    const period = periods.find(p => p.id === selectedPeriod)
    const name = `${period.name} Timetable`

    // Create new timetable
    const { data: newTT, error: ttErr } = await supabase
      .from('timetables')
      .insert({
        name,
        academic_period_id: selectedPeriod,
        status: 'draft',
        day_monday: sourceTimetable.day_monday ?? true,
        day_tuesday: sourceTimetable.day_tuesday ?? true,
        day_wednesday: sourceTimetable.day_wednesday ?? true,
        day_thursday: sourceTimetable.day_thursday ?? true,
        day_friday: sourceTimetable.day_friday ?? false,
        day_saturday: sourceTimetable.day_saturday ?? false,
        day_sunday: sourceTimetable.day_sunday ?? false,
      })
      .select()
      .single()

    if (ttErr) { setError(ttErr.message); setSaving(false); return }

    // Insert converted slots
    const toInsert = convertedSlots.map(s => ({
      timetable_id: newTT.id,
      assignment_id: s.assignment_id ?? null,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      course_id: s.course_id,
      teacher_id: s.teacher_id,
      room_id: s.room_id,
      section_id: s.section_id,
    }))

    const { error: slotsErr } = await supabase.from('slots').insert(toInsert)
    if (slotsErr) {
      // Rollback timetable
      await supabase.from('timetables').delete().eq('id', newTT.id)
      setError(slotsErr.message)
      setSaving(false)
      return
    }

    setSaving(false)
    onConverted?.()
    onClose?.()
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white shadow-xl p-6 space-y-4 my-4">
          <Dialog.Title className="text-base font-semibold text-gray-900">
            Convert Timetable: {sourceTimetable?.name}
          </Dialog.Title>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {step === 'config' && (
            <>
              <div>
                <label htmlFor="conv-period" className="block text-xs font-medium text-gray-600 mb-1">
                  Target Academic Period
                </label>
                <select
                  id="conv-period"
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  aria-label="Select target academic period"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Select Period —</option>
                  {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="conv-duration" className="block text-xs font-medium text-gray-600 mb-1">
                  Target Slot Duration (minutes)
                </label>
                <select
                  id="conv-duration"
                  value={targetDuration}
                  onChange={e => setTargetDuration(e.target.value)}
                  aria-label="Select target slot duration"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Select Duration —</option>
                  {SUPPORTED_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} aria-label="Cancel conversion" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handlePreview} disabled={saving} aria-label="Preview conversion" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving ? 'Processing…' : 'Preview Conversion'}
                </button>
              </div>
            </>
          )}

          {step === 'conflicts' && (
            <>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm">
                <p className="font-medium text-gray-700">Conversion Summary</p>
                <p className="text-gray-600 mt-1">{convertedSlots.length} slot(s) will be created.</p>
                {conflictReport.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-red-600 font-medium">{conflictReport.length} conflict(s) detected:</p>
                    <ul className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                      {conflictReport.map((r, i) => (
                        <li key={i} className="text-xs text-red-600">
                          {r.slot.day_of_week} {r.slot.start_time}–{r.slot.end_time}: {r.conflicts.map(c => c.type).join(', ')} conflict
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-accent mt-1 font-medium">✓ No conflicts detected.</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} aria-label="Cancel conversion" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleConfirm} disabled={saving} aria-label="Confirm and save converted timetable" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Confirm & Save'}
                </button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TimetableManagementPage() {
  const navigate = useNavigate()
  const [timetables, setTimetables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [convertTarget, setConvertTarget] = useState(null)
  const [publishBlockModal, setPublishBlockModal] = useState(null) // { timetable, incompleteAssignments }

  async function fetchTimetables() {
    const { data, error: err } = await supabase
      .from('timetables')
      .select('id, name, status, academic_period:academic_periods(name)')
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setTimetables(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTimetables() }, [])

  async function handlePublish(tt) {
    setError('')

    // Fetch all course_section_assignments for this timetable
    const { data: assignments, error: aErr } = await supabase
      .from('course_section_assignments')
      .select('id, course:courses(name, code), section:sections(name)')
      .eq('timetable_id', tt.id)

    if (aErr) { setError(aErr.message); return }

    if (!assignments || assignments.length === 0) {
      // No assignments — allow publish (or block if desired; here we allow)
      const { error: err } = await supabase.from('timetables').update({ status: 'published' }).eq('id', tt.id)
      if (err) setError(err.message)
      else await fetchTimetables()
      return
    }

    // Count slots per assignment
    const { data: slots, error: sErr } = await supabase
      .from('slots')
      .select('assignment_id')
      .eq('timetable_id', tt.id)

    if (sErr) { setError(sErr.message); return }

    const slotCounts = {}
    for (const slot of slots ?? []) {
      if (slot.assignment_id) {
        slotCounts[slot.assignment_id] = (slotCounts[slot.assignment_id] ?? 0) + 1
      }
    }

    const incomplete = assignments.filter(a => (slotCounts[a.id] ?? 0) < 2)

    if (incomplete.length > 0) {
      setPublishBlockModal({ timetable: tt, incompleteAssignments: incomplete })
      return
    }

    const { error: err } = await supabase.from('timetables').update({ status: 'published' }).eq('id', tt.id)
    if (err) setError(err.message)
    else await fetchTimetables()
  }

  async function handleArchive() {
    const { error: err } = await supabase.from('timetables').update({ status: 'archived' }).eq('id', archiveTarget.id)
    if (err) setError(err.message)
    setArchiveTarget(null)
    await fetchTimetables()
  }

  async function handleDuplicate(tt) {
    setError('')
    // Duplicate: create a new draft timetable — user will need to select a new period
    // For now, navigate to create modal with pre-context
    setShowCreate(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Timetable Management</h1>
        <button
          onClick={() => setShowCreate(true)}
          aria-label="Create new timetable"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Create New Timetable
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : timetables.length === 0 ? (
        <EmptyState
          message="No timetables yet."
          action={
            <button onClick={() => setShowCreate(true)} aria-label="Create first timetable" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Create First Timetable
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Academic Period</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timetables.map(tt => (
                <tr key={tt.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{tt.name}</td>
                  <td className="px-4 py-3 text-gray-600">{tt.academic_period?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={tt.status}>{tt.status.charAt(0).toUpperCase() + tt.status.slice(1)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigate(`/admin/timetables/${tt.id}`)}
                        aria-label={`View timetable ${tt.name}`}
                        className="text-xs rounded px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setConvertTarget(tt)}
                        aria-label={`Convert timetable ${tt.name}`}
                        className="text-xs rounded px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium"
                      >
                        Convert
                      </button>
                      <button
                        onClick={() => handleDuplicate(tt)}
                        aria-label={`Duplicate timetable ${tt.name}`}
                        className="text-xs rounded px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
                      >
                        Duplicate
                      </button>
                      {tt.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(tt)}
                          aria-label={`Publish timetable ${tt.name}`}
                          className="text-xs rounded px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium"
                        >
                          Publish
                        </button>
                      )}
                      {tt.status !== 'archived' && (
                        <button
                          onClick={() => setArchiveTarget(tt)}
                          aria-label={`Archive timetable ${tt.name}`}
                          className="text-xs rounded px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateTimetableModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchTimetables}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive Timetable"
        message={`Archive "${archiveTarget?.name}"? This cannot be undone.`}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      {convertTarget && (
        <ConvertTimetableModal
          open={!!convertTarget}
          sourceTimetable={convertTarget}
          onClose={() => setConvertTarget(null)}
          onConverted={() => { setConvertTarget(null); fetchTimetables() }}
        />
      )}

      {/* Publish blocking modal — incomplete assignments */}
      <Dialog
        open={!!publishBlockModal}
        onClose={() => setPublishBlockModal(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white shadow-xl p-6 space-y-4">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              Cannot Publish — Incomplete Assignments
            </Dialog.Title>
            <p className="text-sm text-gray-600">
              The following course-section assignments do not have exactly 2 slots scheduled.
              Please complete them before publishing.
            </p>
            <ul className="max-h-60 overflow-y-auto divide-y divide-gray-100 rounded-md border border-gray-200">
              {publishBlockModal?.incompleteAssignments.map(a => (
                <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-gray-800 font-medium">
                    {a.course?.code ?? '—'} — {a.section?.name ?? '—'}
                  </span>
                  <span className="text-red-600 text-xs font-semibold">Incomplete</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <button
                onClick={() => setPublishBlockModal(null)}
                aria-label="Close publish error dialog"
                className="min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                OK, I'll fix it
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
