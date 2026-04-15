/**
 * Red pulsing conflict indicator.
 * Props: conflicts (array of { type: 'teacher'|'room'|'section', conflictingSlot })
 */
export default function ConflictBadge({ conflicts = [] }) {
  if (!conflicts || conflicts.length === 0) return null

  const types = [...new Set(conflicts.map(c => c.type))]
  const label = types.join(', ')

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
      aria-label={`${conflicts.length} conflict(s): ${label}`}
      title={`Conflicts: ${label}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
      </span>
      {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
    </span>
  )
}
