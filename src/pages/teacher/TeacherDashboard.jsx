import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import TimetableGrid from '../../components/timetable/TimetableGrid'
import SwapRequestList from '../../components/swap/SwapRequestList'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { DAYS_OF_WEEK } from '../../lib/constants'
import { timeDiffMinutes } from '../../lib/utils'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState(null)
  const [timetable, setTimetable] = useState(null)
  const [slots, setSlots] = useState([])
  const [courses, setCourses] = useState({})
  const [teacherMap, setTeacherMap] = useState({})
  const [roomMap, setRoomMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)

      // Get teacher record
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('auth_user_id', user.id)
        .single()

      if (!teacherData) { setLoading(false); return }
      setTeacher(teacherData)

      // Get active published timetable
      const { data: tt } = await supabase
        .from('timetables')
        .select('*, academic_period:academic_periods!inner(name, is_active)')
        .eq('status', 'published')
        .eq('academic_period.is_active', true)
        .limit(1)
        .single()

      if (!tt) { setLoading(false); return }
      setTimetable(tt)

      // Get teacher's slots
      const { data: slotData } = await supabase
        .from('slots')
        .select('*')
        .eq('timetable_id', tt.id)
        .eq('teacher_id', teacherData.id)

      setSlots(slotData ?? [])

      // Reference data
      const [{ data: courseData }, { data: teacherList }, { data: roomData }] = await Promise.all([
        supabase.from('courses').select('id, name, code'),
        supabase.from('teachers').select('id, name'),
        supabase.from('rooms').select('id, name'),
      ])

      const cMap = {}; for (const c of courseData ?? []) cMap[c.id] = c
      const tMap = {}; for (const t of teacherList ?? []) tMap[t.id] = t
      const rMap = {}; for (const r of roomData ?? []) rMap[r.id] = r
      setCourses(cMap)
      setTeacherMap(tMap)
      setRoomMap(rMap)
      setLoading(false)
    }
    load()
  }, [user])

  const enabledDays = timetable
    ? DAYS_OF_WEEK.filter(d => timetable[`day_${d}`])
    : ['monday', 'tuesday', 'wednesday', 'thursday']

  // Quick stats
  const classesThisWeek = slots.length
  const contactHoursThisWeek = slots.reduce((sum, s) => sum + timeDiffMinutes(s.start_time, s.end_time), 0)
  const contactHoursFormatted = `${Math.floor(contactHoursThisWeek / 60)}h ${contactHoursThisWeek % 60}m`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          {teacher ? `Welcome, ${teacher.name}` : 'Teacher Dashboard'}
        </h1>
        <Link
          to="/teacher/timetable"
          aria-label="View full timetable"
          className="text-sm font-medium text-primary hover:underline"
        >
          Full Timetable →
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Classes This Week</p>
          {loading ? (
            <div className="mt-2 h-8 w-12 rounded bg-gray-200 animate-pulse" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-primary">{classesThisWeek}</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Hours</p>
          {loading ? (
            <div className="mt-2 h-8 w-20 rounded bg-gray-200 animate-pulse" />
          ) : (
            <p className="mt-1 text-3xl font-bold text-secondary">{contactHoursFormatted}</p>
          )}
        </div>
      </div>

      {/* Weekly timetable grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">My Weekly Schedule</h2>
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : !timetable ? (
          <EmptyState message="No published timetable is currently active." />
        ) : slots.length === 0 ? (
          <EmptyState message="No slots assigned to you in the current timetable." />
        ) : (
          <TimetableGrid
            slots={slots}
            courses={courses}
            teachers={teacherMap}
            rooms={roomMap}
            enabledDays={enabledDays}
          />
        )}
      </div>

      {/* Pending swap requests */}
      {teacher && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Swap Requests</h2>
          <SwapRequestList teacherId={teacher.id} />
        </div>
      )}
    </div>
  )
}
