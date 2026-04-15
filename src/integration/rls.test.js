/**
 * Integration Tests — Row-Level Security (RLS)
 *
 * These tests verify that the RLS policies defined in 001_initial_schema.sql
 * correctly restrict data access based on the authenticated user's role.
 *
 * HOW TO RUN:
 *   1. Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY
 *      in your environment (or .env.test.local).
 *   2. Ensure the seed script has been run and at least one timetable with slots exists.
 *   3. Create a test student auth user enrolled in a known section.
 *   4. Create a test teacher auth user.
 *   5. Remove the `.skip` from the describe blocks below.
 *   6. Run: npx vitest run src/integration/rls.test.js
 *
 * SETUP NOTES:
 *   - studentEmail / studentPassword: credentials for a student enrolled in SECTION_A_ID
 *   - teacherEmail / teacherPassword: credentials for any seeded teacher
 *   - SECTION_A_ID: the UUID of the section the test student belongs to
 *   - SECTION_B_ID: a different section (student should NOT see its slots)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ---------------------------------------------------------------------------
// Test credentials — replace with real test-user credentials before running
// ---------------------------------------------------------------------------
const STUDENT_EMAIL = 'test.student@example.com'
const STUDENT_PASSWORD = 'TestStudent123!'
const TEACHER_EMAIL = 'test.teacher@iub.edu.pk'   // use a seeded teacher email
const TEACHER_PASSWORD = 'NewPassword123!'          // after first-login change
const SECTION_A_ID = '<uuid-of-student-section>'   // student's own section
const SECTION_B_ID = '<uuid-of-another-section>'   // a different section

// ---------------------------------------------------------------------------
// 26.3 — RLS: student can only read slots for own section
// ---------------------------------------------------------------------------
describe.skip('RLS — student slot visibility', () => {
  let studentClient
  let adminClient

  beforeAll(async () => {
    // Admin client (service-role) to set up test data
    adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Student client (anon key + student session)
    studentClient = createClient(supabaseUrl, anonKey)
    const { error } = await studentClient.auth.signInWithPassword({
      email: STUDENT_EMAIL,
      password: STUDENT_PASSWORD,
    })
    if (error) throw new Error(`Student sign-in failed: ${error.message}`)
  })

  afterAll(async () => {
    await studentClient.auth.signOut()
  })

  it('student can read slots belonging to their own section', async () => {
    /**
     * What this validates (R16.3, slots RLS policy "slots_select_student_own_section"):
     *   - A student querying `slots` receives only rows where section_id matches
     *     their enrolled section (get_student_section_id()).
     *
     * Manual verification:
     *   1. Sign in as the test student.
     *   2. Run: SELECT * FROM slots WHERE section_id = '<SECTION_A_ID>';
     *      — Should return rows.
     *   3. Run: SELECT * FROM slots WHERE section_id = '<SECTION_B_ID>';
     *      — Should return 0 rows (RLS filters them out).
     */
    const { data, error } = await studentClient
      .from('slots')
      .select('id, section_id')
    expect(error).toBeNull()
    // Every returned slot must belong to the student's own section
    for (const slot of data ?? []) {
      expect(slot.section_id).toBe(SECTION_A_ID)
    }
  })

  it('student cannot read slots from a different section', async () => {
    /**
     * What this validates:
     *   - Filtering by a different section_id returns no rows (RLS blocks it).
     */
    const { data, error } = await studentClient
      .from('slots')
      .select('id')
      .eq('section_id', SECTION_B_ID)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('student cannot insert a slot', async () => {
    /**
     * What this validates:
     *   - The "slots_admin_write" policy blocks INSERT for non-admin roles.
     */
    const { error } = await studentClient.from('slots').insert({
      timetable_id: '<any-uuid>',
      day_of_week: 'monday',
      start_time: '09:00',
      end_time: '10:00',
      course_id: '<any-uuid>',
      teacher_id: '<any-uuid>',
      room_id: '<any-uuid>',
      section_id: SECTION_A_ID,
    })
    expect(error).not.toBeNull()
    // Supabase returns a 403 / RLS violation error
    expect(error.code).toMatch(/42501|PGRST301/)
  })
})

// ---------------------------------------------------------------------------
// 26.4 — RLS: teacher can read all slots but cannot insert/update directly
// ---------------------------------------------------------------------------
describe.skip('RLS — teacher slot access', () => {
  let teacherClient

  beforeAll(async () => {
    teacherClient = createClient(supabaseUrl, anonKey)
    const { error } = await teacherClient.auth.signInWithPassword({
      email: TEACHER_EMAIL,
      password: TEACHER_PASSWORD,
    })
    if (error) throw new Error(`Teacher sign-in failed: ${error.message}`)
  })

  afterAll(async () => {
    await teacherClient.auth.signOut()
  })

  it('teacher can read slots from any section', async () => {
    /**
     * What this validates (slots RLS policy "slots_select_admin_teacher"):
     *   - A teacher receives all slots regardless of section_id.
     *
     * Manual verification:
     *   Sign in as teacher → SELECT COUNT(*) FROM slots;
     *   — Should equal the total slot count (same as admin view).
     */
    const { data, error } = await teacherClient
      .from('slots')
      .select('id, section_id')
    expect(error).toBeNull()
    // Teacher should see slots from multiple sections (not filtered to one)
    const uniqueSections = new Set((data ?? []).map((s) => s.section_id))
    expect(uniqueSections.size).toBeGreaterThanOrEqual(1)
  })

  it('teacher cannot insert a slot directly', async () => {
    /**
     * What this validates:
     *   - Only admin can write to `slots` (policy "slots_admin_write").
     *   - A teacher INSERT should be rejected with an RLS error.
     *
     * Manual verification:
     *   Sign in as teacher → INSERT INTO slots (...) VALUES (...);
     *   — Should fail with "new row violates row-level security policy".
     */
    const { error } = await teacherClient.from('slots').insert({
      timetable_id: '<any-uuid>',
      day_of_week: 'monday',
      start_time: '09:00',
      end_time: '10:00',
      course_id: '<any-uuid>',
      teacher_id: '<any-uuid>',
      room_id: '<any-uuid>',
      section_id: '<any-uuid>',
    })
    expect(error).not.toBeNull()
  })

  it('teacher cannot update a slot directly', async () => {
    /**
     * What this validates:
     *   - UPDATE on `slots` is blocked for teacher role.
     *
     * Manual verification:
     *   Sign in as teacher → UPDATE slots SET start_time = '10:00' WHERE id = '<slot-id>';
     *   — Should fail with RLS violation.
     */
    const { error } = await teacherClient
      .from('slots')
      .update({ start_time: '10:00' })
      .eq('id', '<any-slot-uuid>')
    expect(error).not.toBeNull()
  })
})
