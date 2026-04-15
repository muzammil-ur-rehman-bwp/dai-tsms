-- =============================================================================
-- Migration: 002_fix_profiles_rls.sql
-- Purpose: Fix circular dependency in profiles RLS policies
-- The profiles_admin_insert policy uses get_user_role() which queries profiles,
-- causing a deadlock. This migration removes that policy and replaces it with
-- a simpler approach.
-- =============================================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_admin_insert" ON profiles;

-- Create a new policy that allows authenticated users to insert their own profile
-- This is needed for the first-time profile creation flow
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Also allow admins to insert profiles for other users (for teacher/student creation)
-- We'll use a service role bypass for this instead of RLS
-- (Service role key is only used server-side in seed scripts)
