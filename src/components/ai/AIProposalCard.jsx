import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

/**
 * Displays proposed slot(s) with course, section, teacher, room, day/time.
 * Approve and Reject buttons.
 *
 * Props:
 *   proposals  - array of { course, section, teacher, room, day, startTime, endTime, hasConflict }
 *   onApprove  - () => void
 *   onReject   - () => void
 */
export default function AIProposalCard({ proposals = [], onApprove, onReject }) {
  if (!proposals || proposals.length === 0) return null

  const hasConflicts = proposals.some(p => p.hasConflict)

  return (
    <div className="rounded-lg border border-secondary-500 bg-purple-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-secondary-600 uppercase tracking-wide">
        AI Proposal
      </p>

      {proposals.map((p, i) => (
        <div key={i} className="rounded-md bg-white border border-gray-200 p-2.5 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{p.course ?? '—'}</span>
            {p.hasConflict && (
              <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                </span>
                Conflict
              </span>
            )}
          </div>
          <p className="text-gray-600">Section: {p.section ?? '—'}</p>
          <p className="text-gray-600">Teacher: {p.teacher ?? '—'}</p>
          <p className="text-gray-600">Room: {p.room ?? '—'}</p>
          <p className="text-gray-600 font-medium">
            {p.day ? p.day.charAt(0).toUpperCase() + p.day.slice(1) : '—'} · {p.startTime ?? '—'} – {p.endTime ?? '—'}
          </p>
        </div>
      ))}

      {hasConflicts && (
        <p className="text-xs text-red-600 font-medium">
          ⚠ One or more proposals have conflicts. Approving may create scheduling issues.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onApprove}
          aria-label="Approve AI proposal"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-700"
        >
          <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Approve
        </button>
        <button
          onClick={onReject}
          aria-label="Reject AI proposal"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300"
        >
          <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Reject
        </button>
      </div>
    </div>
  )
}
