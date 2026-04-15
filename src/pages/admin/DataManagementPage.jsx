import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const ENTITIES = [
  { key: 'academic-years', label: 'Academic Years', table: 'academic_years' },
  { key: 'academic-semesters', label: 'Academic Semesters', table: 'academic_semesters' },
  { key: 'academic-periods', label: 'Academic Periods', table: 'academic_periods' },
  { key: 'disciplines', label: 'Disciplines', table: 'disciplines' },
  { key: 'programs', label: 'Programs', table: 'programs' },
  { key: 'semester-numbers', label: 'Semester Numbers', table: 'semester_numbers' },
  { key: 'section-numbers', label: 'Section Numbers', table: 'section_numbers' },
  { key: 'degree-levels', label: 'Degree Levels', table: 'degree_levels' },
  { key: 'campuses', label: 'Campuses', table: 'campuses' },
  { key: 'sections', label: 'Sections', table: 'sections' },
  { key: 'teachers', label: 'Teachers', table: 'teachers' },
  { key: 'students', label: 'Students', table: 'students' },
  { key: 'courses', label: 'Courses', table: 'courses' },
  { key: 'rooms', label: 'Rooms', table: 'rooms' },
  { key: 'slots', label: 'Slots', table: 'slots' },
  { key: 'slot-durations', label: 'Slot Durations', table: 'slot_durations' },
]

function EntityCard({ entity, count, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Manage ${entity.label}`}
      className="bg-white rounded-lg border border-gray-200 p-5 text-left hover:border-primary hover:shadow-sm transition-all group"
    >
      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary">{entity.label}</p>
      <div className="mt-2">
        {loading ? (
          <div className="h-6 w-10 rounded bg-gray-200 animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-700">{count ?? 0}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">records</p>
      </div>
    </button>
  )
}

export default function DataManagementPage() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCounts() {
      const results = await Promise.all(
        ENTITIES.map(e =>
          supabase.from(e.table).select('id', { count: 'exact', head: true })
        )
      )
      const c = {}
      ENTITIES.forEach((e, i) => { c[e.key] = results[i].count ?? 0 })
      setCounts(c)
      setLoading(false)
    }
    loadCounts()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Data Management</h1>
      <p className="text-sm text-gray-500">Select an entity to view and manage its records.</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ENTITIES.map(entity => (
          <EntityCard
            key={entity.key}
            entity={entity}
            count={counts[entity.key]}
            loading={loading}
            onClick={() => navigate(`/admin/data/${entity.key}`)}
          />
        ))}
      </div>
    </div>
  )
}
