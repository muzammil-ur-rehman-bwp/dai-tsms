import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { sortStudents, validateStudentRegNo } from '../../../lib/utils'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import Badge from '../../../components/ui/Badge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import CSVUploader from '../../../components/csv/CSVUploader'
import CSVSummaryReport from '../../../components/csv/CSVSummaryReport'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [csvReport, setCsvReport] = useState(null)

  async function fetchStudents() {
    const { data, error: err } = await supabase
      .from('students')
      .select('id, registration_no, is_active, section:sections(name)')
    if (err) { setError(err.message); return }
    setStudents(sortStudents(data ?? []))
    setLoading(false)
  }

  useEffect(() => { fetchStudents() }, [])

  async function handleDeactivate() {
    const { error: err } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', deactivateTarget.id)
    if (err) setError(err.message)
    setDeactivateTarget(null)
    await fetchStudents()
  }

  async function handleCSV(rows) {
    const results = { success: 0, errors: [] }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const regNo = (row.registration_no ?? '').trim()
      const sectionName = (row.section_name ?? '').trim()

      if (!regNo || !sectionName) {
        results.errors.push({ row: i + 2, message: 'Missing registration_no or section_name.' })
        continue
      }
      if (!validateStudentRegNo(regNo)) {
        results.errors.push({ row: i + 2, message: `Invalid registration number format: ${regNo}` })
        continue
      }

      // Resolve section
      const { data: secData } = await supabase
        .from('sections')
        .select('id')
        .eq('name', sectionName)
        .single()
      if (!secData) {
        results.errors.push({ row: i + 2, message: `Section not found: ${sectionName}` })
        continue
      }

      const { error: err } = await supabase.from('students').insert({
        registration_no: regNo,
        section_id: secData.id,
        is_active: true,
      })
      if (err) {
        if (err.code === '23505') results.errors.push({ row: i + 2, message: `Duplicate registration number: ${regNo}` })
        else results.errors.push({ row: i + 2, message: err.message })
      } else {
        results.success++
      }
    }
    setCsvReport(results)
    await fetchStudents()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Students</h1>
        <CSVUploader onParsed={handleCSV} label="Upload Students CSV" />
      </div>

      <p className="text-xs text-gray-500">
        CSV columns: <code>registration_no</code>, <code>section_name</code>
      </p>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : students.length === 0 ? (
        <EmptyState message="No students found. Upload a CSV to add students." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Registration No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Section</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-900">{s.registration_no}</td>
                  <td className="px-4 py-3 text-gray-600">{s.section?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.is_active ? 'active' : 'inactive'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active && (
                      <button
                        onClick={() => setDeactivateTarget(s)}
                        aria-label={`Deactivate student ${s.registration_no}`}
                        className="text-xs rounded px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate Student"
        message={`Are you sure you want to deactivate student "${deactivateTarget?.registration_no}"?`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      {csvReport && (
        <CSVSummaryReport
          success={csvReport.success}
          errors={csvReport.errors}
          onClose={() => setCsvReport(null)}
        />
      )}
    </div>
  )
}
