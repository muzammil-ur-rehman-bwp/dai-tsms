import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import TimetableViewPage from '../../components/timetable/TimetableViewPage'
import SwapRequestForm from '../../components/swap/SwapRequestForm'
import SwapRequestList from '../../components/swap/SwapRequestList'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'

export default function TeacherTimetablePage() {
  const { user } = useAuth()
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSwapForm, setShowSwapForm] = useState(false)
  const [swapRefresh, setSwapRefresh] = useState(0)

  useEffect(() => {
    async function load() {
      if (!user) return
      const { data } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('auth_user_id', user.id)
        .single()
      setTeacher(data ?? null)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <LoadingSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Timetable</h1>
        {teacher && (
          <button
            onClick={() => setShowSwapForm(true)}
            aria-label="Request a slot swap"
            className="px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-secondary-700 transition-colors"
          >
            Request Swap
          </button>
        )}
      </div>

      {/* Full timetable view — default to teacher-wise for logged-in teacher */}
      <TimetableViewPage
        defaultFilterType="teacher"
        defaultFilterValue={teacher?.id ?? null}
        readOnly={false}
      />

      {/* Swap requests list */}
      {teacher && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">My Swap Requests</h2>
          <SwapRequestList key={swapRefresh} teacherId={teacher.id} />
        </div>
      )}

      {/* Swap request modal */}
      {showSwapForm && teacher && (
        <SwapRequestForm
          teacherId={teacher.id}
          onClose={() => setShowSwapForm(false)}
          onSubmitted={() => setSwapRefresh(r => r + 1)}
        />
      )}
    </div>
  )
}
