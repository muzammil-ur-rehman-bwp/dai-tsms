import { useState } from 'react'
import { csvUtils, dataManagement } from '../../lib/dataManagement'
import ErrorBanner from './ErrorBanner'
import LoadingSkeleton from './LoadingSkeleton'

/**
 * Bulk upload component for CSV imports
 * 
 * @param {string} table - Table name
 * @param {Object} schema - Validation schema: { field: { required, type, pattern } }
 * @param {Function} onSuccess - Success callback
 * @param {Function} onCancel - Cancel callback
 */
export default function BulkUpload({
  table,
  schema,
  onSuccess,
  onCancel,
}) {
  const [file, setFile] = useState(null)
  const [records, setRecords] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState('upload') // upload, preview, confirm, done

  async function handleFileSelect(e) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setFile(selectedFile)
    setLoading(true)

    try {
      const parsed = await csvUtils.parseCSV(selectedFile)
      const { valid, errors } = csvUtils.validateRecords(parsed, schema)

      setRecords(valid)
      setValidationErrors(errors)
      setStep('preview')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (records.length === 0) {
      setError('No valid records to upload')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { upserted, errors: uploadErrors } = await dataManagement.bulkUpsert(
        table,
        records
      )

      if (uploadErrors.length > 0) {
        setError(`Upload completed with errors: ${uploadErrors.join(', ')}`)
      } else {
        setSuccess(`Successfully uploaded ${upserted} records`)
        setStep('done')
        setTimeout(() => {
          onSuccess?.({ count: upserted })
        }, 1500)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Bulk Upload</h2>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              ✓ {success}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary hover:bg-primary-50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input').click()}
              >
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">CSV files only</p>
              </div>

              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
                aria-label="Upload CSV file"
              />

              {file && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  📄 {file.name}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Preview</h3>
                <p className="text-xs text-gray-600 mb-3">
                  {records.length} valid records found
                  {validationErrors.length > 0 && ` (${validationErrors.length} errors)`}
                </p>

                {validationErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700 max-h-40 overflow-y-auto">
                    <p className="font-semibold mb-2">Validation Errors:</p>
                    {validationErrors.map((err, idx) => (
                      <div key={idx} className="mb-1">
                        <strong>Row {err.row}:</strong> {err.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                )}

                {records.length > 0 && (
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {Object.keys(records[0]).map(key => (
                            <th key={key} className="px-3 py-2 text-left font-semibold text-gray-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {records.slice(0, 5).map((record, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {Object.values(record).map((value, vidx) => (
                              <td key={vidx} className="px-3 py-2 text-gray-600 truncate max-w-xs">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {records.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... and {records.length - 5} more records
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFile(null)
                    setRecords([])
                    setValidationErrors([])
                    setStep('upload')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={records.length === 0}
                  className="flex-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <p className="font-semibold mb-1">Ready to upload</p>
                <p>{records.length} records will be imported</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('preview')}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Complete</h3>
              <p className="text-sm text-gray-600">All records have been imported successfully</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
