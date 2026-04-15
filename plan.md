# DAI-TSMS — Agentic Implementation Plan

> **Department of Artificial Intelligence — Timetable Scheduling & Management System**
> React + Vite · Supabase · Vercel · OpenAI-compatible LLM
>
> **How to use this document:**
> This is a Kiro agentic prompt. Work through each section in order.
> **Before executing any major step, ask the user for confirmation.**
> If a step requires credentials, UUIDs, or configuration values not present in the
> repository, pause and ask the user to supply them.

---

## Application Overview

DAI-TSMS is a single-page application for the Department of Artificial Intelligence,
Faculty of Computing, The Islamia University of Bahawalpur, Pakistan. It manages
academic timetables for three user roles:

- **Admin** — full control over all data, scheduling, and user management
- **Teacher** — views own schedule, submits and approves slot-swap requests
- **Student** — read-only view of their section's published timetable

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 6 |
| Styling | Tailwind CSS 3 + Inter font |
| Routing | React Router DOM 7 |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| AI | Any OpenAI-compatible LLM via `VITE_LLM_API_URL` |
| CSV parsing | PapaParse |
| Testing | Vitest + Testing Library + fast-check (PBT) |
| Hosting | Vercel (SPA rewrite rule) |

### Environment Variables

```
VITE_SUPABASE_URL        # Supabase project URL
VITE_SUPABASE_ANON_KEY   # Supabase anon/public key
VITE_LLM_API_KEY         # LLM provider API key
VITE_LLM_API_URL         # LLM provider base URL (OpenAI-compatible)
```

### Folder Structure

```
dai-tsms/
├── dist/                        # Vite production build output
├── public/                      # Static assets
├── seed/                        # Seed CSVs + seedRunner.js
│   ├── *.csv                    # Reference data files
│   └── seedRunner.js            # Node.js idempotent seed script
├── src/
│   ├── components/
│   │   ├── ai/                  # AIChatPanel, AIMessage, AIProposalCard
│   │   ├── csv/                 # CSVUploader, CSVSummaryReport
│   │   ├── layout/              # AppShell, Sidebar, Topbar, ProtectedRoute
│   │   ├── swap/                # SwapRequestForm, SwapRequestList
│   │   ├── timetable/           # TimetableGrid, SlotCell, SlotForm, etc.
│   │   └── ui/                  # Badge, ConfirmDialog, ErrorBanner, etc.
│   ├── contexts/                # AuthContext, TimetableContext
│   ├── hooks/                   # useAuth, useAIScheduler, useConflictDetection, useRealtimeSlots
│   ├── integration/             # Integration test stubs (require live Supabase)
│   ├── lib/                     # supabase.js, constants.js, utils.js, csvParsers.js
│   ├── pages/
│   │   ├── admin/               # AdminDashboard, DataManagementPage, TimetableManagementPage,
│   │   │   │                    # TimetableSchedulingPage, SwapRequestsPage
│   │   │   └── entity/          # One page per entity (16 total)
│   │   ├── auth/                # LoginPage, ChangePasswordPage
│   │   ├── student/             # StudentDashboard, StudentTimetablePage
│   │   └── teacher/             # TeacherDashboard, TeacherTimetablePage
│   └── test/                    # Vitest setup file
├── supabase/
│   └── migrations/              # 001_initial_schema.sql
├── .env.example
├── index.html
├── package.json
├── plan.md                      # This file
├── tailwind.config.js
├── vercel.json
├── vite.config.js
└── vitest.config.js
```

---

## Implementation Guide

> **Agent instruction:** Execute one task group at a time. After completing each
> numbered section below, **stop and ask the user to confirm** before proceeding
> to the next section.

---

### Step 1 — Project Scaffolding and Deployment Configuration

**Implements:** Task 1 (R1)

**Confirmation required:** Ask the user for the project directory name and whether
to use npm or another package manager.

1. Initialize the project:
   ```bash
   npm create vite@latest dai-tsms -- --template react
   cd dai-tsms
   ```

2. Install runtime dependencies:
   ```bash
   npm install react-router-dom @supabase/supabase-js papaparse \
     tailwindcss @headlessui/react @heroicons/react
   ```

3. Install dev dependencies:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom \
     fast-check jsdom @vitejs/plugin-react autoprefixer postcss
   ```

4. Configure Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, import in `src/index.css`).

5. Add Inter font via Google Fonts link in `index.html`.

6. Create `vercel.json`:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

7. Configure `vite.config.js` (React plugin, build output to `dist/`).

8. Configure `vitest.config.js` (jsdom environment, setup file at `src/test/setup.js`).

9. Create `.env.example` documenting all four required env vars.

10. Create `src/lib/supabase.js` — Supabase client singleton.

11. Create `src/lib/constants.js` — scheduling window, grid interval, supported durations,
    days of week, custom sort orders.

12. Create `src/lib/utils.js` — grid helpers: `gridIndexToTime`, `timeToGridIndex`,
    `isOnGrid`, `isInSchedulingWindow`, `addMinutes`, `timeDiffMinutes`,
    `generateSectionName`, `validateStudentRegNo`, `sortSections`, `sortStudents`,
    `derivePerSlotDuration`, `detectConflicts`, `splitSlot`, `mergeSlots`, `findFreeWindow`.

13. Update `package.json` scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `seed`.

**Accessibility:** Ensure `index.html` has `lang="en"` on the `<html>` element.
**Security:** Never commit `.env.local` — it is in `.gitignore`.
**Performance:** Vite's default code-splitting is sufficient; no manual chunks needed at this stage.

---

### Step 2 — Supabase Database Schema

**Implements:** Task 2 (R1, R2, R3, R4–R21)

**Confirmation required:** Ask the user for the Supabase project URL and anon key,
and confirm they have access to the SQL Editor.

1. Create a Supabase project and note the URL and anon key.

2. Open the Supabase SQL Editor and run `supabase/migrations/001_initial_schema.sql` in full.
   This single migration creates:
   - All 16 entity tables with constraints
   - `trg_section_name` trigger for auto-generating section names
   - RLS helper functions: `get_user_role()`, `get_teacher_id()`, `get_student_section_id()`
   - RLS policies for all tables (admin/teacher/student roles)
   - `approve_swap_request(swap_id UUID)` RPC for atomic slot exchange
   - `active_period_mutex` trigger for single-active-period enforcement

3. Enable Realtime for the `slots` table:
   - Supabase Dashboard → Database → Replication → `supabase_realtime` publication
   - Add the `slots` table to the publication.

4. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Security:** RLS is enabled on all tables. The anon key is safe to expose in the
frontend because RLS policies enforce data isolation. Never expose the service-role key
in the frontend.

**Performance:** Add indexes on frequently-queried foreign keys if query latency
becomes an issue (e.g., `slots.timetable_id`, `slots.section_id`, `slots.teacher_id`).

---

### Step 3 — Seed Data Script

**Implements:** Task 3 (R2)

**Confirmation required:** Ask the user for the Supabase service-role key (needed
for the seed script to bypass RLS).

1. Create `seed/seedRunner.js` — Node.js script using `@supabase/supabase-js` with
   the service-role key.

2. Implement idempotent upserts for all seed tables in dependency order:
   `academic_years` → `academic_semesters` → `academic_periods` → `disciplines` →
   `programs` → `semester_numbers` → `section_numbers` → `degree_levels` →
   `campuses` → `sections` → `slot_durations` → `teachers` (+ auth users + profiles)

3. For teachers: call Supabase Auth Admin API to create auth users, then insert
   `teachers` and `profiles` records.

4. Add `"seed": "node seed/seedRunner.js"` to `package.json` scripts.

5. Run `npm run seed` and verify all 16 tables are populated.

**Security:** The service-role key must only be used in the seed script (server-side).
Store it in a `.env.seed` file that is gitignored, or pass it as an environment variable.

---

### Step 4 — Authentication and Role Management

**Implements:** Task 4 (R3)

**Confirmation required:** Confirm the admin user has been created manually in
Supabase Auth (or ask for admin credentials to create it).

1. Create `src/contexts/AuthContext.jsx` — session, user, role, first_login_pending state.
2. Create `src/hooks/useAuth.js` — convenience hook.
3. Create `src/pages/auth/LoginPage.jsx` — email + password form.
4. Create `src/pages/auth/ChangePasswordPage.jsx` — mandatory first-login password change.
5. Create `src/components/layout/ProtectedRoute.jsx` — role + first_login_pending guards.
6. Create `src/components/layout/Topbar.jsx`, `Sidebar.jsx`, `AppShell.jsx`.
7. Configure React Router in `src/App.jsx` with all routes.

**Accessibility:** Login form must have associated `<label>` elements and
`aria-describedby` for error messages. Password fields must have `type="password"`.
**Security:** Use `supabase.auth.signInWithPassword()` — never store passwords in state.
Redirect to `/change-password` before any dashboard route if `first_login_pending = true`.

---

### Step 5 — Core Utility Functions and Validation

**Implements:** Task 5 (R5, R6, R9)

1. Implement all utility functions in `src/lib/utils.js` (see Step 1 list).
2. Write property-based tests using fast-check for all utility functions.

**Performance:** `detectConflicts` is called on every slot mutation — keep it O(n)
where n = number of existing slots for the timetable.

---

### Step 6 — Entity Management Pages (Admin)

**Implements:** Tasks 6–13 (R4–R8, R11, R12)

**Confirmation required:** Ask the user to confirm the entity pages to implement
before starting (all 16 are required for the Data Management Page).

For each entity, create a page in `src/pages/admin/entity/`:

| Entity | Page | Operations |
|--------|------|-----------|
| Academic Years | `AcademicYearsPage.jsx` | List, Add |
| Academic Semesters | `AcademicSemestersPage.jsx` | List (read-only) |
| Academic Periods | `AcademicPeriodsPage.jsx` | List, Create, Activate |
| Disciplines | `DisciplinesPage.jsx` | List, Add, Update, Deactivate |
| Programs | `ProgramsPage.jsx` | List, Add, Update, Deactivate |
| Semester Numbers | `SemesterNumbersPage.jsx` | List, Add |
| Section Numbers | `SectionNumbersPage.jsx` | List, Add |
| Degree Levels | `DegreeLevelsPage.jsx` | List, Add, Update, Deactivate |
| Campuses | `CampusesPage.jsx` | List, Add, Update, Deactivate |
| Sections | `SectionsPage.jsx` | List, Create (individual + CSV), Deactivate |
| Teachers | `TeachersPage.jsx` | List, Create, Deactivate |
| Students | `StudentsPage.jsx` | List (CSV upload only), Deactivate |
| Courses | `CoursesPage.jsx` | List, Create (individual + CSV), Update, Deactivate |
| Rooms | `RoomsPage.jsx` | List, Create (individual + CSV), Update, Deactivate |
| Slots | `SlotsPage.jsx` | List (read-only from Data Management) |
| Slot Durations | `SlotDurationsPage.jsx` | List (read-only) |

Also create:
- `src/components/csv/CSVUploader.jsx` — drag-and-drop file input
- `src/components/csv/CSVSummaryReport.jsx` — success/error summary modal
- `src/lib/csvParsers.js` — parser functions for each CSV type
- `src/pages/admin/DataManagementPage.jsx` — 16-card grid with live counts
- `src/pages/admin/AdminDashboard.jsx` — stat widgets
- `src/pages/admin/TimetableManagementPage.jsx` — timetable lifecycle management

**Accessibility:** All form inputs must have `<label>` elements. Tables must have
`<th scope="col">` headers. Modals must trap focus and be dismissible with Escape.
**Security:** Validate all CSV inputs server-side (via Supabase constraints) in
addition to client-side validation.

---

### Step 7 — Timetable Scheduling Engine

**Implements:** Tasks 14–15 (R9, R10, R12, R13, R14)

**Confirmation required:** Ask the user to confirm the scheduling grid design
(08:00–20:00, 15-min rows, day columns for enabled days only).

1. Create `src/hooks/useConflictDetection.js`.
2. Create `src/components/timetable/TimetableGrid.jsx` — 08:00–20:00 grid.
3. Create `src/components/timetable/SlotCell.jsx` — color-coded slot cells.
4. Create `src/components/timetable/SlotForm.jsx` — slot create/edit form.
5. Create `src/components/timetable/ConflictBadge.jsx` — red pulsing indicator.
6. Create `src/components/timetable/TimetableFilters.jsx` — filter bar.
7. Create `src/pages/admin/TimetableSchedulingPage.jsx` — two-panel layout.
8. Implement scheduling days configuration (Mon–Thu always on; Fri–Sun optional).
9. Implement safe-disable flow for extended days (auto-reschedule or confirmation dialog).
10. Implement timetable conversion (split/merge slots for duration changes).

**Accessibility:** Grid cells must have `aria-label` describing the time slot.
Conflict badges must include text (not just color) for screen readers.
**Performance:** Fetch slots once per timetable load; use Realtime for incremental
updates rather than polling.

---

### Step 8 — AI-Powered Scheduling Assistant

**Implements:** Task 16 (R15)

**Confirmation required:** Ask the user for the LLM provider URL and API key,
and confirm the model name to use in the system prompt.

1. Create `src/components/ai/AIChatPanel.jsx` — collapsible sidebar chat.
2. Create `src/components/ai/AIMessage.jsx` — chat message bubbles.
3. Create `src/components/ai/AIProposalCard.jsx` — proposed slot display.
4. Create `src/hooks/useAIScheduler.js` — conversation history, system prompt builder,
   API call to `VITE_LLM_API_URL/chat/completions`.
5. Show config-error banner when `VITE_LLM_API_KEY` or `VITE_LLM_API_URL` is missing.
6. Run conflict detection on all proposed slots before displaying them.

**Security:** The LLM API key is a Vite env var — it will be visible in the browser
bundle. For production, proxy LLM calls through a Vercel Edge Function or Supabase
Edge Function to keep the key server-side.
**Accessibility:** Chat input must have an `aria-label`. Proposal cards must have
descriptive button labels ("Approve slot for CS-301 on Monday 09:00–10:30").

---

### Step 9 — Timetable Views (All Roles)

**Implements:** Task 19 (R17)

1. Create `src/components/timetable/TimetableViewPage.jsx` — shared view component.
2. Implement Section-wise, Teacher-wise, Room-wise, and Day-wise views.
3. Ensure only enabled days are shown for the selected timetable.
4. Filter changes must not trigger a full page reload.

**Accessibility:** View type selector must be keyboard-navigable. Grid must have
appropriate ARIA roles (`role="grid"`, `role="row"`, `role="gridcell"`).

---

### Step 10 — Teacher and Student Dashboards

**Implements:** Tasks 20–22 (R18, R19, R20)

1. Create `src/pages/teacher/TeacherDashboard.jsx` and `TeacherTimetablePage.jsx`.
2. Create `src/pages/student/StudentDashboard.jsx` and `StudentTimetablePage.jsx`.
3. Create `src/components/swap/SwapRequestForm.jsx` and `SwapRequestList.jsx`.
4. Implement swap request submission, approval, and rejection flows.
5. Implement Admin swap request management in `src/pages/admin/SwapRequestsPage.jsx`.
6. Enforce read-only mode for student role (hide all mutation controls).

**Accessibility:** Swap request status changes must be announced via `aria-live`
regions so screen reader users are notified without a page reload.

---

### Step 11 — Data Persistence and Real-Time Updates

**Implements:** Task 18 (R16)

1. Create `src/contexts/TimetableContext.jsx` — active timetable state + slot list.
2. Create `src/hooks/useRealtimeSlots.js` — Supabase Realtime subscription on `slots`.
3. Implement optimistic UI updates for slot creation (roll back on DB error).
4. Verify all slot mutations propagate to connected clients within 2 seconds.

**Performance:** Use `filter: \`timetable_id=eq.\${timetableId}\`` on the Realtime
channel to avoid receiving events for other timetables.

---

### Step 12 — UI Polish and Error Handling

**Implements:** Tasks 23–24 (R20)

1. Apply DAI-TSMS color palette:
   - Primary: `#1E40AF` (blue-800)
   - Secondary: `#7C3AED` (violet-600)
   - Accent: `#059669` (emerald-600)
   - Warning: `#D97706` (amber-600)
   - Danger: `#DC2626` (red-600)

2. Create shared UI components:
   - `src/components/ui/ErrorBanner.jsx` — dismissible page-level errors
   - `src/components/ui/ValidationError.jsx` — inline field errors
   - `src/components/ui/ConfirmDialog.jsx` — reusable confirmation modal
   - `src/components/ui/Badge.jsx` — status badges
   - `src/components/ui/LoadingSkeleton.jsx` — data-fetching skeletons
   - `src/components/ui/EmptyState.jsx` — zero-record illustrations

3. Implement responsive layout (single-column below 768px).
4. Implement slot color-coding (12-color accessible palette, derived from course code hash).
5. Ensure all interactive elements have `aria-label` and minimum 44×44px touch targets.
6. Ensure color is never the sole state indicator (icons + text accompany all colors).

**Accessibility:** Run axe-core or Lighthouse accessibility audit before release.
Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text (WCAG 2.1 AA).

---

### Step 13 — Property-Based and Unit Tests

**Implements:** Task 25 (Testing Strategy)

1. Write property-based tests (fast-check) for all utility functions in `src/lib/utils.js`.
2. Write unit tests for `ProtectedRoute`, `TimetableGrid`, `AIChatPanel`, CSV parsers.
3. Run `npm test` and verify all tests pass.

**Key properties to test:**
- Section name formula correctness (all valid component combinations)
- Student registration number validation (valid accepted, invalid rejected)
- Slot grid alignment (start/end times always on 15-min grid)
- Slot scheduling window (08:00–20:00)
- Conflict detection (teacher, room, section — no false negatives)
- Bifurcation duration preservation (split slots sum to original duration)
- Timetable conversion (split/merge duration preservation)
- Seed script idempotency (running N times produces identical counts)

---

### Step 14 — Integration Tests

**Implements:** Task 26 (Testing Strategy — Integration Tests)

Integration tests are in `src/integration/` and require a live Supabase instance.
They use `describe.skip` so the CI test suite still parses cleanly.

See `src/integration/README.md` for setup instructions.

Test files:
- `seed.test.js` — record counts and teacher auth users
- `rls.test.js` — RLS policies for student and teacher roles
- `realtime.test.js` — Realtime propagation latency
- `timetable.test.js` — publish guard and atomic swap RPC
- `deployment.test.js` — end-to-end deployment checklist

---

### Step 15 — Deployment

**Implements:** Task 28 (R1, end-to-end verification)

**Confirmation required:** Ask the user to confirm the Vercel project name and
whether to use the Vercel CLI or the GitHub integration for deployment.

1. Run `npm run build` and verify a clean production bundle:
   ```bash
   npm run build
   # Expected: dist/ created, no errors, no warnings about missing env vars
   ```

2. Deploy to Vercel:
   ```bash
   npx vercel --prod
   # Or connect the GitHub repo to Vercel for automatic deployments
   ```

3. Configure all four environment variables in the Vercel project dashboard.

4. Verify client-side routing (navigate directly to `/admin` — should not 404).

5. Run the seed script against the production Supabase instance:
   ```bash
   SUPABASE_URL=<prod-url> SUPABASE_SERVICE_ROLE_KEY=<prod-key> npm run seed
   ```

6. Complete the manual verification checklist in `src/integration/deployment.test.js`.

**Security checklist before going live:**
- [ ] No API keys or secrets in source code
- [ ] All four env vars set in Vercel (not just locally)
- [ ] RLS enabled on all Supabase tables (verify in Dashboard → Authentication → Policies)
- [ ] Service-role key is NOT in any frontend file
- [ ] LLM API key proxied through a server-side function (recommended for production)
- [ ] `vercel.json` rewrite rule is present

**Performance checklist:**
- [ ] Vite build produces a bundle < 500 KB gzipped (check with `npx vite-bundle-visualizer`)
- [ ] Supabase queries use `.select('specific,columns')` rather than `select('*')` where possible
- [ ] Realtime channels are unsubscribed when components unmount

---

## Appendix: Key Business Rules Summary

| Rule | Description |
|------|-------------|
| Section naming | `{disc_short}-{sem_name}-{sec_num}{prog_code}` e.g. BSARIN-1ST-1M |
| Student reg no | `{sem_code}{year_short}{campus_short}ARIN{deg_num}{prog_code}{6-digits}` |
| Slot grid | 15-minute granularity, 08:00–20:00 window |
| Slot durations | {30, 45, 60, 75, 90} minutes only |
| Per-slot duration | `contact_hours_minutes ÷ 2` must be in supported set |
| Weekly slots | Exactly 2 slots per course-section assignment |
| Scheduling days | Mon–Thu always on; Fri–Sun optional per timetable |
| Conflict types | Teacher, Room, Section (same day, overlapping time) |
| Active period | Only one `academic_periods.is_active = true` at a time |
| Publish guard | All assignments must have 2 slots before publish |
| Swap atomicity | `approve_swap_request` RPC exchanges both slots in one transaction |
| First login | Teachers must change password before accessing any dashboard route |
| RLS — student | Can only read slots for their own section |
| RLS — teacher | Can read all slots; cannot insert/update slots directly |
| RLS — admin | Full read/write access to all tables |
