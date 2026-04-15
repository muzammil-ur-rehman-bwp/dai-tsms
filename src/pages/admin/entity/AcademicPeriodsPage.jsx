import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import Badge from '../../../components/ui/Badge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'

export default function AcademicPeriodsPage() {
  const [periods, setPeriods] = useState([])
  const [years, setYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ academic_year_id: '', academic_semester_id: '' })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null) // { period, action }

  async function fetchAll() {
    setLoading(true)
    const [{ data: p }, { data: y }, { data: s }] = await Promise.all([
      supabase
        .from('academic_periods')
        .select('*, academic_year:academic_years(name), academic_semester:academic_semesters(name)')
        .order('created_at', { ascending: false }),
      supabase.from('academic_years').select('id, name').order('name'),
      supabase.from('academic_semesters').select('id, name'),
    ])
    setPeriods(p ?? [])
    setYears(y ?? [])
    setSemesters(s ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.academic_year_id || !form.academic_semester_id) {
      setError('Please select both an academic year and semester.')
      return
    }
    setSaving(true)
    setError('')
    const year = years.find(y => y.id === form.academic_year_id)
    const sem = semesters.find(s => s.id === form.academic_semester_id)
    const name = `${year.name} ${sem.name}`
    const { error: err } = await supabase
      .from('academic_periods')
      .insert({
        name,
        academic_year_id: form.academic_year_id,
        academic_semester_id: form.academic_semester_id,
        is_active: false,
      })
    if (err) {
      if (err.code === '23505') setError('This year + semester combination already exists.')
      else setError(err.message)
    } else {
      setForm({ academic_year_id: '', academic_semester_id: '' })
      await fetchAll()
    }
    setSaving(false)
  }

  async function toggleActive(period) {
    if (period.is_active) {
      // Deactivate
      setConfirm({ period, action: 'deactivate' })
    } else {
      // Activate — warn that current active will be deactivated
      const currentActive = periods.find(p => p.is_active)
      setConfirm({ period, action: 'activate', currentActive })
    }
  }

  async function handleConfirm() {
    const { period, action } = confirm
    setConfirm(null)
    setError('')
    if (action === 'activate') {
      // Deactivate all, then activate this one
      const { error: err1 } = await supabase
        .from('academic_periods')
        .update({ is_active: false })
        .neq('id', period.id)
      if (err1) { setError(err1.message); return }
      const { error: err2 } = await supabase
        .from('academic_periods')
        .update({ is_active: true })
        .eq('id', period.id)
      if (err2) setError(err2.message)
    } else {
      const { error: err } = await supabase
        .from('academic_periods')
        .update({ is_active: false })
        .eq('id', period.id)
      if (err) setError(err.message)
    }
    await fetchAll()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Academic Periods</h1>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-md">
        <h2 className="text-sm font-medium text-gray-700">Create Academic Period</h2>
        <div>
          <label htmlFor="ap-year" className="block text-xs font-medium text-gray-600 mb-1">Academic Year</label>
          <select
            id="ap-year"
            value={form.academic_year_id}
            onChange={e => setForm(f => ({ ...f, academic_year_id: e.target.value }))}
            aria-label="Select academic year"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— Select Year —</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="ap-sem" className="block text-xs font-medium text-gray-600 mb-1">Academic Semester</label>
          <select
            id="ap-sem"
            value={form.academic_semester_id}
            onChange={e => setForm(f => ({ ...f, academic_semester_id: e.target.value }))}
            aria-label="Select academic semester"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">— Select Semester —</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {form.academic_year_id && form.academic_semester_id && (
          <p className="text-xs text-gray-500">
            Preview: <strong>
              {years.find(y => y.id === form.academic_year_id)?.name}{' '}
              {semesters.find(s => s.id === form.academic_semester_id)?.name}
            </strong>
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          aria-label="Create academic period"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create Period'}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : periods.length === 0 ? (
        <EmptyState message="No academic periods found." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periods.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{p.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.is_active ? 'active' : 'inactive'}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      aria-label={p.is_active ? `Deactivate ${p.name}` : `Activate ${p.name}`}
                      className={`text-xs rounded px-2 py-1 font-medium ${
                        p.is_active
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'activate' ? 'Activate Period' : 'Deactivate Period'}
        message={
          confirm?.action === 'activate' && confirm?.currentActive
            ? `Activating "${confirm.period.name}" will deactivate the currently active period "${confirm.currentActive.name}". Continue?`
            : `Are you sure you want to ${confirm?.action} "${confirm?.period?.name}"?`
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
