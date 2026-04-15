-- =============================================================================
-- Migration: 008_check_profiles_table.sql
-- Purpose: Verify profiles table structure and data
-- =============================================================================

-- This migration will help us understand the state of the profiles table
-- Run these queries manually in the Supabase SQL Editor to debug

-- Check if profiles table exists and has records
-- SELECT COUNT(*) as total_profiles FROM profiles;

-- Check the admin profile specifically
-- SELECT id, role, first_login_pending FROM profiles WHERE role = 'admin';

-- Check all profiles
-- SELECT id, role, first_login_pending FROM profiles LIMIT 10;

-- Check if there are any NULL values causing issues
-- SELECT id, role, first_login_pending FROM profiles WHERE id IS NULL OR role IS NULL;

-- Check the table structure
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Check RLS policies on profiles
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Note: These are debug queries. Uncomment and run them manually in Supabase SQL Editor.
