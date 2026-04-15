import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { sortSections, generateSectionName } from '../../../lib/utils'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import Badge from '../../../components/ui/Badge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import CSVUploader from '../../../components/csv/CSVUploader'
import CSVSummaryReport from '../../../components/csv/CSVSummaryReport'

export default function SectionsPage() {
  const [sections, setSections] = useState([])
  const [disciplines, setDisciplines] = useState([])
  const [semesterNumbers, setSemesterNumbers] = useState([])
  const [sectionNumbers, setSectionNumbers] = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ discipline_id: '', semester_number_id: '', section_number_id: '', program_id: '' })
  const [saving, setSaving] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [csvReport, setCsvReport] = useState(null)

  async function fetchSections() {
    const { data, error: err } = await supabase
      .from('sections')
      .select(`
        id, name, is_active,
        discipline:disciplines(id, short_name, sort_order),
        semester_number:semester_numbers(id, name),
        section_number:section_numbers(id, name),
        program:programs(id, short_code, sort_order)
      `)
    if (err) { setError(err.message); return [] }
    return sortSections(data ?? [])
  }

  async function fetchLookups() {
    const [{ data: d }, { data: sn }, { data: secn }, { data: p }] = await Promise.all([
      supabase.from('disciplines').select('id, name, short_name, sort_order').eq('is_active', true).order('sort_order'),
      supabase.from('semester_numbers').select('id, name, number').order('number'),
      supabase.from('section_numbers').select('id, name, number').order('number'),
      supabase.from('programs').select('id, name, short_code, sort_order').eq('is_active', true).order('sort_order'),
    ])
    setDisciplines(d ?? [])
    setSemesterNumbers(sn ?? [])
    setSectionNumbers(secn ?? [])
    setPrograms(p ?? [])
  }

  useEffect(() => {
    Promise.all([fetchSections(), fetchLookups()]).then(([sorted]) => {
      setSections(sorted)
      setLoading(false)
    })
  }, [])

  async function reload() {
    const sorted = await fetchSections()
    setSections(sorted)
  }

  // Preview name
  const previewName = (() => {
    const d = disciplines.find(x => x.id === form.discipline_id)
    const sn = semesterNumbers.find(x => x.id === form.semester_number_id)
    const secn = sectionNumbers.find(x => x.id === form.section_number_id)
    const p = programs.find(x => x.id === form.program_id)
    if (d && sn && secn && p) return generateSectionName(d.short_name, sn.name, secn.name, p.short_code)
    return null
  })()

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.discipline_id || !form.semester_number_id || !form.section_number_id || !form.program_id) {
      setError('All four fields are required.')
      return
    }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('sections').insert({
      discipline_id: form.discipline_id,
      semester_number_id: form.semester_number_id,
      section_number_id: form.section_number_id,
      program_id: form.program_id,
    })
    if (err) {
      if (err.code === '23505') setError('A section with this combination already exists.')
      else setError(err.message)
    } else {
      setForm({ discipline_id: '', semester_number_id: '', section_number_id: '', program_id: '' })
      await reload()
    }
    setSaving(false)
  }

  async function handleDeactivate() {
    const { error: err } = await supabase
      .from('sections')
      .update({ is_active: false })
      .eq('id', deactivateTarget.id)
    if (err) setError(err.message)
    setDeactivateTarget(null)
    await reload()
  }

  async function handleCSV(rows) {
    const results = { success: 0, errors: [] }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const d = disciplines.find(x => x.short_name === row.discipline_short_name)
      const sn = semesterNumbers.find(x => x.name === row.semester_number_name)
      const secn = sectionNumbers.find(x => x.name === row.section_number_name)
      const p = programs.find(x => x.short_code === row.program_short_code)
      if (!d || !sn || !secn || !p) {
        results.errors.push({ row: i + 2, message: 'Could not resolve one or more lookup values.' })
        continue
      }
      const { error: err } = await supabase.from('sections').insert({
        discipline_id: d.id,
        semester_number_id: sn.id,
        section_number_id: secn.id,
        program_id: p.id,
      })
      if (err) {
        if (err.code === '23505') results.errors.push({ row: i + 2, message: 'Duplicate section.' })
        else results.errors.push({ row: i + 2, message: err.message })
      } else {
        results.success++
      }
    }
    setCsvReport(results)
    await reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Sections</h1>
        <CSVUploader onParsed={handleCSV} label="Bulk Upload CSV" />
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-lg">
        <h2 className="text-sm font-medium text-gray-700">Create Section</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sec-disc" className="block text-xs font-medium text-gray-600 mb-1">Discipline</label>
            <select id="sec-disc" value={form.discipline_id} onChange={e => setForm(f => ({ ...f, discipline_id: e.target.value }))} aria-label="Select discipline" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Select —</option>
              {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sec-semnum" className="block text-xs font-medium text-gray-600 mb-1">Semester Number</label>
            <select id="sec-semnum" value={form.semester_number_id} onChange={e => setForm(f => ({ ...f, semester_number_id: e.target.value }))} aria-label="Select semester number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Select —</option>
              {semesterNumbers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sec-secnum" className="block text-xs font-medium text-gray-600 mb-1">Section Number</label>
            <select id="sec-secnum" value={form.section_number_id} onChange={e => setForm(f => ({ ...f, section_number_id: e.target.value }))} aria-label="Select section number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Select —</option>
              {sectionNumbers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sec-prog" className="block text-xs font-medium text-gray-600 mb-1">Program</label>
            <select id="sec-prog" value={form.program_id} onChange={e => setForm(f => ({ ...f, program_id: e.target.value }))} aria-label="Select program" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— Select —</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        {previewName && (
          <p className="text-xs text-gray-500">Preview: <strong>{previewName}</strong></p>
        )}
        <button type="submit" disabled={saving} aria-label="Create section" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
          {saving ? 'Creating…' : 'Create Section'}
        </button>
      </form>

      {/* List */}
      {loading ? (
        <LoadingSkeleton rows={8} />
      ) : sections.length === 0 ? (
        <EmptyState message="No sections found." />
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
              {sections.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.is_active ? 'active' : 'inactive'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active && (
                      <button
                        onClick={() => setDeactivateTarget(s)}
                        aria-label={`Deactivate section ${s.name}`}
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
        title="Deactivate Section"
        message={`Are you sure you want to deactivate section "${deactivateTarget?.name}"?`}
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
