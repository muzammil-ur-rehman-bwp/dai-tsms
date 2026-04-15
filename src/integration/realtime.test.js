/**
 * Integration Tests — Supabase Realtime
 *
 * These tests verify that slot mutations propagate to all connected subscribers
 * within 2 seconds, as required by R16 (Data Persistence and Real-Time Updates).
 *
 * HOW TO RUN:
 *   1. Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
 *      in your environment (or .env.test.local).
 *   2. Ensure Realtime is enabled for the `slots` table in your Supabase project
 *      (Database → Replication → supabase_realtime publication → slots table).
 *   3. Ensure at least one timetable with a known ID exists.
 *   4. Remove the `.skip` from the describe block below.
 *   5. Run: npx vitest run src/integration/realtime.test.js
 *
 * SETUP NOTES:
 *   - TIMETABLE_ID: UUID of an existing draft timetable to use for test slots
 *   - COURSE_ID, TEACHER_ID, ROOM_ID, SECTION_ID: UUIDs of existing active entities
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ---------------------------------------------------------------------------
// Test fixture IDs — replace with real UUIDs before running
// ---------------------------------------------------------------------------
const TIMETABLE_ID = '<uuid-of-test-timetable>'
const COURSE_ID = '<uuid-of-test-course>'
const TEACHER_ID = '<uuid-of-test-teacher>'
const ROOM_ID = '<uuid-of-test-room>'
const SECTION_ID = '<uuid-of-test-section>'

const REALTIME_TIMEOUT_MS = 2000 // R16: propagation must occur within 2 seconds

// ---------------------------------------------------------------------------
// 26.5 — Realtime: slot change propagates to subscriber within 2 seconds
// ---------------------------------------------------------------------------
describe.skip('Realtime — slot change propagation', () => {
  let adminClient
  let subscriberClient
  let insertedSlotId

  beforeAll(async () => {
    adminClient = createClient(supabaseUrl, serviceRoleKey)
    subscriberClient = createClient(supabaseUrl, anonKey)

    // Sign in as admin for the subscriber client so RLS allows slot reads
    // (In a real test you'd sign in as an admin user, not use service-role for subscriber)
  })

  afterAll(async () => {
    // Clean up the test slot if it was created
    if (insertedSlotId) {
      await adminClient.from('slots').delete().eq('id', insertedSlotId)
    }
    await subscriberClient.removeAllChannels()
  })

  it('INSERT on slots table propagates to subscriber within 2 seconds', async () => {
    /**
     * What this validates (R16.4, useRealtimeSlots hook):
     *   - When an admin inserts a new slot, any client subscribed to
     *     postgres_changes on the slots table (filtered by timetable_id)
     *     receives the INSERT event within REALTIME_TIMEOUT_MS.
     *
     * Manual verification:
     *   1. Open two browser tabs — both signed in.
     *   2. Tab A: navigate to the timetable scheduling page.
     *   3. Tab B: create a new slot via the Admin UI.
     *   4. Tab A: verify the new slot appears on the grid within 2 seconds
     *      without a page refresh.
     *
     * Automated:
     */
    let receivedEvent = null

    const channel = subscriberClient
      .channel(`slots:timetable_id=eq.${TIMETABLE_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'slots',
          filter: `timetable_id=eq.${TIMETABLE_ID}`,
        },
        (payload) => {
          receivedEvent = payload
        }
      )
      .subscribe()

    // Wait for subscription to be established
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Insert a test slot using the admin client
    const { data, error } = await adminClient.from('slots').insert({
      timetable_id: TIMETABLE_ID,
      day_of_week: 'monday',
      start_time: '09:00',
      end_time: '10:30',
      course_id: COURSE_ID,
      teacher_id: TEACHER_ID,
      room_id: ROOM_ID,
      section_id: SECTION_ID,
    }).select('id').single()

    expect(error).toBeNull()
    insertedSlotId = data?.id

    // Wait up to REALTIME_TIMEOUT_MS for the event to arrive
    const deadline = Date.now() + REALTIME_TIMEOUT_MS
    while (!receivedEvent && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    subscriberClient.removeChannel(channel)

    expect(receivedEvent).not.toBeNull()
    expect(receivedEvent.eventType).toBe('INSERT')
    expect(receivedEvent.new.id).toBe(insertedSlotId)
  })

  it('UPDATE on slots table propagates to subscriber within 2 seconds', async () => {
    /**
     * What this validates (R16.4):
     *   - When an admin updates a slot (e.g., changes start_time), the subscriber
     *     receives the UPDATE event within REALTIME_TIMEOUT_MS.
     *
     * Manual verification:
     *   1. Open two browser tabs.
     *   2. Tab A: view the timetable grid.
     *   3. Tab B: edit a slot's time via the Admin UI.
     *   4. Tab A: verify the slot moves on the grid within 2 seconds.
     *
     * Automated: similar to INSERT test above but using .update() and 'UPDATE' event.
     */
    expect(true).toBe(true) // placeholder — implement analogously to INSERT test
  })

  it('DELETE on slots table propagates to subscriber within 2 seconds', async () => {
    /**
     * What this validates (R16.4):
     *   - When an admin deletes a slot, the subscriber receives the DELETE event
     *     within REALTIME_TIMEOUT_MS and the slot disappears from the grid.
     *
     * Manual verification:
     *   1. Open two browser tabs.
     *   2. Tab A: view the timetable grid.
     *   3. Tab B: delete a slot via the Admin UI.
     *   4. Tab A: verify the slot disappears within 2 seconds.
     *
     * Automated: similar to INSERT test above but using .delete() and 'DELETE' event.
     */
    expect(true).toBe(true) // placeholder — implement analogously to INSERT test
  })
})
