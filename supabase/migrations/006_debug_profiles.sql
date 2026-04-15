-- =============================================================================
-- Migration: 006_debug_profiles.sql
-- Purpose: Debug the profiles table to understand the timeout issue
-- This migration will help us understand what's in the profiles table
-- and why the SELECT query is timing out.
-- =============================================================================

-- Check if profiles table has any records
-- SELECT COUNT(*) as profile_count FROM profiles;

-- Check the structure of profiles table
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- Check if there are any RLS policies causing issues
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Note: This is a debug migration. The actual queries are commented out
-- to avoid errors. Run them manually in the Supabase SQL Editor if needed.
