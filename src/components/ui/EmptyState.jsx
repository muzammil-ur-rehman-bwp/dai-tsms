import { InboxIcon } from '@heroicons/react/24/outline'

export default function EmptyState({ message = 'No records found.', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <InboxIcon className="h-10 w-10 text-gray-400 mb-3" aria-hidden="true" />
      <p className="text-sm text-gray-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
