import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import ValidationError from '../../../components/ui/ValidationError'
import Badge from '../../../components/ui/Badge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import CSVUploader from '../../../components/csv/CSVUploader'
import CSVSummaryReport from '../../../components/csv/CSVSummaryReport'

const emptyForm = { name: '', capacity: '' }

function validateRoomForm(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Name is required.'
  const cap = Number(form.capacity)
  if (!form.capacity || isNaN(cap) || cap <= 0 || !Number.isInteger(cap)) {
    errs.capacity = 'Capacity must be a positive integer.'
  }
  return errs
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [csvReport, setCsvReport] = useState(null)

  async function fetchRooms() {
    const { data, error: err } = await supabase
      .from('rooms')
      .select('id, name, capacity, is_active')
      .order('name')
    if (err) setError(err.message)
    else setRooms(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchRooms() }, [])

  function openCreate() { setEditTarget(null); setForm(emptyForm); setFormErrors({}); setShowForm(true) }
  function openEdit(r) { setEditTarget(r); setForm({ name: r.name, capacity: String(r.capacity) }); setFormErrors({}); setShowForm(true) }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validateRoomForm(form)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    setError('')
    const payload = { name: form.name.trim(), capacity: Number(form.capacity) }
    const { error: err } = editTarget
      ? await supabase.from('rooms').update(payload).eq('id', editTarget.id)
      : await supabase.from('rooms').insert({ ...payload, is_active: true })
    if (err) {
      if (err.code === '23505') setError('A room with this name already exists.')
      else setError(err.message)
    } else {
      setShowForm(false)
      await fetchRooms()
    }
    setSaving(false)
  }

  async function handleDeactivate() {
    const { error: err } = await supabase.from('rooms').update({ is_active: false }).eq('id', deactivateTarget.id)
    if (err) setError(err.message)
    setDeactivateTarget(null)
    await fetchRooms()
  }

  async function handleCSV(rows) {
    const results = { success: 0, errors: [] }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const f = { name: (row.name ?? '').trim(), capacity: row.capacity }
      const errs = validateRoomForm({ name: f.name, capacity: String(f.capacity) })
      if (Object.keys(errs).length) {
        results.errors.push({ row: i + 2, message: Object.values(errs).join(' ') })
        continue
      }
      const { error: err } = await supabase.from('rooms').insert({ name: f.name, capacity: Number(f.capacity), is_active: true })
      if (err) {
        if (err.code === '23505') results.errors.push({ row: i + 2, message: `Duplicate room name: ${f.name}` })
        else results.errors.push({ row: i + 2, message: err.message })
      } else results.success++
    }
    setCsvReport(results)
    await fetchRooms()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-gray-900">Rooms</h1>
        <div className="flex gap-2">
          <CSVUploader onParsed={handleCSV} label="Bulk Upload CSV" />
          <button onClick={openCreate} aria-label="Add room" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Add Room
          </button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-sm">
          <h2 className="text-sm font-medium text-gray-700">{editTarget ? 'Edit Room' : 'New Room'}</h2>
          <div>
            <label htmlFor="r-name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input id="r-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-label="Room name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <ValidationError message={formErrors.name} />
          </div>
          <div>
            <label htmlFor="r-cap" className="block text-xs font-medium text-gray-600 mb-1">Capacity</label>
            <input id="r-cap" type="number" min="1" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} aria-label="Room capacity" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <ValidationError message={formErrors.capacity} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} aria-label="Save room" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Cancel" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : rooms.length === 0 ? (
        <EmptyState message="No rooms found." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Capacity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rooms.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.capacity}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.is_active ? 'active' : 'inactive'}>{r.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(r)} aria-label={`Edit room ${r.name}`} className="text-xs rounded px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">Edit</button>
                    {r.is_active && (
                      <button onClick={() => setDeactivateTarget(r)} aria-label={`Deactivate room ${r.name}`} className="text-xs rounded px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium">Deactivate</button>
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
        title="Deactivate Room"
        message={`Deactivate room "${deactivateTarget?.name}"?`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />

      {csvReport && (
        <CSVSummaryReport success={csvReport.success} errors={csvReport.errors} onClose={() => setCsvReport(null)} />
      )}
    </div>
  )
}
