import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import LoadingSkeleton from '../../../components/ui/LoadingSkeleton'
import EmptyState from '../../../components/ui/EmptyState'
import ErrorBanner from '../../../components/ui/ErrorBanner'
import ValidationError from '../../../components/ui/ValidationError'
import Badge from '../../../components/ui/Badge'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', designation: '', expertise: '', mobile_number: '', email: '', password: '' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  async function fetchTeachers() {
    const { data, error: err } = await supabase
      .from('teachers')
      .select('id, name, designation, email, is_active')
      .order('name')
    if (err) setError(err.message)
    else setTeachers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTeachers() }, [])

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.designation.trim()) errs.designation = 'Designation is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!form.password.trim()) errs.password = 'Initial password is required.'
    return errs
  }

  async function handleCreate(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true)
    setError('')

    // Create Supabase Auth user via admin API
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: form.email.trim(),
      password: form.password,
      email_confirm: true,
    })
    if (authErr) { setError(authErr.message); setSaving(false); return }

    const authUserId = authData.user.id

    // Insert profile
    await supabase.from('profiles').insert({
      id: authUserId,
      role: 'teacher',
      first_login_pending: true,
    })

    // Insert teacher record
    const { error: tErr } = await supabase.from('teachers').insert({
      auth_user_id: authUserId,
      name: form.name.trim(),
      designation: form.designation.trim(),
      expertise: form.expertise.trim(),
      mobile_number: form.mobile_number.trim(),
      email: form.email.trim(),
      is_active: true,
    })
    if (tErr) { setError(tErr.message); setSaving(false); return }

    setForm({ name: '', designation: '', expertise: '', mobile_number: '', email: '', password: '' })
    setFormErrors({})
    setShowForm(false)
    await fetchTeachers()
    setSaving(false)
  }

  async function handleDeactivate() {
    const { error: err } = await supabase
      .from('teachers')
      .update({ is_active: false })
      .eq('id', deactivateTarget.id)
    if (err) setError(err.message)
    setDeactivateTarget(null)
    await fetchTeachers()
  }

  const field = (id, label, key, type = 'text', placeholder = '') => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        aria-label={label}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <ValidationError message={formErrors[key]} />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Teachers</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          aria-label="Toggle add teacher form"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {showForm ? 'Cancel' : 'Add Teacher'}
        </button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-lg">
          <h2 className="text-sm font-medium text-gray-700">New Teacher</h2>
          <div className="grid grid-cols-2 gap-3">
            {field('t-name', 'Name', 'name', 'text', 'Full name')}
            {field('t-desig', 'Designation', 'designation', 'text', 'e.g. Lecturer')}
            {field('t-exp', 'Expertise', 'expertise', 'text', 'e.g. Machine Learning')}
            {field('t-mob', 'Mobile', 'mobile_number', 'text', '+92...')}
            {field('t-email', 'Email', 'email', 'email', 'teacher@iub.edu.pk')}
            {field('t-pass', 'Initial Password', 'password', 'password', '••••••••')}
          </div>
          <button type="submit" disabled={saving} aria-label="Save teacher" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Teacher'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : teachers.length === 0 ? (
        <EmptyState message="No teachers found." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Designation</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teachers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.designation}</td>
                  <td className="px-4 py-3 text-gray-600">{t.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.is_active ? 'active' : 'inactive'}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.is_active && (
                      <button
                        onClick={() => setDeactivateTarget(t)}
                        aria-label={`Deactivate teacher ${t.name}`}
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
        title="Deactivate Teacher"
        message={`Are you sure you want to deactivate "${deactivateTarget?.name}"?`}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  )
}
