-- =============================================================================
-- Migration: 009_create_profile_fetch_function.sql
-- Purpose: Create a PostgreSQL function to fetch user profile
-- This function bypasses RLS issues by using SECURITY DEFINER
-- =============================================================================

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_user_profile(uuid);

-- Create a function that fetches the user's profile
-- This function uses SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_user_profile(user_id uuid)
RETURNS TABLE (role text, first_login_pending boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role, first_login_pending
  FROM profiles
  WHERE id = user_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profile(uuid) TO authenticated;

-- Note: This function can be called from the frontend like:
-- const { data } = await supabase.rpc('get_user_profile', { user_id: authUser.id })
