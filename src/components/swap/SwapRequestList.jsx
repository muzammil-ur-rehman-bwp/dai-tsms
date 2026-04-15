import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import EmptyState from '../ui/EmptyState'

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function formatSlotDetail(slot) {
  if (!slot) return '—'
  const day = slot.day_of_week?.charAt(0).toUpperCase() + slot.day_of_week?.slice(1)
  return `${slot.course?.name ?? '?'} · ${day} ${slot.start_time}–${slot.end_time} · ${slot.section?.name ?? '?'}`
}

/**
 * Lists swap requests for the current teacher.
 * Props:
 *   teacherId - current teacher's UUID
 */
export default function SwapRequestList({ teacherId }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('swap_requests')
      .select(`
        id, status, admin_override, created_at,
        requesting_teacher:teachers!requesting_teacher_id(id, name),
        target_teacher:teachers!target_teacher_id(id, name),
        requesting_slot:slots!requesting_slot_id(
          id, day_of_week, start_time, end_time,
          course:courses(name), section:sections(name)
        ),
        target_slot:slots!target_slot_id(
          id, day_of_week, start_time, end_time,
          course:courses(name), section:sections(name)
        )
      `)
      .or(`requesting_teacher_id.eq.${teacherId},target_teacher_id.eq.${teacherId}`)
      .order('created_at', { ascending: false })

    if (err) setError(err.message)
    else setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [teacherId])

  async function handleApprove(id) {
    setActionLoading(id + '-approve')
    const { error: err } = await supabase.rpc('approve_swap_request', { swap_id: id })
    setActionLoading(null)
    if (err) { alert(err.message); return }
    load()
  }

  async function handleReject(id) {
    setActionLoading(id + '-reject')
    const { error: err } = await supabase
      .from('swap_requests')
      .update({ status: 'rejected' })
      .eq('id', id)
    setActionLoading(null)
    if (err) { alert(err.message); return }
    load()
  }

  if (loading) return <LoadingSkeleton rows={4} />
  if (error) return <p className="text-sm text-danger">{error}</p>
  if (requests.length === 0) return <EmptyState message="No swap requests found." />

  return (
    <div className="space-y-3">
      {requests.map(req => {
        const isIncoming = req.target_teacher?.id === teacherId && req.status === 'pending'
        return (
          <div
            key={req.id}
            className="bg-white rounded-lg border border-gray-200 p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">{req.requesting_teacher?.name ?? '—'}</span>
                  {' → '}
                  <span className="font-medium">{req.target_teacher?.name ?? '—'}</span>
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">From:</span> {formatSlotDetail(req.requesting_slot)}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">To:</span> {formatSlotDetail(req.target_slot)}
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>

            {isIncoming && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={actionLoading === req.id + '-approve'}
                  aria-label="Approve swap request"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-md hover:bg-accent-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === req.id + '-approve' ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={actionLoading === req.id + '-reject'}
                  aria-label="Reject swap request"
                  className="px-3 py-1.5 text-xs font-medium text-white bg-danger rounded-md hover:bg-danger-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === req.id + '-reject' ? 'Rejecting…' : 'Reject'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
