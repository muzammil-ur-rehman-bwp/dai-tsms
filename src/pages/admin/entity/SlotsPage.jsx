import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'

export default function SlotsPage() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('slots')
      .select('id, day_of_week, start_time, end_time, timetable:timetables(name), course:courses(name, code)')
      .order('day_of_week')
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setSlots(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Slots</h1>
      <p className="text-sm text-gray-500">
        Slots are managed from the Timetable Scheduling page. This view is read-only.
      </p>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : slots.length === 0 ? (
        <EmptyState message="No slots found. Create slots from the Timetable Scheduling page." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Timetable</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Course</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Day</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slots.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{s.timetable?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-900">{s.course?.name ?? '—'} <span className="text-gray-400 font-mono text-xs">({s.course?.code})</span></td>
                  <td className="px-4 py-3 capitalize text-gray-600">{s.day_of_week}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{s.start_time} – {s.end_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
