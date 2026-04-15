# Implementation Tasks
## DAI-TSMS — Department of Artificial Intelligence Timetable Scheduling & Management System

---

## Task 1: Project Scaffolding and Deployment Configuration

> **Implements:** R1 (Deployment and Hosting)

- [x] 1.1 Initialize React + Vite project with `npm create vite@latest dai-tsms -- --template react`
- [x] 1.2 Install core dependencies: `react-router-dom`, `@supabase/supabase-js`, `papaparse`, `tailwindcss`, `@headlessui/react`, `@heroicons/react`
- [x] 1.3 Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `jsdom`
- [x] 1.4 Configure TailwindCSS (`tailwind.config.js`, `postcss.config.js`, import in `index.css`)
- [x] 1.5 Configure Inter font via Google Fonts in `index.html`
- [x] 1.6 Create `vercel.json` with SPA rewrite rule: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
- [x] 1.7 Create `vite.config.js` with React plugin and build output to `dist/`
- [x] 1.8 Create `vitest.config.js` with jsdom environment and setup files
- [x] 1.9 Create `.env.example` documenting all four required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LLM_API_KEY`, `VITE_LLM_API_URL`
- [x] 1.10 Create `src/lib/supabase.js` — Supabase client singleton reading from `import.meta.env`
- [x] 1.11 Create `src/lib/constants.js` — slot grid constants, sort orders, supported durations `{30,45,60,75,90}`
- [x] 1.12 Create `src/lib/utils.js` — grid helpers: `gridIndexToTime`, `timeToGridIndex`, `isOnGrid`, `isInSchedulingWindow`, `addMinutes`, `timeDiffMinutes`
- [x] 1.13 Update `package.json` scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `seed`
- [x] 1.14 Verify `vite build` produces a clean production bundle with no errors

---

## Task 2: Supabase Database Schema

> **Implements:** R1, R2 (Seed Data Initialization), R3 (Auth), R4–R21 (all entities)

- [x] 2.1 Create Supabase project and note URL + anon key
- [x] 2.2 Create migration: `academic_years` table (id, name, short_name, created_at)
- [x] 2.3 Create migration: `academic_semesters` table (id, name, short_name, short_code, is_system_defined, created_at)
- [x] 2.4 Create migration: `academic_periods` table (id, name, academic_year_id FK, academic_semester_id FK, is_active, created_at, UNIQUE constraint on year+semester)
- [x] 2.5 Create migration: `disciplines` table (id, name, short_name, sort_order, is_active, created_at)
- [x] 2.6 Create migration: `programs` table (id, name, short_name, short_code, sort_order, is_active, created_at)
- [x] 2.7 Create migration: `semester_numbers` table (id, name, number, created_at)
- [x] 2.8 Create migration: `section_numbers` table (id, name, number, created_at)
- [x] 2.9 Create migration: `degree_levels` table (id, name, short_name, number, is_active, created_at)
- [x] 2.10 Create migration: `campuses` table (id, name, short_name, sort_order, is_active, created_at)
- [x] 2.11 Create migration: `sections` table (id, name, discipline_id FK, semester_number_id FK, section_number_id FK, program_id FK, is_active, created_at, UNIQUE on 4 FKs)
- [x] 2.12 Create PostgreSQL trigger `trg_section_name` — auto-generates `sections.name` from component parts on INSERT/UPDATE
- [x] 2.13 Create migration: `teachers` table (id, auth_user_id FK auth.users, name, designation, expertise, mobile_number, email UNIQUE, is_active, created_at)
- [x] 2.14 Create migration: `profiles` table (id FK auth.users, role CHECK IN admin/teacher/student, first_login_pending BOOLEAN DEFAULT true, created_at)
- [x] 2.15 Create migration: `students` table (id, auth_user_id FK auth.users, registration_no UNIQUE, section_id FK, is_active, created_at)
- [x] 2.16 Create migration: `courses` table (id, name, code UNIQUE, credit_hours, contact_hours_minutes CHECK % 15 = 0, is_active, created_at, CHECK constraint valid_per_slot_duration)
- [x] 2.17 Create migration: `rooms` table (id, name UNIQUE, capacity CHECK > 0, is_active, created_at)
- [x] 2.18 Create migration: `slot_durations` table (id, minutes CHECK IN 30/45/60/75/90, created_at)
- [x] 2.19 Create migration: `timetables` table (id, name, academic_period_id FK UNIQUE, status CHECK draft/published/archived, day_monday–day_sunday BOOLEAN columns, created_at)
- [x] 2.20 Create migration: `course_section_assignments` table (id, timetable_id FK, course_id FK, section_id FK, teacher_id FK, created_at, UNIQUE on timetable+course+section)
- [x] 2.21 Create migration: `slots` table (id, timetable_id FK, assignment_id FK, day_of_week CHECK, start_time, end_time, course_id FK, teacher_id FK, room_id FK, section_id FK, created_at, CHECK constraints for grid alignment and window)
- [x] 2.22 Create migration: `swap_requests` table (id, requesting_slot_id FK, target_slot_id FK, requesting_teacher_id FK, target_teacher_id FK, status CHECK, admin_override, created_at)
- [x] 2.23 Create RLS helper functions: `get_user_role()`, `get_teacher_id()`, `get_student_section_id()`
- [x] 2.24 Enable RLS on all tables and create per-table policies for admin/teacher/student roles
- [x] 2.25 Create `approve_swap_request(swap_id UUID)` PostgreSQL RPC function for atomic slot exchange
- [x] 2.26 Create `active_period_mutex` trigger — ensures only one `academic_periods.is_active = true` at a time

---

## Task 3: Seed Data Script

> **Implements:** R2 (Seed Data Initialization)

- [x] 3.1 Create `seed/seedRunner.js` — Node.js script using Supabase service-role key
- [x] 3.2 Implement idempotent upsert for `academic_years` from `seed/academic_years.csv` (2021–2030)
- [x] 3.3 Implement idempotent upsert for `academic_semesters` from `seed/academic_semesters.csv` (SPRING/SUMMER/FALL with short names and codes)
- [x] 3.4 Implement idempotent upsert for `academic_periods` from `seed/academic_periods.csv` (2026 SPRING active)
- [x] 3.5 Implement idempotent upsert for `disciplines` from `seed/disciplines.csv` with sort_order (BSARIN=1, BSADARIN=2, MSARIN=3, PHARIN=4)
- [x] 3.6 Implement idempotent upsert for `programs` from `seed/programs.csv` with sort_order (M=1, E=2, W=3)
- [x] 3.7 Implement idempotent upsert for `semester_numbers` from `seed/semester_numbers.csv` (1ST–8TH)
- [x] 3.8 Implement idempotent upsert for `section_numbers` from `seed/section_numbers.csv` (A–J)
- [x] 3.9 Implement idempotent upsert for `degree_levels` from `seed/degree_levels.csv`
- [x] 3.10 Implement idempotent upsert for `campuses` from `seed/campuses.csv` with sort_order (B=1, R=2, N=3)
- [x] 3.11 Implement idempotent upsert for `sections` from `seed/sections.csv`
- [x] 3.12 Implement idempotent upsert for `slot_durations` (30, 45, 60, 75, 90)
- [x] 3.13 Implement teacher seeding from `seed/teachers.csv`: upsert teacher record + create Supabase Auth user + insert profile with role=teacher, first_login_pending=true
- [x] 3.14 Verify seed script is idempotent — running twice produces identical record counts
- [x] 3.15 Add `npm run seed` script to `package.json`


---

## Task 4: Authentication and Role Management

> **Implements:** R3 (User Authentication and Role Management)

- [x] 4.1 Create `src/contexts/AuthContext.jsx` — provides session, user, role, first_login_pending state via Supabase Auth listener
- [x] 4.2 Create `src/hooks/useAuth.js` — convenience hook consuming AuthContext
- [x] 4.3 Create `src/pages/auth/LoginPage.jsx` — email + password form, Supabase signInWithPassword, error display
- [x] 4.4 Create `src/pages/auth/ChangePasswordPage.jsx` — new password form, updates Supabase Auth password, sets `profiles.first_login_pending = false`
- [x] 4.5 Create `src/components/layout/ProtectedRoute.jsx` — checks auth session, role match, and first_login_pending; redirects appropriately
- [x] 4.6 Configure React Router in `src/App.jsx` with all routes wrapped in appropriate ProtectedRoute guards
- [x] 4.7 Implement first-login redirect: after login, if `first_login_pending = true` → navigate to `/change-password` and block all other routes
- [x] 4.8 Implement role-based redirect on login: admin → `/admin`, teacher → `/teacher`, student → `/student`
- [x] 4.9 Handle deactivated account: check `is_active` on profiles/teachers/students after login; show "Account deactivated" message and sign out
- [x] 4.10 Create `src/components/layout/Topbar.jsx` — displays user name, role badge, logout button
- [x] 4.11 Create `src/components/layout/Sidebar.jsx` — role-specific navigation links, collapsible on mobile
- [x] 4.12 Create `src/components/layout/AppShell.jsx` — wraps Sidebar + Topbar + main content area

---

## Task 5: Core Utility Functions and Validation

> **Implements:** R5 (Section Naming), R6 (Student ID Validation), R9 (Slot Granularity)

- [x] 5.1 Implement `generateSectionName(discShort, semName, secName, progCode)` in `src/lib/utils.js`
- [x] 5.2 Implement `validateStudentRegNo(regNo)` — regex `^[SF][0-9]{2}[BRN]ARIN[1-9][0-9]?[MEW][0-9]{6}$`
- [x] 5.3 Implement `sortSections(sections)` — custom sort: discipline sort_order → semester name A-Z → program sort_order → section number A-Z
- [x] 5.4 Implement `sortStudents(students)` — custom sort: semester code (S<F) → year A-Z → campus sort_order → degree level number → program sort_order → last 6 digits
- [x] 5.5 Implement `derivePerSlotDuration(contactHoursMinutes)` — returns `contactHoursMinutes / 2`, validates result ∈ {30,45,60,75,90}
- [x] 5.6 Implement `isOnGrid(time)` — checks minutes component ∈ {0,15,30,45}
- [x] 5.7 Implement `isInSchedulingWindow(startTime, endTime)` — checks start >= 08:00 and end <= 20:00
- [x] 5.8 Implement `detectConflicts(newSlot, existingSlots)` — returns array of {type: teacher|room|section, conflictingSlot}
- [x] 5.9 Implement `splitSlot(sourceSlot, targetDurationMinutes)` — returns array of split slots
- [x] 5.10 Implement `mergeSlots(sourceSlots, targetDurationMinutes)` — merges consecutive same-assignment slots
- [x] 5.11 Implement `findFreeWindow(slot, enabledDays, existingSlots)` — finds first conflict-free time window for auto-reschedule
- [x] 5.12 Write property-based tests for all utility functions using fast-check (Properties 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21)

---

## Task 6: Academic Period Management

> **Implements:** R4 (Academic Period Management)

- [x] 6.1 Create `src/pages/admin/entity/AcademicYearsPage.jsx` — list, add new year, view seeded years 2021–2030
- [x] 6.2 Create `src/pages/admin/entity/AcademicSemestersPage.jsx` — read-only list of SPRING/SUMMER/FALL with system-defined badge
- [x] 6.3 Create `src/pages/admin/entity/AcademicPeriodsPage.jsx` — list periods, create new (select year + semester), activate/deactivate
- [x] 6.4 Implement active period mutex in UI: activating a period shows confirmation that current active period will be deactivated
- [x] 6.5 Implement duplicate Academic_Period prevention: show descriptive error if year+semester combo already exists
- [x] 6.6 Display `is_active` badge on Academic Periods list (Active / Inactive)

---

## Task 7: Section Naming and Management

> **Implements:** R5 (Section Naming and Sorting)

- [x] 7.1 Create `src/pages/admin/entity/SectionsPage.jsx` — list sections (sorted by custom order), create individual section via dropdowns
- [x] 7.2 Implement section creation form: dropdowns for Discipline, Semester Number, Section Number, Program — auto-preview generated name
- [x] 7.3 Implement bulk section CSV upload in SectionsPage — parse rows, derive names, validate uniqueness, show summary report
- [x] 7.4 Implement section deactivation with confirmation dialog
- [x] 7.5 Verify section list always renders in custom sort order (discipline → semester → program → section number)

---

## Task 8: Teacher Management

> **Implements:** R7 (Entity Management — Category A, Teachers)

- [x] 8.1 Create `src/pages/admin/entity/TeachersPage.jsx` — list teachers (seeded 12), view details, deactivate
- [x] 8.2 Implement individual teacher creation form: name, designation, expertise, mobile, email, initial password
- [x] 8.3 On teacher creation, call Supabase Auth admin API to create auth user + insert profile with role=teacher, first_login_pending=true
- [x] 8.4 Implement teacher deactivation: set `teachers.is_active = false` and disable Supabase Auth user

---

## Task 9: Student Management

> **Implements:** R6 (Student ID Naming), R7 (Entity Management — Category B, Students)

- [x] 9.1 Create `src/pages/admin/entity/StudentsPage.jsx` — list students (sorted by custom order), bulk CSV upload
- [x] 9.2 Implement student CSV upload: parse `registration_no` + `section_name` columns, validate registration_no pattern, resolve section by name, insert records
- [x] 9.3 Display validation error for registration numbers not matching pattern `^[SF][0-9]{2}[BRN]ARIN[1-9][0-9]?[MEW][0-9]{6}$`
- [x] 9.4 Implement student deactivation
- [x] 9.5 Verify student list renders in custom sort order

---

## Task 10: Course and Room Management

> **Implements:** R7 (Entity Management — Category B, Courses and Rooms)

- [x] 10.1 Create `src/pages/admin/entity/CoursesPage.jsx` — list courses, individual create/edit form, bulk CSV upload
- [x] 10.2 Course form fields: name, code, credit_hours, contact_hours_minutes; auto-display derived per-slot duration and weekly slot count (2)
- [x] 10.3 Validate `contact_hours_minutes` is multiple of 15 and derived duration ∈ {30,45,60,75,90}; show descriptive error if invalid
- [x] 10.4 Implement course CSV upload: columns `course_code`, `name`, `credit_hours`, `contact_hours_minutes`; validate each row; show summary report
- [x] 10.5 Create `src/pages/admin/entity/RoomsPage.jsx` — list rooms, individual create/edit form, bulk CSV upload
- [x] 10.6 Room form fields: name, capacity (positive integer)
- [x] 10.7 Implement room CSV upload: columns `name`, `capacity`; validate each row; show summary report


---

## Task 11: Remaining Reference Data Entity Pages

> **Implements:** R7 (Entity Management — Category A, remaining seed entities)

- [x] 11.1 Create `src/pages/admin/entity/DisciplinesPage.jsx` — list, add, update, deactivate disciplines
- [x] 11.2 Create `src/pages/admin/entity/ProgramsPage.jsx` — list, add, update, deactivate programs
- [x] 11.3 Create `src/pages/admin/entity/SemesterNumbersPage.jsx` — list seeded 1ST–8TH, add new values
- [x] 11.4 Create `src/pages/admin/entity/SectionNumbersPage.jsx` — list seeded A–J, add new values
- [x] 11.5 Create `src/pages/admin/entity/DegreeLevelsPage.jsx` — list, add, update, deactivate degree levels
- [x] 11.6 Create `src/pages/admin/entity/CampusesPage.jsx` — list, add, update, deactivate campuses
- [x] 11.7 Create `src/pages/admin/entity/SlotDurationsPage.jsx` — read-only list of supported durations (30, 45, 60, 75, 90)

---

## Task 12: CSV Upload Infrastructure

> **Implements:** R7 (CSV uploads), R11 (Scheduling via CSV)

- [x] 12.1 Create `src/components/csv/CSVUploader.jsx` — file input, drag-and-drop, triggers PapaParse on file select
- [x] 12.2 Create `src/components/csv/CSVSummaryReport.jsx` — modal showing success count, skipped rows with row numbers and error messages
- [x] 12.3 Create `src/lib/csvParsers.js` — parser functions for each CSV type: students, courses, rooms, scheduling assignments
- [x] 12.4 Implement shared CSV validation pipeline: check required columns present, validate field formats, resolve entity references, check duplicates
- [x] 12.5 Implement scheduling CSV upload (`course_code`, `section_code`, `teacher_code`) — validates all references exist and are active, creates `course_section_assignments` records, prevents duplicates

---

## Task 13: Admin Page Structure and Data Management Dashboard

> **Implements:** R8 (Admin Page Structure)

- [x] 13.1 Create `src/pages/admin/DataManagementPage.jsx` — 16-card grid layout (Academic Years, Academic Semesters, Academic Periods, Disciplines, Programs, Semester Numbers, Section Numbers, Degree Levels, Campuses, Sections, Teachers, Students, Courses, Rooms, Slots, Slot Durations)
- [x] 13.2 Each card shows entity name, record count (live from Supabase), and navigates to `/admin/data/:entity` on click
- [x] 13.3 Create `src/pages/admin/TimetableManagementPage.jsx` — lists all timetables with Academic Period, status badge (Draft/Published/Archived), and action buttons (View, Duplicate, Convert, Publish, Archive)
- [x] 13.4 Implement Duplicate action: prompt Admin to select new Academic Period, create copy of timetable with all slots
- [x] 13.5 Implement Archive action: set timetable status to `archived`
- [x] 13.6 Implement Publish action: validate all course-section assignments have 2 slots; block and show incomplete list if not; set status to `published` if valid
- [x] 13.7 Create `src/pages/admin/AdminDashboard.jsx` — stat widgets: total sections, teachers, students, rooms, active timetable status, pending swap requests count
- [x] 13.8 Wire up admin routing: `/admin` → AdminDashboard, `/admin/data` → DataManagementPage, `/admin/data/:entity` → dynamic entity page, `/admin/timetables` → TimetableManagementPage, `/admin/timetables/:id` → TimetableSchedulingPage
- [x] 13.9 Implement Create New Timetable action: prompt Admin to select an Academic Period; auto-generate timetable name as `{year} {semester} Timetable`; enforce one active timetable per Academic Period (R4.6, R4.7, R4.8, R4.9)
- [x] 13.10 Implement Conflict Report view within TimetableManagementPage or TimetableSchedulingPage: list all current conflicts in a timetable with conflicting slot details; mark timetable as conflict-free when all resolved (R12.5, R12.6)

---

## Task 14: Timetable Scheduling Engine

> **Implements:** R9 (Slot Granularity), R10 (Scheduling Days), R12 (Conflict Detection), R13 (Weekly Slot Constraint)

- [x] 14.1 Create `src/hooks/useConflictDetection.js` — wraps `detectConflicts()` utility, queries existing slots from Supabase for the current timetable
- [x] 14.2 Create `src/components/timetable/TimetableGrid.jsx` — renders 08:00–20:00 grid with 15-min rows, day columns for enabled days only
- [x] 14.3 Create `src/components/timetable/SlotCell.jsx` — renders occupied slot (course name, teacher, room), spans correct number of rows based on duration; color-coded by course
- [x] 14.4 Create `src/components/timetable/SlotForm.jsx` — form to create/edit a slot: select course (shows derived duration), teacher, room, day, start time (15-min grid picker); validates window and conflicts before submit
- [x] 14.5 Create `src/components/timetable/ConflictBadge.jsx` — red pulsing indicator on conflicting slot cells
- [x] 14.6 Create `src/components/timetable/TimetableFilters.jsx` — filter bar: Section, Teacher, Room, Day dropdowns
- [x] 14.7 Implement scheduling days configuration panel in TimetableSchedulingPage: checkboxes for Fri/Sat/Sun; Mon–Thu always checked and disabled
- [x] 14.8 Implement safe-disable flow for extended days: query occupied slots on day → attempt auto-reschedule via `findFreeWindow` → show success notification or unresolvable confirmation dialog
- [x] 14.9 Implement weekly slot count enforcement: before slot insert, count existing slots for course+section in timetable; reject if count >= 2
- [x] 14.10 Implement course slot duration validation: verify slot duration matches `course.contact_hours_minutes / 2`
- [x] 14.11 Display course completion status panel in TimetableSchedulingPage: list each course-section assignment with ✓ (2/2 slots) or ✗ (0/2 or 1/2 slots)
- [x] 14.12 Implement slot bifurcation: Admin can split any existing slot into two consecutive equal-duration slots; validate combined duration equals original; enforce grid alignment and scheduling window (R9.6, R9.7)

---

## Task 15: Timetable Conversion (Smart Duplication)

> **Implements:** R14 (Timetable Conversion)

- [x] 15.1 Implement Convert action in TimetableManagementPage: prompt Admin to select new Academic Period and target Slot_Duration
- [x] 15.2 Implement `splitSlot` conversion path: when target duration < source duration, split each slot into consecutive target-duration slots
- [x] 15.3 Implement `mergeSlots` conversion path: when target duration > source duration, merge consecutive same-assignment slots
- [x] 15.4 Run conflict detection on all converted slots before saving; display conflict report if any found
- [x] 15.5 Allow Admin to cancel conversion after reviewing conflicts without saving
- [x] 15.6 On confirmation, persist new timetable with converted slots and auto-generated name from new Academic Period

---

## Task 16: AI-Powered Scheduling Assistant

> **Implements:** R15 (AI-Powered Scheduling Assistant)

- [x] 16.1 Create `src/components/ai/AIChatPanel.jsx` — collapsible sidebar chat UI; disabled state with config-error banner when `VITE_LLM_API_KEY` or `VITE_LLM_API_URL` is missing
- [x] 16.2 Create `src/components/ai/AIMessage.jsx` — chat message bubble (user vs assistant styling)
- [x] 16.3 Create `src/components/ai/AIProposalCard.jsx` — displays proposed slot(s) with course, section, teacher, room, day/time; Approve and Reject buttons
- [x] 16.4 Create `src/hooks/useAIScheduler.js` — manages conversation history, builds system prompt with timetable context, sends requests to `VITE_LLM_API_URL/chat/completions`
- [x] 16.5 Build system prompt: include enabled days, scheduling window, existing slots summary, available courses/sections/teachers/rooms, constraint rules (2 slots/week, duration from contact_hours_minutes, conflict rules)
- [x] 16.6 Parse AI response for structured slot proposals (JSON block in assistant message)
- [x] 16.7 Run conflict detection on each proposed slot before displaying to Admin
- [x] 16.8 On Admin approval, persist approved slots to `slots` table; on rejection, discard proposals
- [x] 16.9 Display descriptive error message if LLM API call fails; do not modify any slots on error
- [x] 16.10 Integrate AIChatPanel into TimetableSchedulingPage sidebar


---

## Task 17: Timetable Scheduling Page

> **Implements:** R8 (Timetable Scheduling Page), R13 (Weekly Slot Constraint display)

- [x] 17.1 Create `src/pages/admin/TimetableSchedulingPage.jsx` — two-panel layout: left = timetable grid + filters + completion status; right = AI chat panel
- [x] 17.2 Load timetable by `:id` param; display timetable name and Academic Period in page header
- [x] 17.3 Implement slot creation via click on empty grid cell: opens SlotForm pre-filled with day and start time
- [x] 17.4 Implement slot edit via click on occupied slot cell: opens SlotForm with existing values
- [x] 17.5 Implement slot delete with confirmation dialog
- [x] 17.6 Display scheduling days configuration panel (checkboxes for Fri/Sat/Sun) with safe-disable flow
- [x] 17.7 Display course completion status panel below grid: each course-section assignment shows slot count (e.g., CS-301 BSARIN-5TH-1M: ✓ 2/2)

---

## Task 18: Data Persistence and Real-Time Updates

> **Implements:** R16 (Data Persistence and Real-Time Updates)

- [x] 18.1 Create `src/contexts/TimetableContext.jsx` — holds active timetable state, slot list, Supabase Realtime subscription
- [x] 18.2 Create `src/hooks/useRealtimeSlots.js` — subscribes to `postgres_changes` on `slots` table filtered by `timetable_id`; updates local state on INSERT/UPDATE/DELETE events
- [x] 18.3 Apply RLS policies verification: write integration test confirming student can only read own section's slots
- [x] 18.4 Ensure all slot mutations (create, update, delete, swap approval) propagate to all connected clients via Realtime within 2 seconds
- [x] 18.5 Implement optimistic UI updates for slot creation: add slot to local state immediately, roll back on DB error

---

## Task 19: Timetable Views (All Roles)

> **Implements:** R17 (Timetable Views)

- [x] 19.1 Create `src/components/timetable/TimetableViewPage.jsx` — shared view component used by all roles; accepts filter type (section/teacher/room/day) and selected value
- [x] 19.2 Implement Section-wise view: dropdown to select section; grid shows all slots for that section grouped by enabled days
- [x] 19.3 Implement Teacher-wise view: dropdown to select teacher; grid shows all slots for that teacher grouped by enabled days
- [x] 19.4 Implement Room-wise view: dropdown to select room; grid shows all slots for that room grouped by enabled days
- [x] 19.5 Implement Day-wise view: dropdown to select day; grid shows all slots for that day across all sections/teachers/rooms
- [x] 19.6 Implement filter change without full page reload (React state update only)
- [x] 19.7 Render time axis 08:00–20:00 with 15-min row granularity in all views
- [x] 19.8 Show only enabled days for the selected timetable in all view layouts
- [x] 19.9 Create navigation tabs or dropdown to switch between the four view types

---

## Task 20: Teacher Dashboard and Timetable Access

> **Implements:** R18 (Teacher Swap Requests), R19 (Student Timetable Access — teacher portion), R20 (Role-Specific Dashboards — teacher)

- [x] 20.1 Create `src/pages/teacher/TeacherDashboard.jsx` — weekly timetable grid (teacher-wise, own schedule), pending swap requests list, quick stats (classes this week, contact hours)
- [x] 20.2 Create `src/pages/teacher/TeacherTimetablePage.jsx` — full timetable view page with all four view types accessible
- [x] 20.3 Default Teacher-wise view to the logged-in teacher's own schedule
- [x] 20.4 Create `src/components/swap/SwapRequestForm.jsx` — select own slot, select target slot from another teacher; client-side conflict pre-check before submission
- [x] 20.5 Create `src/components/swap/SwapRequestList.jsx` — lists pending/approved/rejected swap requests for the current teacher; Approve/Reject buttons for incoming requests
- [x] 20.6 Implement swap request submission: insert `swap_requests` record with status=pending; notify target teacher via Realtime
- [x] 20.7 Implement swap approval: call `approve_swap_request(swap_id)` RPC; update local slot state
- [x] 20.8 Implement swap rejection: update `swap_requests.status = rejected`
- [x] 20.9 Wire up teacher routing: `/teacher` → TeacherDashboard, `/teacher/timetable` → TeacherTimetablePage

---

## Task 21: Student Dashboard and Timetable Access

> **Implements:** R19 (Student Timetable Access), R20 (Role-Specific Dashboards — student)

- [x] 21.1 Create `src/pages/student/StudentDashboard.jsx` — section timetable grid (own section, current active published timetable); "No timetable published" message if none active
- [x] 21.2 Create `src/pages/student/StudentTimetablePage.jsx` — full timetable view page with all four view types accessible (read-only)
- [x] 21.3 Default Section-wise view to the logged-in student's own section
- [x] 21.4 Enforce read-only: hide all create/edit/delete controls for student role
- [x] 21.5 Wire up student routing: `/student` → StudentDashboard, `/student/timetable` → StudentTimetablePage

---

## Task 22: Admin Swap Request Management

> **Implements:** R18 (Teacher Swap Requests — admin oversight)

- [x] 22.1 Add swap requests section to AdminDashboard: count of pending requests with link to full list
- [x] 22.2 Create swap requests management view in admin panel: list all pending/approved/rejected requests with teacher names, slot details, and status
- [x] 22.3 Implement Admin override: Admin can approve any pending swap request (calls same `approve_swap_request` RPC)
- [x] 22.4 Implement Admin cancel: Admin can cancel any pending swap request (sets status=cancelled)

---

## Task 23: UI Polish and Responsive Design

> **Implements:** R20 (Role-Specific Dashboards — visual design)

- [x] 23.1 Apply DAI-TSMS color palette throughout: Primary #1E40AF, Secondary #7C3AED, Accent #059669, Warning #D97706, Danger #DC2626
- [x] 23.2 Apply Inter font family to all text elements
- [x] 23.3 Implement responsive layout: single-column below 768px for all dashboard layouts
- [x] 23.4 Implement timetable grid slot color-coding: each course gets a consistent color derived from its code hash; 12-color accessible palette
- [x] 23.5 Add conflict slot visual indicator: red border + pulsing dot on conflicting cells
- [x] 23.6 Add status badges: Draft (amber), Published (emerald), Archived (slate), Active (emerald), Inactive (slate)
- [x] 23.7 Ensure all interactive elements have `aria-label` attributes
- [x] 23.8 Ensure color is never the sole state indicator (icons + text accompany all color-coded states)
- [x] 23.9 Verify minimum touch target size 44×44px on all buttons and interactive elements
- [x] 23.10 Add loading skeletons for data-fetching states on all list and grid views
- [x] 23.11 Add empty state illustrations/messages for entities with zero records

---

## Task 24: Error Handling and Validation UI

> **Implements:** All requirements — error handling layer

- [x] 24.1 Create `src/components/ui/ErrorBanner.jsx` — dismissible error banner for page-level errors
- [x] 24.2 Create `src/components/ui/ValidationError.jsx` — inline field-level error message component
- [x] 24.3 Create `src/components/ui/ConfirmDialog.jsx` — reusable confirmation modal with title, message, confirm/cancel buttons
- [x] 24.4 Implement all conflict error messages with descriptive text (teacher/room/section conflict details)
- [x] 24.5 Implement all validation error messages (slot window, grid alignment, duration, registration number pattern)
- [x] 24.6 Implement timetable publish blocking UI: modal listing incomplete course-section assignments
- [x] 24.7 Implement safe-disable confirmation dialog for scheduling days with unresolvable slots list
- [x] 24.8 Implement AI Scheduler config-error banner when env vars are missing

---

## Task 25: Property-Based and Unit Tests

> **Implements:** Testing Strategy from Design Document

- [x] 25.1 Write property test: Seed Script Idempotence (Property 1) — run seed N times, verify counts unchanged
- [x] 25.2 Write property test: Section Name Formula Correctness (Property 5) — all valid component combinations
- [x] 25.3 Write property test: Section Sort Order Invariant (Property 6) — generated lists always in correct order
- [x] 25.4 Write property test: Student Registration Number Validation (Property 7) — valid pattern accepted, invalid rejected
- [x] 25.5 Write property test: Student Sort Order Invariant (Property 8)
- [x] 25.6 Write property test: Course Per-Slot Duration Validity (Property 9)
- [x] 25.7 Write property test: Slot Time Grid Alignment (Property 10)
- [x] 25.8 Write property test: Slot Scheduling Window Constraint (Property 11)
- [x] 25.9 Write property test: Slot Duration Validity (Property 12)
- [x] 25.10 Write property test: Bifurcation Duration Preservation (Property 13)
- [x] 25.11 Write property test: Teacher Conflict Detection (Property 15)
- [x] 25.12 Write property test: Room Conflict Detection (Property 16)
- [x] 25.13 Write property test: Section Conflict Detection (Property 17)
- [x] 25.14 Write property test: Weekly Slot Count Constraint (Property 18)
- [x] 25.15 Write property test: Course Slot Duration Consistency (Property 19)
- [x] 25.16 Write property test: Timetable Conversion Split Duration Preservation (Property 20)
- [x] 25.17 Write property test: Timetable Conversion Merge Duration Preservation (Property 21)
- [x] 25.18 Write unit tests for all utility functions in `src/lib/utils.js`
- [x] 25.19 Write unit tests for `ProtectedRoute` — correct role renders children, wrong role redirects
- [x] 25.20 Write unit tests for `TimetableGrid` — renders 08:00–20:00 with 15-min rows
- [x] 25.21 Write unit tests for `AIChatPanel` — disabled when env vars missing, enabled when present
- [x] 25.22 Write unit tests for CSV parsers — valid rows, missing fields, invalid values, duplicate detection

---

## Task 26: Integration Tests

> **Implements:** Testing Strategy — Integration Tests

- [x] 26.1 Integration test: seed script produces correct record counts for all 16 entity tables
- [x] 26.2 Integration test: teacher auth users created with correct emails and roles after seeding
- [x] 26.3 Integration test: RLS — student can only read slots for own section
- [x] 26.4 Integration test: RLS — teacher can read all slots but cannot insert/update directly
- [x] 26.5 Integration test: Realtime — slot change propagates to subscriber within 2 seconds
- [x] 26.6 Integration test: timetable publish blocked when course-section assignments have < 2 slots
- [x] 26.7 Integration test: swap request atomic exchange — both slots updated in single transaction

---

## Task 27: plan.md Output Artifact

> **Implements:** R21 (plan.md Output Artifact)

- [x] 27.1 Create `plan.md` at repository root describing application purpose, tech stack, and folder structure
- [x] 27.2 Structure `plan.md` as a sequenced step-by-step Kiro agentic prompt covering all 26 implementation tasks
- [x] 27.3 Include sections for: project setup, database schema, authentication, entity management, scheduling engine, AI integration, timetable views, swap requests, dashboards, testing, deployment
- [x] 27.4 Specify in `plan.md` that the agent must ask for confirmation or additional information before executing each major step
- [x] 27.5 Include accessibility, security, and performance considerations in each relevant section of `plan.md`

---

## Task 28: Final Integration and Deployment Verification

> **Implements:** R1 (Deployment), end-to-end verification

- [x] 28.1 Run `vite build` and verify clean production bundle with no errors or warnings
- [x] 28.2 Deploy to Vercel and configure all four environment variables in Vercel dashboard
- [x] 28.3 Verify client-side routing works on Vercel (direct URL access returns correct page, not 404)
- [x] 28.4 Run seed script against production Supabase instance; verify all 16 entity tables populated
- [x] 28.5 Verify teacher login with seeded credentials; verify first-login password change flow
- [x] 28.6 Verify Admin can create timetable, assign slots, and publish
- [x] 28.7 Verify Teacher can view own timetable and submit swap request
- [x] 28.8 Verify Student can view own section timetable (read-only)
- [x] 28.9 Verify AI Scheduler chat works with configured LLM provider
- [x] 28.10 Verify Realtime updates propagate across two browser sessions simultaneously
- [x] 28.11 Run full test suite (`npm test`) and verify all property-based and unit tests pass
