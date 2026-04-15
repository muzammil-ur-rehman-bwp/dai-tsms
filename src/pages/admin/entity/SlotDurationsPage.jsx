import { SUPPORTED_DURATIONS } from '../../../lib/constants'

export default function SlotDurationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Slot Durations</h1>
      <p className="text-sm text-gray-500">
        These are system-defined supported lecture durations. They cannot be modified.
      </p>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Duration (minutes)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {SUPPORTED_DURATIONS.map(d => (
              <tr key={d} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900 font-medium">{d} min</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                    System Defined
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
