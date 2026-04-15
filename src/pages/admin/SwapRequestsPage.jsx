import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'

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

export default function SwapRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    setLoading(true)
    setError(null)
    const query = supabase
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
      .order('created_at', { ascending: false })

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setRequests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleApprove(id) {
    setActionLoading(id + '-approve')
    const { error: err } = await supabase.rpc('approve_swap_request', { swap_id: id })
    setActionLoading(null)
    if (err) { alert(err.message); return }
    load()
  }

  async function handleCancel(id) {
    setActionLoading(id + '-cancel')
    const { error: err } = await supabase
      .from('swap_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
    setActionLoading(null)
    if (err) { alert(err.message); return }
    load()
  }

  const filtered = statusFilter === 'all'
    ? requests
    : requests.filter(r => r.status === statusFilter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Swap Requests</h1>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter swap requests by status"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No swap requests found." />
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div
              key={req.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 text-sm flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {req.requesting_teacher?.name ?? '—'}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium text-gray-900">
                      {req.target_teacher?.name ?? '—'}
                    </span>
                    {req.admin_override && (
                      <span className="text-xs text-secondary font-medium">(admin override)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Requesting slot:</span> {formatSlotDetail(req.requesting_slot)}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Target slot:</span> {formatSlotDetail(req.target_slot)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id + '-approve'}
                    aria-label={`Approve swap request from ${req.requesting_teacher?.name}`}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-md hover:bg-accent-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === req.id + '-approve' ? 'Approving…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={actionLoading === req.id + '-cancel'}
                    aria-label={`Cancel swap request from ${req.requesting_teacher?.name}`}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-danger rounded-md hover:bg-danger-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === req.id + '-cancel' ? 'Cancelling…' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
