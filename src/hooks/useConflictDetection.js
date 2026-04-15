import { supabase } from '../lib/supabase'
import { detectConflicts } from '../lib/utils'

/**
 * Hook that wraps detectConflicts() from utils.js.
 * Queries existing slots from Supabase for the timetable and runs conflict detection.
 *
 * @param {string} timetableId
 * @returns {{ checkConflicts: (newSlot: object, excludeSlotId?: string) => Promise<Array> }}
 */
export function useConflictDetection(timetableId) {
  async function checkConflicts(newSlot, excludeSlotId = null) {
    if (!timetableId) return []

    let query = supabase
      .from('slots')
      .select('id, day_of_week, start_time, end_time, teacher_id, room_id, section_id')
      .eq('timetable_id', timetableId)

    if (excludeSlotId) {
      query = query.neq('id', excludeSlotId)
    }

    const { data, error } = await query
    if (error || !data) return []

    return detectConflicts(newSlot, data)
  }

  return { checkConflicts }
}
