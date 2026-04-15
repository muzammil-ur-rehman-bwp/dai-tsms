-- =============================================================================
-- Migration: 004_reenable_timetables_rls.sql
-- Purpose: Re-enable RLS on timetables with proper policies
-- The 406 errors were caused by using .single() on empty result sets.
-- This migration re-enables RLS with proper policies.
-- =============================================================================

-- Re-enable RLS on timetables table
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;

-- Ensure the SELECT policy allows all authenticated users
-- (This should already exist from migration 001, but we're being explicit)
DROP POLICY IF EXISTS "timetables_select_authenticated" ON timetables;

CREATE POLICY "timetables_select_authenticated"
  ON timetables FOR SELECT
  TO authenticated USING (true);

-- Ensure the admin write policy is in place
DROP POLICY IF EXISTS "timetables_admin_write" ON timetables;

CREATE POLICY "timetables_admin_write"
  ON timetables FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
