import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DAYS_OF_WEEK } from '../../lib/constants'

/**
 * Filter bar with Section, Teacher, Room, Day dropdowns.
 *
 * Props:
 *   timetableId   - string
 *   filters       - { section, teacher, room, day }
 *   onFilterChange - (key, value) => void
 */
export default function TimetableFilters({ timetableId, filters = {}, onFilterChange }) {
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!timetableId) return

    // Fetch sections, teachers, rooms used in this timetable's assignments
    supabase
      .from('course_section_assignments')
      .select('section:sections(id, name), teacher:teachers(id, name)')
      .eq('timetable_id', timetableId)
      .then(({ data }) => {
        if (!data) return
        const secMap = {}
        const teachMap = {}
        for (const a of data) {
          if (a.section) secMap[a.section.id] = a.section
          if (a.teacher) teachMap[a.teacher.id] = a.teacher
        }
        setSections(Object.values(secMap).sort((a, b) => a.name.localeCompare(b.name)))
        setTeachers(Object.values(teachMap).sort((a, b) => a.name.localeCompare(b.name)))
      })

    supabase
      .from('slots')
      .select('room:rooms(id, name)')
      .eq('timetable_id', timetableId)
      .then(({ data }) => {
        if (!data) return
        const roomMap = {}
        for (const s of data) {
          if (s.room) roomMap[s.room.id] = s.room
        }
        setRooms(Object.values(roomMap).sort((a, b) => a.name.localeCompare(b.name)))
      })
  }, [timetableId])

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Section filter */}
      <div>
        <label htmlFor="filter-section" className="sr-only">Filter by section</label>
        <select
          id="filter-section"
          value={filters.section ?? ''}
          onChange={e => onFilterChange?.('section', e.target.value)}
          aria-label="Filter by section"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Sections</option>
          {sections.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Teacher filter */}
      <div>
        <label htmlFor="filter-teacher" className="sr-only">Filter by teacher</label>
        <select
          id="filter-teacher"
          value={filters.teacher ?? ''}
          onChange={e => onFilterChange?.('teacher', e.target.value)}
          aria-label="Filter by teacher"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Teachers</option>
          {teachers.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Room filter */}
      <div>
        <label htmlFor="filter-room" className="sr-only">Filter by room</label>
        <select
          id="filter-room"
          value={filters.room ?? ''}
          onChange={e => onFilterChange?.('room', e.target.value)}
          aria-label="Filter by room"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Rooms</option>
          {rooms.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Day filter */}
      <div>
        <label htmlFor="filter-day" className="sr-only">Filter by day</label>
        <select
          id="filter-day"
          value={filters.day ?? ''}
          onChange={e => onFilterChange?.('day', e.target.value)}
          aria-label="Filter by day"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Days</option>
          {DAYS_OF_WEEK.map(d => (
            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {(filters.section || filters.teacher || filters.room || filters.day) && (
        <button
          onClick={() => {
            onFilterChange?.('section', '')
            onFilterChange?.('teacher', '')
            onFilterChange?.('room', '')
            onFilterChange?.('day', '')
          }}
          aria-label="Clear all filters"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
