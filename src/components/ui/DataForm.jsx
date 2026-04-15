import { useState, useEffect } from 'react'
import ErrorBanner from './ErrorBanner'
import ValidationError from './ValidationError'

/**
 * Reusable form component for Add/Edit operations
 * 
 * @param {string} title - Form title
 * @param {Array} fields - Field definitions: { name, label, type, required, pattern, help }
 * @param {Object} initialData - Initial form data (for edit mode)
 * @param {Function} onSubmit - Submit handler
 * @param {Function} onCancel - Cancel handler
 * @param {boolean} loading - Loading state
 */
export default function DataForm({
  title,
  fields,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
}) {
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    setFormData(initialData)
    setErrors({})
    setSubmitError(null)
  }, [initialData])

  function validateForm() {
    const newErrors = {}

    fields.forEach(field => {
      const value = formData[field.name]

      // Check required
      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} is required`
      }

      // Check pattern
      if (value && field.pattern && !field.pattern.test(value)) {
        newErrors[field.name] = `${field.label} format is invalid`
      }

      // Check type
      if (value && field.type === 'number' && isNaN(value)) {
        newErrors[field.name] = `${field.label} must be a number`
      }

      // Check email
      if (value && field.type === 'email' && !isValidEmail(value)) {
        newErrors[field.name] = `${field.label} must be a valid email`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <ErrorBanner
              message={submitError}
              onDismiss={() => setSubmitError(null)}
            />
          )}

          {fields.map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-label={field.label}
                  aria-invalid={!!errors[field.name]}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-label={field.label}
                  aria-invalid={!!errors[field.name]}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id={field.name}
                    type="checkbox"
                    name={field.name}
                    checked={formData[field.name] || false}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    aria-label={field.label}
                  />
                  <span className="text-sm text-gray-600">{field.label}</span>
                </label>
              ) : (
                <input
                  id={field.name}
                  type={field.type || 'text'}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors[field.name] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  aria-label={field.label}
                  aria-invalid={!!errors[field.name]}
                />
              )}

              {errors[field.name] && (
                <ValidationError message={errors[field.name]} />
              )}

              {field.help && (
                <p className="text-xs text-gray-500 mt-1">{field.help}</p>
              )}
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              aria-label="Save"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
