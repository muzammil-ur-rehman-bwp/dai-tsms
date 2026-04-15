/**
 * Data Management Utilities
 * Provides CRUD operations, bulk operations, and data validation
 */

import { supabase } from './supabase'

/**
 * Generic CRUD operations for any table
 */
export const dataManagement = {
  /**
   * Fetch all records with optional filtering and pagination
   */
  async fetchAll(table, { filters = {}, orderBy = 'created_at', ascending = false, limit = null } = {}) {
    let query = supabase.from(table).select('*')

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value)
      }
    })

    // Apply ordering
    query = query.order(orderBy, { ascending })

    // Apply limit
    if (limit) query = query.limit(limit)

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count }
  },

  /**
   * Fetch single record by ID
   */
  async fetchById(table, id) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create new record
   */
  async create(table, record) {
    const { data, error } = await supabase
      .from(table)
      .insert([record])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update record
   */
  async update(table, id, updates) {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete record (with cascade support via RLS/triggers)
   */
  async delete(table, id) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  /**
   * Bulk insert records
   */
  async bulkInsert(table, records) {
    if (!records || records.length === 0) {
      return { inserted: 0, errors: [] }
    }

    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select()

    if (error) {
      return { inserted: 0, errors: [error.message] }
    }

    return { inserted: data?.length || 0, errors: [] }
  },

  /**
   * Bulk upsert records (insert or update)
   */
  async bulkUpsert(table, records, conflictColumn = 'id') {
    if (!records || records.length === 0) {
      return { upserted: 0, errors: [] }
    }

    const { data, error } = await supabase
      .from(table)
      .upsert(records, { onConflict: conflictColumn })
      .select()

    if (error) {
      return { upserted: 0, errors: [error.message] }
    }

    return { upserted: data?.length || 0, errors: [] }
  },

  /**
   * Get record count
   */
  async getCount(table, filters = {}) {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        query = query.eq(key, value)
      }
    })

    const { count, error } = await query

    if (error) throw error
    return count || 0
  },

  /**
   * Search records by text
   */
  async search(table, searchColumns, searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      return []
    }

    let query = supabase.from(table).select('*')

    // Build OR filter for multiple columns
    const filters = searchColumns
      .map(col => `${col}.ilike.%${searchTerm}%`)
      .join(',')

    query = query.or(filters)

    const { data, error } = await query.limit(50)

    if (error) throw error
    return data || []
  },
}

/**
 * CSV parsing and validation
 */
export const csvUtils = {
  /**
   * Parse CSV file
   */
  parseCSV(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csv = e.target.result
          const lines = csv.split('\n').filter(line => line.trim())
          if (lines.length < 2) {
            reject(new Error('CSV must have at least a header and one data row'))
            return
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          const records = []

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim())
            if (values.every(v => !v)) continue // Skip empty lines

            const record = {}
            headers.forEach((h, idx) => {
              record[h] = values[idx] || ''
            })
            records.push(record)
          }

          resolve(records)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  },

  /**
   * Validate CSV records
   */
  validateRecords(records, schema) {
    const errors = []
    const valid = []

    records.forEach((record, idx) => {
      const recordErrors = []

      Object.entries(schema).forEach(([field, rules]) => {
        const value = record[field]

        // Check required
        if (rules.required && (!value || value === '')) {
          recordErrors.push(`${field} is required`)
        }

        // Check type
        if (value && rules.type === 'number' && isNaN(value)) {
          recordErrors.push(`${field} must be a number`)
        }

        // Check pattern
        if (value && rules.pattern && !rules.pattern.test(value)) {
          recordErrors.push(`${field} format is invalid`)
        }
      })

      if (recordErrors.length > 0) {
        errors.push({ row: idx + 2, errors: recordErrors })
      } else {
        valid.push(record)
      }
    })

    return { valid, errors }
  },
}

/**
 * Export data to CSV
 */
export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const value = row[h]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}
