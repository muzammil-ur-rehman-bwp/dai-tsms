-- =============================================================================
-- Migration: 005_fix_profiles_rls_circular_dependency.sql
-- Purpose: Fix circular dependency in profiles RLS policies
-- The profiles_insert_own policy doesn't use get_user_role(), but we need to
-- ensure the SELECT policy works without circular dependencies.
-- =============================================================================

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Create new policies that don't use get_user_role() to avoid circular dependency
-- SELECT: Users can only read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT: Users can insert their own profile (for first-time setup)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- For admin operations (creating profiles for teachers/students), we'll use
-- the service role key in the backend, which bypasses RLS entirely.
