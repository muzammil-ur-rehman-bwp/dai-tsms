import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { derivePerSlotDuration } from '../../../lib/utils'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import ValidationError from '../../../components/ui/ValidationError'
import Badge from '../../../components/ui/Badge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import CSVUploader from '../../../components/csv/CSVUploader'
import CSVSummaryReport from '../../../components/csv/CSVSummaryReport'

function validateCourseForm(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Name is required.'
  if (!form.code.trim()) errs.code = 'Code is required.'
  const ch = Number(form.credit_hours)
  if (!form.credit_hours || isNaN(ch) || ch <= 0) errs.credit_hours = 'Credit hours must be a positive number.'
  const chm = Number(form.contact_hours_minutes)
  if (!form.contact_hours_minutes || isNaN(chm) || chm <= 0) {
    errs.contact_hours_minutes = 'Contact hours (minutes) must be a positive number.'
  } else if (chm % 15 !== 0) {
    errs.contact_hours_minutes = 'Must be a multiple of 15.'
  } else {
    try { derivePerSlotDuration(chm) } catch {
      errs.contact_hours_minutes = 'Derived per-slot duration must be one of {30, 45, 60, 75, 90}.'
    }
  }
  return errs
}

const emptyForm = { name: '', code: '', credit_hours: '', contact_hours_minutes: '' }

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [csvReport, setCsvReport] = useState(null)

  async function fetchCourses() {
    const { data, error: err } = await supabase
      .from('courses')
      .select('id, name, code, credit_hours, contact_hours_minutes, is_active')
      .order('name')
    if (err) setError(err.message)
    else setCourses(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchCourses() }, [])

  function openCreate() { setEditTarget(null); setForm(emptyForm); setFormErrors({}); setShowForm(true) }
  function openEdit(c) { setEditTarget(c); setForm({ name: c.name, code: c.code, credit_hours: String(c.credit_hours), contact_hours_minutes: String(c.contact_hours_minutes) }); setFormErrors({}); setShowForm(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validateCourseForm(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      credit_hours: Number(form.credit_hours),
      contact_hours_minutes: Number(form.contact_hours_minutes),
    }
    const { error: err } = editTarget
      ? await supabase.from('courses').update(payload).eq('id', editTarget.id)
      : await supabase.from('courses').insert({ ...payload, is_active: true })
    if (err) {
      if (err.code === '23505') setError('A course with this code already exists.')
      else setError(err.message)
    } else {
      setShowForm(false)
      await fetchCourses()
    }
    setSaving(false)
  }

  async function handleDeactivate() {
    const { error: err } = await supabase.from('courses').update({ is_active: false }).eq('id', deactivateTarget.id)
    if (err) setError(err.message)
    setDeactivateTarget(null)
    await fetchCourses()
  }

  async function handleCSV(rows) {
    const results = { success: 0, errors: [] }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const f = {
        name: (row.name ?? '').trim(),
        code: (row.course_code ?? '').trim(),
        credit_hours: row.credit_hours,
        contact_hours_minutes: row.contact_hours_minutes,
      }
      const errs = validateCourseForm({ ...f, credit_hours: String(f.credit_hours), contact_hours_minutes: String(f.contact_hours_minutes) })
      if (Object.keys(errs).length) {
        results.errors.push({ row: i + 2, message: Object.values(errs).join(' ') })
        continue
      }
      const { error: err } = await supabase.from('courses').insert({
        name: f.name, code: f.code,
        credit_hours: Number(f.credit_hours),
        contact_hours_minutes: Number(f.contact_hours_minutes),
        is_active: true,
      })
      if (err) {
        if (err.code === '23505') results.errors.push({ row: i + 2, message: `Duplicate course code: ${f.code}` })
        else results.errors.push({ row: i + 2, message: err.message })
      } else results.success++
    }
    setCsvReport(results)
    await fetchCourses()
  }

  // Live derived duration preview
  const chm = Number(form.contact_hours_minutes)
  let derivedPreview = null
  if (chm > 0 && chm % 15 === 0) {
    try { derivedPreview = derivePerSlotDuration(chm) } catch { /* invalid */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-gray-900">Courses</h1>
        <div className="flex gap-2">
          <CSVUploader onParsed={handleCSV} label="Bulk Upload CSV" />
          <button onClick={openCreate} aria-label="Add course" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Add Course
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-lg">
          <h2 className="text-sm font-medium text-gray-700">{editTarget ? 'Edit Course' : 'New Course'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="c-name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input id="c-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-label="Course name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <ValidationError message={formErrors.name} />
            </div>
            <div>
              <label htmlFor="c-code" className="block text-xs font-medium text-gray-600 mb-1">Code</label>
              <input id="c-code" type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} aria-label="Course code" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <ValidationError message={formErrors.code} />
            </div>
            <div>
              <label htmlFor="c-ch" className="block text-xs font-medium text-gray-600 mb-1">Credit Hours</label>
              <input id="c-ch" type="number" min="1" value={form.credit_hours} onChange={e => setForm(f => ({ ...f, credit_hours: e.target.value }))} aria-label="Credit hours" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <ValidationError message={formErrors.credit_hours} />
            </div>
            <div className="col-span-2">
              <label htmlFor="c-chm" className="block text-xs font-medium text-gray-600 mb-1">Contact Hours (minutes/week)</label>
              <input id="c-chm" type="number" min="15" step="15" value={form.contact_hours_minutes} onChange={e => setForm(f => ({ ...f, contact_hours_minutes: e.target.value }))} aria-label="Contact hours in minutes" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <ValidationError message={formErrors.contact_hours_minutes} />
              {derivedPreview && (
                <p className="mt-1 text-xs text-emerald-600">
                  → {derivedPreview} min/slot · 2 slots/week
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} aria-label="Save course" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Cancel" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : courses.length === 0 ? (
        <EmptyState message="No courses found." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contact (min)</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Per-Slot</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map(c => {
                let perSlot = '—'
                try { perSlot = `${derivePerSlotDuration(c.contact_hours_minutes)} min` } catch { /* */ }
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{c.code}</td>
                    <td className="px-4 py-3 text-gray-600">{c.credit_hours}</td>
                    <td className="px-4 py-3 text-gray-600">{c.contact_hours_minutes}</td>
                    <td className="px-4 py-3 text-gray-600">{perSlot}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.is_active ? 'active' : 'inactive'}>{c.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(c)} aria-label={`Edit course ${c.name}`} className="text-xs rounded px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">Edit</button>
                      {c.is_active && (
                        <button onClick={() => setDeactivateTarget(c)} aria-label={`Deactivate course ${c.name}`} className="text-xs rounded px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium">Deactivate</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate Course"
        message={`Deactivate "${deactivateTarget?.name}"?`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      {csvReport && (
        <CSVSummaryReport success={csvReport.success} errors={csvReport.errors} onClose={() => setCsvReport(null)} />
      )}
    </div>
  )
}
