import { useState, useEffect } from 'react'
import { dataManagement } from '../../lib/dataManagement'
import ConfirmDialog from './ConfirmDialog'
import ErrorBanner from './ErrorBanner'
import LoadingSkeleton from './LoadingSkeleton'
import Badge from './Badge'

/**
 * Reusable DataTable component with CRUD operations
 * 
 * @param {string} table - Table name
 * @param {Array} columns - Column definitions: { key, label, type, render? }
 * @param {Object} actions - Action handlers: { onAdd, onEdit, onDelete }
 * @param {Object} options - Options: { searchable, sortable, paginated, pageSize }
 */
export default function DataTable({
  table,
  columns,
  actions = {},
  options = {},
}) {
  const {
    searchable = true,
    sortable = true,
    paginated = true,
    pageSize = 10,
  } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Load data
  useEffect(() => {
    loadData()
  }, [sortBy, sortAsc])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const { data: records } = await dataManagement.fetchAll(table, {
        orderBy: sortBy,
        ascending: sortAsc,
      })
      setData(records)
      setCurrentPage(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter data
  const filteredData = searchable && searchTerm
    ? data.filter(row =>
        columns.some(col =>
          String(row[col.key])
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      )
    : data

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = paginated
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData

  async function handleDelete(id) {
    try {
      setDeleting(true)
      await dataManagement.delete(table, id)
      setData(data.filter(row => row.id !== id))
      setDeleteConfirm(null)
      actions.onDelete?.({ id })
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  function handleSort(key) {
    if (!sortable) return
    if (sortBy === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortBy(key)
      setSortAsc(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchable && (
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Search table"
            />
          </div>
        )}
        <button
          onClick={() => actions.onAdd?.()}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          aria-label="Add new record"
        >
          + Add New
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <ErrorBanner
          message={error}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 py-3 text-left font-semibold text-gray-700 ${
                      sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {sortable && sortBy === col.key && (
                        <svg className={`w-4 h-4 ${sortAsc ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 8a1 1 0 011-1h12a1 1 0 011 1v.01a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={`${row.id}-${col.key}`} className="px-4 py-3 text-gray-900">
                      {col.render ? col.render(row[col.key], row) : formatValue(row[col.key], col.type)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => actions.onEdit?.(row)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                        aria-label={`Edit ${row.name || row.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(row)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                        aria-label={`Delete ${row.name || row.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {currentPage} of {totalPages} ({filteredData.length} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Record"
          message={`Are you sure you want to delete "${deleteConfirm.name || deleteConfirm.id}"? This action cannot be undone and may delete related records.`}
          confirmText="Delete"
          confirmVariant="danger"
          onConfirm={() => handleDelete(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}

function formatValue(value, type) {
  if (value === null || value === undefined) return '—'

  switch (type) {
    case 'boolean':
      return value ? (
        <Badge variant="success" label="Yes" />
      ) : (
        <Badge variant="secondary" label="No" />
      )
    case 'date':
      return new Date(value).toLocaleDateString()
    case 'datetime':
      return new Date(value).toLocaleString()
    case 'number':
      return Number(value).toLocaleString()
    default:
      return String(value)
  }
}
