import { Dialog } from '@headlessui/react'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function CSVSummaryReport({ success, errors, onClose }) {
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white shadow-xl">
          <div className="p-6 border-b border-gray-200">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              CSV Upload Summary
            </Dialog.Title>
          </div>

          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {/* Success count */}
            <div className="flex items-center gap-3 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span className="text-sm text-emerald-700">
                <strong>{success}</strong> row{success !== 1 ? 's' : ''} imported successfully.
              </span>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
                  {errors.length} row{errors.length !== 1 ? 's' : ''} skipped
                </div>
                <div className="rounded-md border border-red-200 divide-y divide-red-100 overflow-hidden">
                  {errors.map((e, i) => (
                    <div key={i} className="px-4 py-2 text-xs text-red-700 bg-red-50">
                      <span className="font-medium">Row {e.row}:</span> {e.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              aria-label="Close CSV summary"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
