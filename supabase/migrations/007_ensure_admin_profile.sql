-- =============================================================================
-- Migration: 007_ensure_admin_profile.sql
-- Purpose: Ensure admin profile exists for the admin user
-- This migration will create the admin profile if it doesn't exist.
-- =============================================================================

-- The admin user ID from the seed script
-- This is a hardcoded UUID that should match the admin user created in auth.users
-- If the admin profile doesn't exist, this will create it

-- First, let's check if we can safely insert without conflicts
-- We'll use INSERT ... ON CONFLICT to handle the case where it already exists

INSERT INTO profiles (id, role, first_login_pending)
SELECT id, 'admin', false
FROM auth.users
WHERE email = 'admin@dai-tsms.vercel.app'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  first_login_pending = false;

-- Verify the profile was created
-- SELECT id, role, first_login_pending FROM profiles WHERE role = 'admin';
