-- =============================================================================
-- Migration: 003_disable_timetables_rls.sql
-- Purpose: Temporarily disable RLS on timetables to debug 406 errors
-- The 406 errors suggest an RLS policy issue. This migration disables RLS
-- to verify if that's the root cause.
-- =============================================================================

-- Disable RLS on timetables table
ALTER TABLE timetables DISABLE ROW LEVEL SECURITY;

-- Note: This is a temporary debugging measure. RLS should be re-enabled
-- after the issue is resolved.
