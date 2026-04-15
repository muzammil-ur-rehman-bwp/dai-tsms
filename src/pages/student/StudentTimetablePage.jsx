import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import TimetableViewPage from '../../components/timetable/TimetableViewPage'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'

export default function StudentTimetablePage() {
  const { user } = useAuth()
  const [sectionId, setSectionId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('students')
        .select('section_id')
        .eq('auth_user_id', user.id)
        .single()
      setSectionId(data?.section_id ?? null)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <LoadingSkeleton rows={6} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Timetable</h1>
      {/* Read-only full timetable view, defaulting to student's own section */}
      <TimetableViewPage
        defaultFilterType="section"
        defaultFilterValue={sectionId}
        readOnly
      />
    </div>
  )
}
