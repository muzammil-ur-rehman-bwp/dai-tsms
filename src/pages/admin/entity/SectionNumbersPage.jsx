import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import ValidationError from '../../../components/ui/ValidationError'

export default function SectionNumbersPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', number: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function fetch() {
    const { data, error: err } = await supabase.from('section_numbers').select('*').order('number')
    if (err) setError(err.message)
    else setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required (e.g. K).'
    const n = Number(form.number)
    if (!form.number || isNaN(n) || n <= 0 || !Number.isInteger(n)) errs.number = 'Number must be a positive integer.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('section_numbers').insert({ name: form.name.trim(), number: Number(form.number) })
    if (err) setError(err.message)
    else { setForm({ name: '', number: '' }); setFormErrors({}); await fetch() }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Section Numbers</h1>
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-sm">
        <h2 className="text-sm font-medium text-gray-700">Add Section Number</h2>
        <div>
          <label htmlFor="secn-name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input id="secn-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. K" aria-label="Section number name" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <ValidationError message={formErrors.name} />
        </div>
        <div>
          <label htmlFor="secn-num" className="block text-xs font-medium text-gray-600 mb-1">Number</label>
          <input id="secn-num" type="number" min="1" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} placeholder="11" aria-label="Section number value" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <ValidationError message={formErrors.number} />
        </div>
        <button type="submit" disabled={saving} aria-label="Add section number" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">{saving ? 'Adding…' : 'Add'}</button>
      </form>

      {loading ? <LoadingSkeleton rows={10} /> : items.length === 0 ? <EmptyState message="No section numbers found." /> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
