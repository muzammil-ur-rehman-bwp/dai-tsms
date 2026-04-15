# Supabase Setup — DAI-TSMS

## Running the Migration

The entire database schema is contained in a single file:

```
supabase/migrations/001_initial_schema.sql
```

### Steps

1. Open your [Supabase dashboard](https://supabase.com/dashboard).
2. Select your project (`nryjxluuseawwweczouj`).
3. Go to **SQL Editor** (left sidebar).
4. Click **New query**.
5. Copy the full contents of `supabase/migrations/001_initial_schema.sql` and paste them into the editor.
6. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).

The script is idempotent — it uses `CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, and `DROP TRIGGER IF EXISTS` so it can be re-run safely without errors.

---

## What the Migration Creates

| Object | Type | Description |
|---|---|---|
| `academic_years` | Table | Reference years (2021–2030) |
| `academic_semesters` | Table | SPRING / SUMMER / FALL |
| `academic_periods` | Table | Year + semester combos; one active at a time |
| `disciplines` | Table | Degree programmes (BSARIN, MSARIN, etc.) |
| `programs` | Table | Morning / Evening / Weekend |
| `semester_numbers` | Table | 1ST–8TH |
| `section_numbers` | Table | A–J |
| `degree_levels` | Table | BS / M.Sc / MS / PhD / BSAD |
| `campuses` | Table | Bahawalpur / Rahim Yar Khan / Bahawalnagar |
| `sections` | Table | Auto-named from discipline + semester + section + program |
| `teachers` | Table | Linked to `auth.users` |
| `profiles` | Table | Role + first-login flag per auth user |
| `students` | Table | Linked to `auth.users`, belongs to a section |
| `courses` | Table | With contact hours and per-slot duration validation |
| `rooms` | Table | With capacity check |
| `slot_durations` | Table | Lookup: 30, 45, 60, 75, 90 minutes |
| `timetables` | Table | One per academic period; draft/published/archived |
| `course_section_assignments` | Table | Course → section → teacher mapping per timetable |
| `slots` | Table | Individual scheduled slots with time grid constraints |
| `swap_requests` | Table | Teacher-initiated slot swap workflow |
| `trg_section_name` | Trigger | Auto-generates `sections.name` on INSERT/UPDATE |
| `active_period_mutex` | Trigger | Ensures only one `academic_periods.is_active = true` |
| `get_user_role()` | Function | Returns role of current auth user |
| `get_teacher_id()` | Function | Returns `teachers.id` for current auth user |
| `get_student_section_id()` | Function | Returns `section_id` for current auth user |
| `approve_swap_request(uuid)` | RPC | Atomically swaps teacher_id between two slots |
| RLS policies | Policies | Per-table, per-role access control |

---

## After Running the Migration

Run the seed script to populate all reference data and create teacher auth accounts:

```bash
npm run seed
```

> The seed script requires a `SUPABASE_SERVICE_ROLE_KEY` environment variable (not the anon key). Get it from **Supabase dashboard → Settings → API → service_role key**.

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API → anon/public key |
| `VITE_LLM_API_KEY` | Your LLM provider |
| `VITE_LLM_API_URL` | Your LLM provider base URL (OpenAI-compatible) |
