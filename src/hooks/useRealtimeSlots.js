import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Subscribes to postgres_changes on the slots table filtered by timetable_id.
 * Updates local state on INSERT/UPDATE/DELETE events.
 *
 * @param {string} timetableId
 * @param {Function} onInsert  - (newSlot) => void
 * @param {Function} onUpdate  - (updatedSlot) => void
 * @param {Function} onDelete  - (deletedSlotId) => void
 */
export function useRealtimeSlots(timetableId, { onInsert, onUpdate, onDelete } = {}) {
  useEffect(() => {
    if (!timetableId) return

    const channel = supabase
      .channel(`slots:timetable_id=eq.${timetableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'slots',
          filter: `timetable_id=eq.${timetableId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            onInsert?.(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            onUpdate?.(payload.new)
          } else if (payload.eventType === 'DELETE') {
            onDelete?.(payload.old?.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [timetableId])
}
