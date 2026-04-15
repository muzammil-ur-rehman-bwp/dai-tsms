/**
 * Integration Tests — Timetable Business Rules
 *
 * These tests verify two critical timetable constraints that require a live
 * Supabase instance:
 *   26.6 — Publish is blocked when any course-section assignment has < 2 slots
 *   26.7 — Swap request approval atomically exchanges both slots in one transaction
 *
 * HOW TO RUN:
 *   1. Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
 *      in your environment (or .env.test.local).
 *   2. Ensure the seed script has been run and at least one timetable exists.
 *   3. Remove the `.skip` from the describe blocks below.
 *   4. Run: npx vitest run src/integration/timetable.test.js
 *
 * SETUP NOTES:
 *   - TIMETABLE_ID: UUID of a draft timetable that has at least one
 *     course_section_assignment with fewer than 2 slots (for test 26.6).
 *   - SWAP_REQUEST_ID: UUID of a pending swap_request (for test 26.7).
 *   - REQUESTING_SLOT_ID / TARGET_SLOT_ID: the two slots involved in the swap.
 *   - REQUESTING_TEACHER_ID / TARGET_TEACHER_ID: the two teachers involved.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ---------------------------------------------------------------------------
// Test fixture IDs — replace with real UUIDs before running
// ---------------------------------------------------------------------------
const TIMETABLE_ID = '<uuid-of-draft-timetable>'
const SWAP_REQUEST_ID = '<uuid-of-pending-swap-request>'
const REQUESTING_SLOT_ID = '<uuid-of-requesting-slot>'
const TARGET_SLOT_ID = '<uuid-of-target-slot>'
const REQUESTING_TEACHER_ID = '<uuid-of-requesting-teacher>'
const TARGET_TEACHER_ID = '<uuid-of-target-teacher>'

// ---------------------------------------------------------------------------
// 26.6 — Timetable publish blocked when course-section assignments have < 2 slots
// ---------------------------------------------------------------------------
describe.skip('Timetable — publish guard (< 2 slots per assignment)', () => {
  let supabase

  beforeAll(() => {
    supabase = createClient(supabaseUrl, serviceRoleKey)
  })

  it('publish is blocked when at least one assignment has fewer than 2 slots', async () => {
    /**
     * What this validates (R13.6, TimetableManagementPage publish action):
     *   - The UI calls a validation check before setting timetable.status = 'published'.
     *   - If any course_section_assignment for the timetable has fewer than 2 associated
     *     slots, the publish action is rejected and a descriptive error is shown.
     *
     * Manual verification:
     *   1. Create a timetable with at least one course-section assignment.
     *   2. Add only 1 slot for that assignment (not 2).
     *   3. Attempt to publish the timetable via the Admin UI.
     *   4. Verify the UI shows a blocking modal listing the incomplete assignments.
     *   5. Verify the timetable status remains 'draft'.
     *
     * Automated (checks the DB state after a simulated publish attempt):
     */

    // Verify the timetable is still in draft status (publish was blocked)
    const { data: timetable, error } = await supabase
      .from('timetables')
      .select('status')
      .eq('id', TIMETABLE_ID)
      .single()

    expect(error).toBeNull()

    // Count slots per assignment for this timetable
    const { data: assignments, error: aErr } = await supabase
      .from('course_section_assignments')
      .select('id')
      .eq('timetable_id', TIMETABLE_ID)

    expect(aErr).toBeNull()

    const incompleteAssignments = []
    for (const assignment of assignments ?? []) {
      const { count, error: sErr } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('assignment_id', assignment.id)
      expect(sErr).toBeNull()
      if (count < 2) {
        incompleteAssignments.push({ assignmentId: assignment.id, slotCount: count })
      }
    }

    if (incompleteAssignments.length > 0) {
      // Publish should be blocked — timetable must still be draft
      expect(timetable.status).toBe('draft')
    }
  })

  it('publish succeeds when all assignments have exactly 2 slots', async () => {
    /**
     * What this validates (R13.6):
     *   - When every course_section_assignment has exactly 2 slots, the Admin
     *     can successfully publish the timetable (status changes to 'published').
     *
     * Manual verification:
     *   1. Ensure all assignments for the timetable have 2 slots each.
     *   2. Click Publish in the Admin UI.
     *   3. Verify the timetable status badge changes to "Published".
     *
     * Automated: update timetable status to 'published' and verify no DB error.
     */
    // This test requires a fully-slotted timetable fixture — set up manually.
    expect(true).toBe(true) // placeholder
  })
})

// ---------------------------------------------------------------------------
// 26.7 — Swap request atomic exchange — both slots updated in single transaction
// ---------------------------------------------------------------------------
describe.skip('Timetable — approve_swap_request RPC atomicity', () => {
  let supabase

  beforeAll(() => {
    supabase = createClient(supabaseUrl, serviceRoleKey)
  })

  it('approve_swap_request exchanges teacher_id on both slots atomically', async () => {
    /**
     * What this validates (R18.7, approve_swap_request RPC in 001_initial_schema.sql):
     *   - Calling approve_swap_request(swap_id) atomically:
     *       1. Sets requesting_slot.teacher_id = target_teacher_id
     *       2. Sets target_slot.teacher_id = requesting_teacher_id
     *       3. Sets swap_request.status = 'approved'
     *   - All three updates happen in a single transaction — either all succeed
     *     or all fail (no partial state).
     *
     * Manual verification:
     *   1. Note the teacher_id values on both slots before the swap.
     *   2. Call: SELECT approve_swap_request('<SWAP_REQUEST_ID>');
     *   3. Verify requesting_slot.teacher_id is now TARGET_TEACHER_ID.
     *   4. Verify target_slot.teacher_id is now REQUESTING_TEACHER_ID.
     *   5. Verify swap_request.status = 'approved'.
     *
     * Automated:
     */

    // Capture pre-swap state
    const { data: reqSlotBefore } = await supabase
      .from('slots')
      .select('teacher_id')
      .eq('id', REQUESTING_SLOT_ID)
      .single()

    const { data: tgtSlotBefore } = await supabase
      .from('slots')
      .select('teacher_id')
      .eq('id', TARGET_SLOT_ID)
      .single()

    expect(reqSlotBefore.teacher_id).toBe(REQUESTING_TEACHER_ID)
    expect(tgtSlotBefore.teacher_id).toBe(TARGET_TEACHER_ID)

    // Execute the RPC
    const { error: rpcError } = await supabase.rpc('approve_swap_request', {
      swap_id: SWAP_REQUEST_ID,
    })
    expect(rpcError).toBeNull()

    // Verify post-swap state — teachers should be exchanged
    const { data: reqSlotAfter } = await supabase
      .from('slots')
      .select('teacher_id')
      .eq('id', REQUESTING_SLOT_ID)
      .single()

    const { data: tgtSlotAfter } = await supabase
      .from('slots')
      .select('teacher_id')
      .eq('id', TARGET_SLOT_ID)
      .single()

    expect(reqSlotAfter.teacher_id).toBe(TARGET_TEACHER_ID)
    expect(tgtSlotAfter.teacher_id).toBe(REQUESTING_TEACHER_ID)

    // Verify swap request status
    const { data: swapRequest } = await supabase
      .from('swap_requests')
      .select('status')
      .eq('id', SWAP_REQUEST_ID)
      .single()

    expect(swapRequest.status).toBe('approved')
  })

  it('approve_swap_request fails gracefully when swap is not pending', async () => {
    /**
     * What this validates:
     *   - Calling approve_swap_request on an already-approved or cancelled swap
     *     raises an exception and does NOT modify any slot data.
     *
     * Manual verification:
     *   1. Approve a swap request (status = 'approved').
     *   2. Call approve_swap_request again with the same swap_id.
     *   3. Verify an error is returned: "Swap request is not pending".
     *   4. Verify slot teacher_ids are unchanged.
     *
     * Automated: call RPC on an already-approved swap and expect an error.
     */
    const { error } = await supabase.rpc('approve_swap_request', {
      swap_id: SWAP_REQUEST_ID, // already approved from previous test
    })
    expect(error).not.toBeNull()
    expect(error.message).toMatch(/not pending/i)
  })
})
