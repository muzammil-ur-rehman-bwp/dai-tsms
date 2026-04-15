import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import Badge from '../../../components/ui/Badge'

export default function AcademicSemestersPage() {
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('academic_semesters')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setSemesters(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Academic Semesters</h1>
      <p className="text-sm text-gray-500">
        These are system-defined values and cannot be created, edited, or deleted.
      </p>

      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : semesters.length === 0 ? (
        <EmptyState message="No academic semesters found." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Short Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Short Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {semesters.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.short_name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.short_code}</td>
                  <td className="px-4 py-3">
                    <Badge variant="system">System Defined</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
