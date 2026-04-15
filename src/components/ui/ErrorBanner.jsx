import { XMarkIcon } from '@heroicons/react/24/solid'

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
    >
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 text-red-500 hover:text-red-700"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
