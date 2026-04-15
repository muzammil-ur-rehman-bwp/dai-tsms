import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtimeSlots } from '../hooks/useRealtimeSlots'

const TimetableContext = createContext(null)

/**
 * Provides active timetable state, slot list, and Supabase Realtime subscription.
 *
 * Props:
 *   timetableId - string (the timetable to load)
 *   children
 */
export function TimetableProvider({ timetableId, children }) {
  const [timetable, setTimetable] = useState(null)
  const [slots, setSlots] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    if (!timetableId) return
    setLoading(true)
    setError('')

    const [ttRes, slotsRes, assignRes] = await Promise.all([
      supabase
        .from('timetables')
        .select('*')
        .eq('id', timetableId)
        .single(),
      supabase
        .from('slots')
        .select('*')
        .eq('timetable_id', timetableId)
        .order('day_of_week')
        .order('start_time'),
      supabase
        .from('course_section_assignments')
        .select(`
          id,
          course:courses(id, name, code, contact_hours_minutes),
          section:sections(id, name),
          teacher:teachers(id, name)
        `)
        .eq('timetable_id', timetableId),
    ])

    if (ttRes.error) setError(ttRes.error.message)
    else setTimetable(ttRes.data)

    setSlots(slotsRes.data ?? [])
    setAssignments(assignRes.data ?? [])
    setLoading(false)
  }, [timetableId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Realtime updates
  useRealtimeSlots(timetableId, {
    onInsert: (newSlot) => {
      setSlots(prev => {
        // Avoid duplicates (optimistic update may have already added it)
        if (prev.some(s => s.id === newSlot.id)) return prev
        return [...prev, newSlot]
      })
    },
    onUpdate: (updatedSlot) => {
      setSlots(prev => prev.map(s => s.id === updatedSlot.id ? updatedSlot : s))
    },
    onDelete: (deletedId) => {
      setSlots(prev => prev.filter(s => s.id !== deletedId))
    },
  })

  const value = {
    timetable,
    slots,
    assignments,
    loading,
    error,
    refetch: fetchAll,
    // Optimistic slot operations
    addSlotOptimistic: (slot) => setSlots(prev => [...prev, slot]),
    removeSlotOptimistic: (slotId) => setSlots(prev => prev.filter(s => s.id !== slotId)),
    updateSlotOptimistic: (slot) => setSlots(prev => prev.map(s => s.id === slot.id ? slot : s)),
  }

  return (
    <TimetableContext.Provider value={value}>
      {children}
    </TimetableContext.Provider>
  )
}

export function useTimetableContext() {
  const ctx = useContext(TimetableContext)
  if (!ctx) throw new Error('useTimetableContext must be used within TimetableProvider')
  return ctx
}

export default TimetableContext
