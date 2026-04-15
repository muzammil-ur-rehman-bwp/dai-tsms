import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import TimetableGrid from '../../components/timetable/TimetableGrid'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'
import EmptyState from '../../components/ui/EmptyState'
import { DAYS_OF_WEEK } from '../../lib/constants'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [timetable, setTimetable] = useState(null)
  const [slots, setSlots] = useState([])
  const [courses, setCourses] = useState({})
  const [teacherMap, setTeacherMap] = useState({})
  const [roomMap, setRoomMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [noTimetable, setNoTimetable] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)

      // Get student record with section
      const { data: studentData } = await supabase
        .from('students')
        .select('id, registration_no, section_id, section:sections(id, name)')
        .eq('auth_user_id', user.id)
        .single()

      if (!studentData) { setLoading(false); return }
      setStudent(studentData)

      // Get active published timetable
      const { data: tt } = await supabase
        .from('timetables')
        .select('*, academic_period:academic_periods!inner(name, is_active)')
        .eq('status', 'published')
        .eq('academic_period.is_active', true)
        .limit(1)
        .single()

      if (!tt) {
        setNoTimetable(true)
        setLoading(false)
        return
      }
      setTimetable(tt)

      // Get section's slots
      const { data: slotData } = await supabase
        .from('slots')
        .select('*')
        .eq('timetable_id', tt.id)
        .eq('section_id', studentData.section_id)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Timetable</h1>
          {student && (
            <p className="text-xs text-gray-500 mt-0.5">
              {student.section?.name} · {student.registration_no}
            </p>
          )}
        </div>
        <Link
          to="/student/timetable"
          aria-label="View full timetable"
          className="text-sm font-medium text-primary hover:underline"
        >
          Full Timetable →
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : noTimetable ? (
          <EmptyState message="No timetable published for the current academic period." />
        ) : slots.length === 0 ? (
          <EmptyState message="No slots scheduled for your section." />
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
    </div>
  )
}
