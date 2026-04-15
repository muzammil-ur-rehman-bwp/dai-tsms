import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import ValidationError from '../../../components/ui/ValidationError'

export default function AcademicYearsPage() {
  const [years, setYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', short_name: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function fetchYears() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('academic_years')
      .select('*')
      .order('name', { ascending: true })
    if (err) setError(err.message)
    else setYears(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchYears() }, [])

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.short_name.trim()) errs.short_name = 'Short name is required.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('academic_years')
      .insert({ name: form.name.trim(), short_name: form.short_name.trim() })
    if (err) {
      setError(err.message)
    } else {
      setForm({ name: '', short_name: '' })
      setFormErrors({})
      await fetchYears()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Academic Years</h1>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Add form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-md">
        <h2 className="text-sm font-medium text-gray-700">Add Academic Year</h2>
        <div>
          <label htmlFor="ay-name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input
            id="ay-name"
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. 2031"
            aria-label="Academic year name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <ValidationError message={formErrors.name} />
        </div>
        <div>
          <label htmlFor="ay-short" className="block text-xs font-medium text-gray-600 mb-1">Short Name</label>
          <input
            id="ay-short"
            type="text"
            value={form.short_name}
            onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))}
            placeholder="e.g. 31"
            aria-label="Academic year short name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <ValidationError message={formErrors.short_name} />
        </div>
        <button
          type="submit"
          disabled={saving}
          aria-label="Add academic year"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add Year'}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : years.length === 0 ? (
        <EmptyState message="No academic years found." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Short Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {years.map(y => (
                <tr key={y.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{y.name}</td>
                  <td className="px-4 py-3 text-gray-600">{y.short_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
