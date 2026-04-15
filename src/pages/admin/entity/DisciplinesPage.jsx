import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import ValidationError from '../../../components/ui/ValidationError'
import Badge from '../../../components/ui/Badge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'

const emptyForm = { name: '', short_name: '' }

export default function DisciplinesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  async function fetch() {
    const { data, error: err } = await supabase.from('disciplines').select('*').order('sort_order')
    if (err) setError(err.message)
    else setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

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
    const payload = { name: form.name.trim(), short_name: form.short_name.trim() }
    const { error: err } = editTarget
      ? await supabase.from('disciplines').update(payload).eq('id', editTarget.id)
      : await supabase.from('disciplines').insert({ ...payload, sort_order: items.length + 1, is_active: true })
    if (err) setError(err.message)
    else { setShowForm(false); await fetch() }
    setSaving(false)
  }

  async function handleDeactivate() {
    const { error: err } = await supabase.from('disciplines').update({ is_active: false }).eq('id', deactivateTarget.id)
    if (err) setError(err.message)
    setDeactivateTarget(null)
    await fetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Disciplines</h1>
        <button onClick={() => { setEditTarget(null); setForm(emptyForm); setFormErrors({}); setShowForm(v => !v) }} aria-label="Toggle add discipline form" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          {showForm ? 'Cancel' : 'Add Discipline'}
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-md">
          <h2 className="text-sm font-medium text-gray-700">{editTarget ? 'Edit Discipline' : 'New Discipline'}</h2>
          <div>
            <label htmlFor="d-name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input id="d-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} aria-label="Discipline name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <ValidationError message={formErrors.name} />
          </div>
          <div>
            <label htmlFor="d-short" className="block text-xs font-medium text-gray-600 mb-1">Short Name</label>
            <input id="d-short" type="text" value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))} aria-label="Discipline short name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <ValidationError message={formErrors.short_name} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} aria-label="Save discipline" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Cancel" className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <LoadingSkeleton rows={4} /> : items.length === 0 ? <EmptyState message="No disciplines found." /> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Short Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.short_name}</td>
                  <td className="px-4 py-3"><Badge variant={item.is_active ? 'active' : 'inactive'}>{item.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => { setEditTarget(item); setForm({ name: item.name, short_name: item.short_name }); setFormErrors({}); setShowForm(true) }} aria-label={`Edit ${item.name}`} className="text-xs rounded px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium">Edit</button>
                    {item.is_active && <button onClick={() => setDeactivateTarget(item)} aria-label={`Deactivate ${item.name}`} className="text-xs rounded px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium">Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!deactivateTarget} title="Deactivate Discipline" message={`Deactivate "${deactivateTarget?.name}"?`} onConfirm={handleDeactivate} onCancel={() => setDeactivateTarget(null)} />
    </div>
  )
}
