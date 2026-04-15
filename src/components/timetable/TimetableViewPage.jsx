import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import TimetableGrid from './TimetableGrid'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import EmptyState from '../ui/EmptyState'
import { DAYS_OF_WEEK } from '../../lib/constants'

const VIEW_TYPES = [
  { key: 'section', label: 'Section-wise' },
  { key: 'teacher', label: 'Teacher-wise' },
  { key: 'room', label: 'Room-wise' },
  { key: 'day', label: 'Day-wise' },
]

/**
 * Shared timetable view component used by all roles.
 *
 * Props:
 *   timetableId        - UUID of timetable to display; if omitted, fetches active published timetable
 *   defaultFilterType  - 'section' | 'teacher' | 'room' | 'day'
 *   defaultFilterValue - pre-selected filter ID (or day string for day view)
 *   readOnly           - boolean; if true, clicking cells/slots does nothing
 */
export default function TimetableViewPage({
  timetableId: propTimetableId,
  defaultFilterType = 'section',
  defaultFilterValue = null,
  readOnly = false,
}) {
  const [timetable, setTimetable] = useState(null)
  const [slots, setSlots] = useState([])
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [rooms, setRooms] = useState([])
  const [courses, setCourses] = useState({})
  const [teacherMap, setTeacherMap] = useState({})
  const [roomMap, setRoomMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [viewType, setViewType] = useState(defaultFilterType)
  const [filterValue, setFilterValue] = useState(defaultFilterValue)

  // Load timetable + reference data
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let ttId = propTimetableId

        if (!ttId) {
          // Fetch active published timetable
          const { data: tt, error: ttErr } = await supabase
            .from('timetables')
            .select('*, academic_period:academic_periods!inner(name, is_active)')
            .eq('status', 'published')
            .eq('academic_period.is_active', true)
            .limit(1)
            .single()
          if (ttErr || !tt) {
            setTimetable(null)
            setLoading(false)
            return
          }
          setTimetable(tt)
          ttId = tt.id
        } else {
          const { data: tt } = await supabase
            .from('timetables')
            .select('*, academic_period:academic_periods(name)')
            .eq('id', ttId)
            .single()
          setTimetable(tt ?? null)
        }

        // Load all slots for this timetable
        const { data: slotData } = await supabase
          .from('slots')
          .select('*')
          .eq('timetable_id', ttId)
        setSlots(slotData ?? [])

        // Load reference data in parallel
        const [
          { data: sectionData },
          { data: teacherData },
          { data: roomData },
          { data: courseData },
        ] = await Promise.all([
          supabase.from('sections').select('id, name').eq('is_active', true).order('name'),
          supabase.from('teachers').select('id, name').eq('is_active', true).order('name'),
          supabase.from('rooms').select('id, name').eq('is_active', true).order('name'),
          supabase.from('courses').select('id, name, code').eq('is_active', true),
        ])

        setSections(sectionData ?? [])
        setTeachers(teacherData ?? [])
        setRooms(roomData ?? [])

        const cMap = {}
        for (const c of courseData ?? []) cMap[c.id] = c
        setCourses(cMap)

        const tMap = {}
        for (const t of teacherData ?? []) tMap[t.id] = t
        setTeacherMap(tMap)

        const rMap = {}
        for (const r of roomData ?? []) rMap[r.id] = r
        setRoomMap(rMap)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [propTimetableId])

  // Reset filter value when view type changes
  const handleViewTypeChange = (newType) => {
    setViewType(newType)
    if (newType === 'day') {
      setFilterValue(enabledDays[0] ?? null)
    } else {
      setFilterValue(null)
    }
  }

  // Derive enabled days from timetable record
  const enabledDays = useMemo(() => {
    if (!timetable) return ['monday', 'tuesday', 'wednesday', 'thursday']
    return DAYS_OF_WEEK.filter(d => timetable[`day_${d}`])
  }, [timetable])

  // Filter slots based on current view type + filter value
  const filteredSlots = useMemo(() => {
    if (!filterValue) return []
    switch (viewType) {
      case 'section':
        return slots.filter(s => s.section_id === filterValue)
      case 'teacher':
        return slots.filter(s => s.teacher_id === filterValue)
      case 'room':
        return slots.filter(s => s.room_id === filterValue)
      case 'day':
        return slots.filter(s => s.day_of_week === filterValue)
      default:
        return []
    }
  }, [slots, viewType, filterValue])

  // For day view, show all enabled days; otherwise show only enabled days
  const gridDays = useMemo(() => {
    if (viewType === 'day' && filterValue) {
      return enabledDays.includes(filterValue) ? [filterValue] : []
    }
    return enabledDays
  }, [viewType, filterValue, enabledDays])

  // Build filter options for current view type
  const filterOptions = useMemo(() => {
    switch (viewType) {
      case 'section': return sections.map(s => ({ id: s.id, label: s.name }))
      case 'teacher': return teachers.map(t => ({ id: t.id, label: t.name }))
      case 'room': return rooms.map(r => ({ id: r.id, label: r.name }))
      case 'day': return enabledDays.map(d => ({ id: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))
      default: return []
    }
  }, [viewType, sections, teachers, rooms, enabledDays])

  if (loading) return <LoadingSkeleton rows={8} />
  if (error) return <p className="text-sm text-danger p-4">{error}</p>
  if (!timetable) {
    return (
      <EmptyState message="No published timetable is currently active." />
    )
  }

  return (
    <div className="space-y-4">
      {/* Timetable header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{timetable.name}</h2>
        <p className="text-xs text-gray-500">{timetable.academic_period?.name}</p>
      </div>

      {/* View type tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {VIEW_TYPES.map(vt => (
          <button
            key={vt.key}
            onClick={() => handleViewTypeChange(vt.key)}
            aria-label={`Switch to ${vt.label}`}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
              viewType === vt.key
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {vt.label}
          </button>
        ))}
      </div>

      {/* Filter dropdown */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="timetable-filter-select"
          className="text-sm font-medium text-gray-700 whitespace-nowrap"
        >
          {VIEW_TYPES.find(v => v.key === viewType)?.label}:
        </label>
        <select
          id="timetable-filter-select"
          value={filterValue ?? ''}
          onChange={e => setFilterValue(e.target.value || null)}
          aria-label={`Select ${viewType} to view`}
          className="block w-56 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— Select —</option>
          {filterOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {!filterValue ? (
        <EmptyState message={`Select a ${viewType} to view its timetable.`} />
      ) : filteredSlots.length === 0 ? (
        <EmptyState message="No slots scheduled for this selection." />
      ) : (
        <TimetableGrid
          slots={filteredSlots}
          courses={courses}
          teachers={teacherMap}
          rooms={roomMap}
          enabledDays={gridDays}
          onCellClick={readOnly ? undefined : undefined}
          onSlotClick={readOnly ? undefined : undefined}
        />
      )}
    </div>
  )
}
