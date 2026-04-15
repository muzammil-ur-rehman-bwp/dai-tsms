# Design Document

## Department of Artificial Intelligence — Timetable Scheduling & Management System (DAI-TSMS)

**Developer:** Muzammil Ur Rehman (muzammil.rehman@iub.edu.pk)
**Organization:** Department of Artificial Intelligence, Faculty of Computing, The Islamia University of Bahawalpur, Pakistan
**Tech Stack:** React + Vite, Supabase (Auth + DB + Realtime), Vercel, TailwindCSS, React Router

---

## Overview

DAI-TSMS is a department-specific, role-based timetable scheduling and management system. It replaces manual scheduling with a structured, conflict-aware, AI-assisted workflow. Three roles interact with the system: Admin (full control), Teacher (view + swap requests), and Student (view only). The system is a React + Vite SPA deployed on Vercel, backed entirely by Supabase for authentication, relational data, row-level security, and real-time change propagation.

The Admin is the primary power user. They manage all master data (academic periods, sections, courses, rooms, teachers, students), build timetables slot by slot or via AI chat, and publish schedules for consumption by Teachers and Students. The AI Scheduler integrates with any OpenAI-compatible LLM endpoint via environment variables, enabling natural-language scheduling instructions.

Key design decisions:
- **15-minute granularity** for all time boundaries, scheduling window 08:00–20:00 (48 intervals/day)
- **Exactly 2 slots per course per week**, each of duration `contact_hours_minutes ÷ 2`
- **Conflict detection** at slot creation/modification time (teacher, room, section)
- **Idempotent seed script** pre-loads all reference data and creates Supabase Auth users for teachers
- **Supabase Realtime** propagates slot changes to all connected clients instantly
- **RLS policies** enforce per-role data access at the database layer

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (CDN + Edge)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React + Vite SPA (Static Bundle)             │  │
│  │                                                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │  │
│  │  │  Admin   │  │ Teacher  │  │ Student  │  │  Auth   │  │  │
│  │  │  Pages   │  │  Pages   │  │  Pages   │  │  Pages  │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘  │  │
│  │       └─────────────┴─────────────┴──────────────┘       │  │
│  │                    React Router v6                        │  │
│  │                    TailwindCSS                            │  │
│  │                    Supabase JS Client                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS / WebSocket
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Auth (JWT)  │  │  PostgreSQL  │  │  Realtime (WebSocket)  │ │
│  │  + RLS       │  │  + RLS       │  │  Slot change events    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    OpenAI-compatible API
                              │
┌─────────────────────────────────────────────────────────────────┐
│              External LLM Provider (VITE_LLM_API_URL)           │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Architecture

- **Hosting:** Vercel static deployment
- **Build command:** `vite build`
- **Output directory:** `dist/`
- **Routing:** `vercel.json` rewrites all paths to `/index.html` for client-side routing
- **Environment variables:** Injected via Vercel dashboard (not in source code)

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Required environment variables:
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `VITE_LLM_API_KEY` | LLM provider API key |
| `VITE_LLM_API_URL` | LLM provider base URL (OpenAI-compatible) |

---

## Components and Interfaces

### Frontend Component Hierarchy

```
src/
├── main.jsx                    # Vite entry point
├── App.jsx                     # Router root, auth context provider
├── lib/
│   ├── supabase.js             # Supabase client singleton
│   ├── constants.js            # Slot grid, sort orders, validation patterns
│   └── utils.js                # Section naming, student ID validation, sort helpers
├── contexts/
│   ├── AuthContext.jsx         # User session, role, first-login state
│   └── TimetableContext.jsx    # Active timetable, realtime subscription
├── hooks/
│   ├── useAuth.js
│   ├── useTimetable.js
│   ├── useConflictDetection.js
│   └── useRealtimeSlots.js
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx        # Sidebar + topbar wrapper
│   │   ├── Sidebar.jsx         # Role-specific nav links
│   │   ├── Topbar.jsx          # User info, logout
│   │   └── ProtectedRoute.jsx  # Role-based route guard
│   ├── ui/                     # Reusable primitives (Button, Modal, Table, Badge, etc.)
│   ├── timetable/
│   │   ├── TimetableGrid.jsx   # 08:00–20:00 slot grid, 15-min rows
│   │   ├── SlotCell.jsx        # Individual slot cell (color-coded)
│   │   ├── SlotForm.jsx        # Create/edit slot form
│   │   ├── ConflictBadge.jsx   # Conflict indicator
│   │   └── TimetableFilters.jsx # Section/Teacher/Room/Day filter bar
│   ├── ai/
│   │   ├── AIChatPanel.jsx     # Chat UI sidebar
│   │   ├── AIMessage.jsx       # Chat message bubble
│   │   └── AIProposalCard.jsx  # Proposed slot(s) with approve/reject
│   ├── csv/
│   │   ├── CSVUploader.jsx     # File input + parse trigger
│   │   └── CSVSummaryReport.jsx # Success/error summary
│   └── swap/
│       ├── SwapRequestForm.jsx
│       └── SwapRequestList.jsx
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── ChangePasswordPage.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── DataManagementPage.jsx
│   │   ├── entity/             # One page per entity (AcademicYears, Sections, etc.)
│   │   ├── TimetableManagementPage.jsx
│   │   └── TimetableSchedulingPage.jsx
│   ├── teacher/
│   │   ├── TeacherDashboard.jsx
│   │   └── TeacherTimetablePage.jsx
│   └── student/
│       ├── StudentDashboard.jsx
│       └── StudentTimetablePage.jsx
└── seed/
    └── seedRunner.js           # Idempotent seed script (run once via Node)
```

### Routing Structure

```
/                           → redirect based on role
/login                      → LoginPage (public)
/change-password            → ChangePasswordPage (authenticated, first-login guard)

/admin                      → AdminDashboard
/admin/data                 → DataManagementPage
/admin/data/:entity         → Entity management view (dynamic)
/admin/timetables           → TimetableManagementPage
/admin/timetables/:id       → TimetableSchedulingPage

/teacher                    → TeacherDashboard
/teacher/timetable          → TeacherTimetablePage

/student                    → StudentDashboard
/student/timetable          → StudentTimetablePage
```

All `/admin/*` routes are wrapped in `<ProtectedRoute role="admin" />`.
All `/teacher/*` routes are wrapped in `<ProtectedRoute role="teacher" />`.
All `/student/*` routes are wrapped in `<ProtectedRoute role="student" />`.

### Authentication Flow

```
User visits app
      │
      ▼
AuthContext checks Supabase session
      │
      ├─ No session → /login
      │
      └─ Session exists
            │
            ├─ first_login_pending = true → /change-password (all other routes blocked)
            │
            └─ first_login_pending = false
                  │
                  ├─ role = admin   → /admin
                  ├─ role = teacher → /teacher
                  └─ role = student → /student
```

First-login detection: a `profiles` table column `first_login_pending BOOLEAN DEFAULT true` is set to `false` after the user successfully changes their password on the ChangePasswordPage.

---

## Data Models

### Database Schema (PostgreSQL via Supabase)

All tables use `uuid` primary keys generated by `gen_random_uuid()`. Timestamps use `timestamptz`. RLS is enabled on all tables.

---

#### Reference / Seed Tables

```sql
-- 1. academic_years
CREATE TABLE academic_years (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- e.g. "2026"
  short_name  TEXT NOT NULL UNIQUE,          -- e.g. "26"
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. academic_semesters
CREATE TABLE academic_semesters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,      -- SPRING | SUMMER | FALL
  short_name      TEXT NOT NULL UNIQUE,      -- SP | SU | FA
  short_code      TEXT NOT NULL UNIQUE,      -- S | SU | F
  is_system_defined BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. academic_periods
CREATE TABLE academic_periods (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,  -- auto: "{year_name} {semester_name}"
  academic_year_id      UUID NOT NULL REFERENCES academic_years(id),
  academic_semester_id  UUID NOT NULL REFERENCES academic_semesters(id),
  is_active             BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (academic_year_id, academic_semester_id)
);

-- 4. disciplines
CREATE TABLE disciplines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- e.g. "BS Artificial Intelligence"
  short_name  TEXT NOT NULL UNIQUE,          -- e.g. "BSARIN"
  sort_order  INT NOT NULL,                  -- 1=BSARIN,2=BSADARIN,3=MSARIN,4=PHARIN
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. programs
CREATE TABLE programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- Morning | Evening | Weekend
  short_name  TEXT NOT NULL UNIQUE,          -- MOR | EVE | WEE
  short_code  TEXT NOT NULL UNIQUE,          -- M | E | W
  sort_order  INT NOT NULL,                  -- 1=M, 2=E, 3=W
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 6. semester_numbers
CREATE TABLE semester_numbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- 1ST | 2ND | ... | 8TH
  number      INT NOT NULL UNIQUE,           -- 1–8
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 7. section_numbers
CREATE TABLE section_numbers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- A | B | ... | J
  number      INT NOT NULL UNIQUE,           -- 1–10
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 8. degree_levels
CREATE TABLE degree_levels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- e.g. "Bachelors of Science 16 Years"
  short_name  TEXT NOT NULL UNIQUE,          -- BS | M.Sc | MS | PhD | BSAD
  number      INT NOT NULL UNIQUE,           -- 1 | 2 | 3 | 4 | 7
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 9. campuses
CREATE TABLE campuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,          -- Bahawalpur | Rahim Yar Khan | Bahawalnagar
  short_name  TEXT NOT NULL UNIQUE,          -- B | R | N
  sort_order  INT NOT NULL,                  -- 1=B, 2=R, 3=N
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

#### Core Entity Tables

```sql
-- 10. sections
CREATE TABLE sections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,  -- auto: "{disc_short}-{sem_name}-{sec_num}{prog_code}"
  discipline_id       UUID NOT NULL REFERENCES disciplines(id),
  semester_number_id  UUID NOT NULL REFERENCES semester_numbers(id),
  section_number_id   UUID NOT NULL REFERENCES section_numbers(id),
  program_id          UUID NOT NULL REFERENCES programs(id),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (discipline_id, semester_number_id, section_number_id, program_id)
);

-- 11. teachers (also Supabase Auth users)
CREATE TABLE teachers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID UNIQUE REFERENCES auth.users(id),
  name          TEXT NOT NULL,
  designation   TEXT,
  expertise     TEXT,
  mobile_number TEXT,
  email         TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 12. profiles (one per auth user — stores role + first-login flag)
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id),
  role                TEXT NOT NULL CHECK (role IN ('admin','teacher','student')),
  first_login_pending BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- 13. students
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id),
  registration_no TEXT NOT NULL UNIQUE,  -- validated against pattern
  section_id      UUID NOT NULL REFERENCES sections(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 14. courses
CREATE TABLE courses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  code                  TEXT NOT NULL UNIQUE,
  credit_hours          NUMERIC(4,1) NOT NULL,
  contact_hours_minutes INT NOT NULL CHECK (contact_hours_minutes % 15 = 0),
  -- derived: per_slot_duration_minutes = contact_hours_minutes / 2
  -- must be in {30,45,60,75,90} — enforced by CHECK constraint
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_per_slot_duration CHECK (
    (contact_hours_minutes / 2) IN (30, 45, 60, 75, 90)
  )
);

-- 15. rooms
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  capacity    INT NOT NULL CHECK (capacity > 0),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 16. slot_durations (lookup table for valid durations)
CREATE TABLE slot_durations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes     INT NOT NULL UNIQUE CHECK (minutes IN (30, 45, 60, 75, 90)),
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

#### Timetable Tables

```sql
-- 17. timetables
CREATE TABLE timetables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,         -- auto: "{period_name} Timetable"
  academic_period_id  UUID NOT NULL REFERENCES academic_periods(id),
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  -- enabled days (Mon–Thu always true; Fri–Sun optional)
  day_monday          BOOLEAN NOT NULL DEFAULT true,
  day_tuesday         BOOLEAN NOT NULL DEFAULT true,
  day_wednesday       BOOLEAN NOT NULL DEFAULT true,
  day_thursday        BOOLEAN NOT NULL DEFAULT true,
  day_friday          BOOLEAN NOT NULL DEFAULT false,
  day_saturday        BOOLEAN NOT NULL DEFAULT false,
  day_sunday          BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (academic_period_id)  -- one active timetable per period
);

-- 18. course_section_assignments
-- Tracks which courses are assigned to which sections (and by which teacher)
-- Created via scheduling CSV upload or manual assignment
CREATE TABLE course_section_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id),
  section_id  UUID NOT NULL REFERENCES sections(id),
  teacher_id  UUID NOT NULL REFERENCES teachers(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (timetable_id, course_id, section_id)
);

-- 19. slots
CREATE TABLE slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id    UUID NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  assignment_id   UUID REFERENCES course_section_assignments(id),
  day_of_week     TEXT NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time      TIME NOT NULL,   -- must be on 15-min grid, >= 08:00
  end_time        TIME NOT NULL,   -- must be on 15-min grid, <= 20:00
  course_id       UUID NOT NULL REFERENCES courses(id),
  teacher_id      UUID NOT NULL REFERENCES teachers(id),
  room_id         UUID NOT NULL REFERENCES rooms(id),
  section_id      UUID NOT NULL REFERENCES sections(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_start_time CHECK (
    start_time >= '08:00' AND
    EXTRACT(MINUTE FROM start_time) IN (0, 15, 30, 45)
  ),
  CONSTRAINT valid_end_time CHECK (
    end_time <= '20:00' AND
    EXTRACT(MINUTE FROM end_time) IN (0, 15, 30, 45)
  ),
  CONSTRAINT start_before_end CHECK (start_time < end_time)
);

-- 20. swap_requests
CREATE TABLE swap_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_slot_id  UUID NOT NULL REFERENCES slots(id),
  target_slot_id      UUID NOT NULL REFERENCES slots(id),
  requesting_teacher_id UUID NOT NULL REFERENCES teachers(id),
  target_teacher_id   UUID NOT NULL REFERENCES teachers(id),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  admin_override      BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

---

#### Entity Relationship Summary

```
academic_years ──< academic_periods >── academic_semesters
academic_periods ──< timetables
timetables ──< slots
timetables ──< course_section_assignments
disciplines ──< sections >── semester_numbers
sections >── section_numbers
sections >── programs
sections ──< students
teachers ──< slots
courses ──< slots
rooms ──< slots
sections ──< slots
course_section_assignments >── courses
course_section_assignments >── sections
course_section_assignments >── teachers
slots ──< swap_requests (requesting_slot)
slots ──< swap_requests (target_slot)
auth.users ──< profiles
auth.users ──< teachers (auth_user_id)
auth.users ──< students (auth_user_id)
```

---

### Row Level Security (RLS) Policies

All tables have RLS enabled. The `profiles` table is the source of truth for role checks.

```sql
-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current teacher id
CREATE OR REPLACE FUNCTION get_teacher_id()
RETURNS UUID AS $$
  SELECT id FROM teachers WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get current student section id
CREATE OR REPLACE FUNCTION get_student_section_id()
RETURNS UUID AS $$
  SELECT section_id FROM students WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

**Reference tables** (academic_years, academic_semesters, academic_periods, disciplines, programs, semester_numbers, section_numbers, degree_levels, campuses, sections, slot_durations):
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: admin only

**teachers:**
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: admin only

**students:**
- SELECT: admin sees all; student sees own record; teacher sees all
- INSERT/UPDATE/DELETE: admin only

**courses, rooms:**
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: admin only

**timetables:**
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: admin only

**course_section_assignments:**
- SELECT: all authenticated users
- INSERT/UPDATE/DELETE: admin only

**slots:**
- SELECT: admin sees all; teacher sees all; student sees only slots where `section_id = get_student_section_id()`
- INSERT/UPDATE/DELETE: admin only (swap approvals handled via RPC function)

**swap_requests:**
- SELECT: admin sees all; teacher sees requests where they are requesting or target teacher
- INSERT: teacher only (own slots)
- UPDATE: target teacher (approve/reject own requests); admin (override/cancel any)

**profiles:**
- SELECT: own record only
- UPDATE: own record only (for first_login_pending flag)

---

### Section Naming Formula

```
name = {discipline.short_name}-{semester_number.name}-{section_number.name}{program.short_code}
```

Examples:
- `BSARIN-1ST-1M` (discipline=BSARIN, semester=1ST, section=1, program=M)
- `BSADARIN-3RD-2E` (discipline=BSADARIN, semester=3RD, section=2, program=E)

Implemented as a PostgreSQL trigger on `sections` INSERT/UPDATE:

```sql
CREATE OR REPLACE FUNCTION generate_section_name()
RETURNS TRIGGER AS $$
DECLARE
  disc_short TEXT;
  sem_name   TEXT;
  sec_name   TEXT;
  prog_code  TEXT;
BEGIN
  SELECT short_name INTO disc_short FROM disciplines WHERE id = NEW.discipline_id;
  SELECT name       INTO sem_name   FROM semester_numbers WHERE id = NEW.semester_number_id;
  SELECT name       INTO sec_name   FROM section_numbers WHERE id = NEW.section_number_id;
  SELECT short_code INTO prog_code  FROM programs WHERE id = NEW.program_id;
  NEW.name := disc_short || '-' || sem_name || '-' || sec_name || prog_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_section_name
BEFORE INSERT OR UPDATE ON sections
FOR EACH ROW EXECUTE FUNCTION generate_section_name();
```

### Section Sort Order

Sections are sorted using a computed sort key in the frontend (and optionally as a DB view):

```
sort_key = LPAD(discipline.sort_order::text, 2, '0')
         || semester_number.name  -- A-Z (1ST < 2ND < ... < 8TH alphabetically)
         || LPAD(program.sort_order::text, 2, '0')
         || section_number.name   -- A-Z
```

Custom sort orders:
- Discipline: BSARIN=1, BSADARIN=2, MSARIN=3, PHARIN=4
- Program: M=1, E=2, W=3
- Campus: B=1, R=2, N=3

### Student Registration Number Validation

Pattern (regex):
```
^[SF][0-9]{2}[BRN]ARIN[1-9][0-9]?[MEW][0-9]{6}$
```

Breakdown:
- `[SF]` — semester short code (S=SPRING, F=FALL)
- `[0-9]{2}` — year short name (e.g., 26)
- `[BRN]` — campus short name (B/R/N)
- `ARIN` — fixed department code
- `[1-9][0-9]?` — degree level number (1, 2, 3, 4, or 7)
- `[MEW]` — program short code
- `[0-9]{6}` — 6-digit sequence

Examples: `F26BARIN1M01001`, `S25RARIN3E00042`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Seed Script Idempotence

*For any* number of seed script executions (≥ 1), the record count in every seeded table SHALL remain identical after each subsequent run — no duplicates are created.

**Validates: Requirements 2.3**

---

### Property 2: Admin-Only User Management Authorization

*For any* authenticated user with role `teacher` or `student`, any attempt to invoke user creation, deactivation, or deletion operations SHALL be rejected with an authorization error.

**Validates: Requirements 3.6**

---

### Property 3: Role-Based Route Protection

*For any* protected route belonging to role X and any authenticated user with role Y where Y ≠ X, the route guard SHALL deny access and redirect to the appropriate dashboard for role Y (or to `/login` if unauthenticated).

**Validates: Requirements 3.8**

---

### Property 4: Academic Period Active Mutual Exclusion

*For any* set of academic periods in the system, at most one SHALL have `is_active = true` at any given time. Activating any period SHALL automatically set all others to `is_active = false`.

**Validates: Requirements 4.5**

---

### Property 5: Section Name Formula Correctness

*For any* valid combination of (discipline, semester_number, section_number, program), the auto-generated section name SHALL exactly equal `{discipline.short_name}-{semester_number.name}-{section_number.name}{program.short_code}`.

**Validates: Requirements 5.1**

---

### Property 6: Section Sort Order Invariant

*For any* list of sections returned by the system, the ordering SHALL satisfy: discipline custom order (BSARIN < BSADARIN < MSARIN < PHARIN), then semester name A-Z, then program custom order (M < E < W), then section number A-Z. No two adjacent sections in the list SHALL violate this ordering.

**Validates: Requirements 5.5**

---

### Property 7: Student Registration Number Validation

*For any* string that matches the pattern `^[SF][0-9]{2}[BRN]ARIN[1-9][0-9]?[MEW][0-9]{6}$`, the system SHALL accept it as a valid student registration number. *For any* string that does not match this pattern, the system SHALL reject it with a descriptive validation error.

**Validates: Requirements 6.1, 6.2**

---

### Property 8: Student Sort Order Invariant

*For any* list of students returned by the system, the ordering SHALL satisfy: semester short code custom order (S < F), then year short name A-Z, then campus custom order (B < R < N), then degree level number A-Z, then program custom order (M < E < W), then last 6 digits A-Z.

**Validates: Requirements 6.5**

---

### Property 9: Course Per-Slot Duration Validity

*For any* course record, the value `contact_hours_minutes ÷ 2` SHALL be a member of the set {30, 45, 60, 75, 90}. Any course with a `contact_hours_minutes` value that produces a result outside this set SHALL be rejected at save time.

**Validates: Requirements 7.13**

---

### Property 10: Slot Time Grid Alignment

*For any* slot, both `start_time` and `end_time` SHALL be multiples of 15 minutes from midnight (i.e., minutes component ∈ {0, 15, 30, 45}). Any slot with a time not on this grid SHALL be rejected.

**Validates: Requirements 9.1, 9.3**

---

### Property 11: Slot Scheduling Window Constraint

*For any* slot, `start_time >= 08:00` AND `end_time <= 20:00`. Any slot outside this window SHALL be rejected with a descriptive error.

**Validates: Requirements 9.8, 9.9**

---

### Property 12: Slot Duration Validity

*For any* slot duration value submitted to the system, it SHALL be a member of {30, 45, 60, 75, 90}. Any value outside this set SHALL be rejected.

**Validates: Requirements 9.2, 9.5**

---

### Property 13: Bifurcation Duration Preservation

*For any* slot of duration D that is bifurcated, the two resulting slots SHALL each have duration D ÷ 2, and their combined duration SHALL equal D.

**Validates: Requirements 9.6, 9.7**

---

### Property 14: Disabled Day Slot Rejection

*For any* timetable and any day that is disabled for that timetable, any attempt to create a slot on that day SHALL be rejected with a descriptive error identifying the disabled day.

**Validates: Requirements 10.4, 10.5**

---

### Property 15: Teacher Conflict Detection

*For any* two slots in the same timetable assigned to the same teacher on the same day, if their time intervals overlap (i.e., `slot_a.start_time < slot_b.end_time AND slot_b.start_time < slot_a.end_time`), the system SHALL detect a teacher conflict and reject the later slot creation/modification.

**Validates: Requirements 12.1, 12.4**

---

### Property 16: Room Conflict Detection

*For any* two slots in the same timetable assigned to the same room on the same day with overlapping time intervals, the system SHALL detect a room conflict and reject the later slot creation/modification.

**Validates: Requirements 12.2, 12.4**

---

### Property 17: Section Conflict Detection

*For any* two slots in the same timetable assigned to the same section on the same day with overlapping time intervals, the system SHALL detect a section conflict and reject the later slot creation/modification.

**Validates: Requirements 12.3, 12.4**

---

### Property 18: Weekly Slot Count Constraint

*For any* course-section assignment in a timetable, the count of scheduled slots for that assignment SHALL never exceed 2. The system SHALL reject any slot creation that would cause the count to exceed 2.

**Validates: Requirements 13.1**

---

### Property 19: Course Slot Duration Consistency

*For any* slot assigned to a course, the slot duration (`end_time - start_time` in minutes) SHALL equal `course.contact_hours_minutes ÷ 2`. Any slot with a mismatched duration SHALL be rejected.

**Validates: Requirements 13.2, 13.3, 13.4**

---

### Property 20: Timetable Conversion Split Duration Preservation

*For any* source slot of duration D converted to target duration T where T < D, the resulting split slots SHALL each have duration T, and their count SHALL equal `ceil(D ÷ T)`. The combined time coverage SHALL equal D.

**Validates: Requirements 14.5**

---

### Property 21: Timetable Conversion Merge Duration Preservation

*For any* set of consecutive same-course, same-teacher, same-room, same-section source slots with individual duration T being merged to target duration M where M > T, the merged slot duration SHALL equal the sum of the merged source slot durations.

**Validates: Requirements 14.6**

---

### Property 22: AI Scheduler Conflict Pre-Validation

*For any* slot assignment proposed by the AI Scheduler, the system SHALL apply all conflict detection rules (teacher, room, section) before presenting the proposal to the Admin. No conflicting proposal SHALL be silently persisted.

**Validates: Requirements 15.3**

---

### Property 23: Swap Request Conflict Pre-Validation

*For any* swap request between slot A (teacher X) and slot B (teacher Y), the system SHALL verify that assigning teacher X to slot B's time/room/section and teacher Y to slot A's time/room/section introduces no new conflicts before approving the swap.

**Validates: Requirements 18.2**

---

### Property 24: RLS Role Data Isolation

*For any* authenticated user with role `student`, queries to the `slots` table SHALL return only slots where `section_id` matches the student's enrolled section. No slots from other sections SHALL be returned.

**Validates: Requirements 16.3, 16.4**

---

## Error Handling

### Authentication Errors
- Invalid credentials → display Supabase error message, do not grant access
- Deactivated account → display "Account deactivated. Contact administrator." message
- First-login pending → redirect to `/change-password`, block all other routes via `ProtectedRoute`
- Session expired → redirect to `/login`, clear local auth state

### Validation Errors (Client-Side + DB Constraint)
- Student registration number pattern mismatch → "Invalid registration number format. Expected: {semester_code}{year}{campus}ARIN{degree_level}{program}{6-digits}"
- Course `contact_hours_minutes` not multiple of 15 → "Contact hours must be a multiple of 15 minutes"
- Course per-slot duration not in {30,45,60,75,90} → "Derived per-slot duration ({value} min) is not supported. Supported values: 30, 45, 60, 75, 90"
- Slot outside scheduling window → "Slot time must be between 08:00 and 20:00"
- Slot time not on 15-min grid → "Slot times must align to 15-minute intervals"
- Slot on disabled day → "Day '{day}' is not enabled for this timetable"
- Duplicate section name → "Section '{name}' already exists"
- Duplicate academic period → "Academic period '{name}' already exists"

### Conflict Errors
- Teacher conflict → "Teacher '{name}' is already scheduled at {day} {start}–{end} for section '{section}'"
- Room conflict → "Room '{name}' is already booked at {day} {start}–{end}"
- Section conflict → "Section '{name}' already has a class at {day} {start}–{end}"
- Weekly slot limit → "Course '{code}' already has 2 slots scheduled this week for section '{section}'"

### CSV Upload Errors
- Missing required column → "Row {n}: Missing required field '{field}'"
- Unknown entity reference → "Row {n}: {entity} '{code}' not found or inactive"
- Duplicate record → "Row {n}: Duplicate entry — '{identifier}' already exists (skipped)"
- Pattern validation failure → "Row {n}: Invalid registration number '{value}'"
- After processing: summary modal showing `{success_count} imported, {error_count} skipped` with expandable error list

### AI Scheduler Errors
- Missing env vars → "AI Scheduler is not configured. Set VITE_LLM_API_KEY and VITE_LLM_API_URL in your environment." (chat input disabled)
- LLM API call failure → "AI Scheduler request failed: {error_message}. No changes were made."
- Proposed slot has conflict → AI response includes conflict description and alternative suggestions; no slots persisted until Admin approves

### Scheduling Days — Safe-Disable Flow Errors
- Day has unresolvable slots → confirmation dialog: "The following slots on {day} could not be rescheduled: [{slot list}]. Confirming will permanently remove these slots. Cancel to keep the day enabled."
- Admin cancels → day remains enabled, no changes applied

### Timetable Publish Blocking
- Incomplete course-section assignments → "Cannot publish: The following course-section assignments have fewer than 2 scheduled slots: [{list}]"

---

## Testing Strategy

### Overview

The testing strategy uses a dual approach:
1. **Property-based tests** for universal correctness properties (using [fast-check](https://github.com/dubzzz/fast-check) for JavaScript/TypeScript)
2. **Example-based unit tests** for specific behaviors, edge cases, and UI interactions (using [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/))
3. **Integration tests** for Supabase interactions, seed script, and real-time behavior

### Property-Based Testing Setup

Library: `fast-check` (npm package)
Runner: Vitest
Minimum iterations per property: 100

Each property test is tagged with a comment referencing the design property:
```js
// Feature: academic-timetable-system, Property 5: Section Name Formula Correctness
```

### Property Test Implementations

**Property 1 — Seed Script Idempotence**
```
fc.assert(fc.property(fc.integer({min: 1, max: 5}), async (runs) => {
  for (let i = 0; i < runs; i++) await runSeedScript();
  const counts = await getTableCounts();
  expect(counts).toEqual(EXPECTED_SEED_COUNTS);
}))
```

**Property 5 — Section Name Formula**
```
fc.assert(fc.property(
  fc.record({ discShort: fc.constantFrom('BSARIN','BSADARIN','MSARIN','PHARIN'),
               semName: fc.constantFrom('1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH'),
               secName: fc.constantFrom('A','B','C','D','E','F','G','H','I','J'),
               progCode: fc.constantFrom('M','E','W') }),
  ({ discShort, semName, secName, progCode }) => {
    const name = generateSectionName(discShort, semName, secName, progCode);
    expect(name).toBe(`${discShort}-${semName}-${secName}${progCode}`);
  }
))
```

**Property 7 — Student Registration Number Validation**
```
// Valid pattern generator
const validRegNo = fc.tuple(
  fc.constantFrom('S','F'),
  fc.integer({min:21,max:30}).map(n=>n.toString()),
  fc.constantFrom('B','R','N'),
  fc.constantFrom('1','2','3','4','7'),
  fc.constantFrom('M','E','W'),
  fc.integer({min:1,max:999999}).map(n=>n.toString().padStart(6,'0'))
).map(parts => parts[0]+parts[1]+parts[2]+'ARIN'+parts[3]+parts[4]+parts[5]);

fc.assert(fc.property(validRegNo, (regNo) => {
  expect(validateStudentRegNo(regNo)).toBe(true);
}))
```

**Property 10 — Slot Time Grid Alignment**
```
fc.assert(fc.property(
  fc.integer({min:0,max:47}).map(i => ({ h: Math.floor(i*15/60)+8, m: (i*15)%60 })),
  ({ h, m }) => {
    const time = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    expect(isOnGrid(time)).toBe(true);
  }
))
```

**Property 15/16/17 — Conflict Detection**
```
fc.assert(fc.property(
  fc.record({
    day: fc.constantFrom('monday','tuesday','wednesday','thursday'),
    start1: fc.integer({min:0,max:44}).map(i=>gridTime(i)),
    duration: fc.constantFrom(30,45,60,75,90)
  }),
  ({ day, start1, duration }) => {
    const slot1 = { day, start: start1, end: addMinutes(start1, duration), teacherId: 'T1' };
    const slot2 = { day, start: start1, end: addMinutes(start1, duration), teacherId: 'T1' };
    expect(detectTeacherConflict(slot1, slot2)).toBe(true);
  }
))
```

### Unit Test Coverage

- `generateSectionName()` — all valid combinations
- `validateStudentRegNo()` — valid examples, boundary cases, invalid formats
- `isOnGrid(time)` — valid grid times, off-grid times
- `isInSchedulingWindow(start, end)` — boundary values (08:00, 20:00, 07:59, 20:01)
- `detectConflict(slotA, slotB)` — overlapping, adjacent, non-overlapping intervals
- `derivePerSlotDuration(contactMinutes)` — all valid values, invalid values
- `splitSlot(slot, targetDuration)` — all valid split combinations
- `mergeSlots(slots, targetDuration)` — consecutive same-assignment slots
- `sortSections(sections)` — custom sort order verification
- `sortStudents(students)` — custom sort order verification
- `parseCSVRow(row, schema)` — valid rows, missing fields, invalid values
- `ProtectedRoute` — renders children for correct role, redirects for wrong role
- `TimetableGrid` — renders 08:00–20:00 grid with 15-min rows
- `AIChatPanel` — disabled state when env vars missing, enabled state when present

### Integration Tests

- Seed script: verify all 16 entity tables have correct record counts after seeding
- Supabase Auth: verify teacher auth users created with correct emails
- RLS policies: verify student can only read own section's slots
- Realtime: verify slot change propagates to subscriber within 2 seconds
- Timetable publish: verify blocked when incomplete course-section assignments exist
- Swap request: verify atomic slot exchange on approval

### Testing Configuration

```js
// vitest.config.js
export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: { reporter: ['text', 'lcov'] }
  }
}
```

Property tests run with `--run` flag (no watch mode):
```
vitest run src/test/properties/
```

---

## Detailed Feature Designs

### Seed Data Initialization

The seed script (`seed/seedRunner.js`) is a standalone Node.js script that uses the Supabase service-role key (not the anon key) to bypass RLS and insert all reference data.

**Execution:** Run once after Supabase project creation:
```bash
node seed/seedRunner.js
```

**Idempotency strategy:** Use `upsert` with `onConflict` on unique columns for all reference tables. For teachers, check if auth user exists before creating.

**Seed order (respects foreign key dependencies):**
1. `academic_years` (no deps)
2. `academic_semesters` (no deps)
3. `degree_levels` (no deps)
4. `campuses` (no deps)
5. `disciplines` (no deps)
6. `programs` (no deps)
7. `semester_numbers` (no deps)
8. `section_numbers` (no deps)
9. `academic_periods` (deps: academic_years, academic_semesters)
10. `sections` (deps: disciplines, semester_numbers, section_numbers, programs)
11. `slot_durations` (no deps)
12. `teachers` + Supabase Auth users + `profiles` (deps: none for table, Auth for users)

**Teacher auth user creation:**
```js
for (const teacher of teachers) {
  // Check if auth user already exists
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
  const exists = existing.users.find(u => u.email === teacher.email);
  if (!exists) {
    const { data: { user } } = await supabaseAdmin.auth.admin.createUser({
      email: teacher.email,
      password: teacher.password,
      email_confirm: true
    });
    // Insert teacher record
    await supabase.from('teachers').upsert({ auth_user_id: user.id, ...teacherData });
    // Insert profile with teacher role and first_login_pending=true
    await supabase.from('profiles').upsert({ id: user.id, role: 'teacher', first_login_pending: true });
  }
}
```

---

### Timetable Scheduling Engine

#### Slot Grid

The scheduling window is 08:00–20:00, divided into 48 fifteen-minute intervals:
```
Index 0  → 08:00
Index 1  → 08:15
Index 2  → 08:30
...
Index 47 → 19:45
(end boundary: 20:00)
```

Grid utility functions:
```js
// Convert grid index to time string
const gridIndexToTime = (i) => {
  const totalMinutes = 8 * 60 + i * 15;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Convert time string to grid index
const timeToGridIndex = (time) => {
  const [h, m] = time.split(':').map(Number);
  return (h - 8) * 4 + m / 15;
};

// Check if time is on 15-min grid
const isOnGrid = (time) => {
  const [, m] = time.split(':').map(Number);
  return m % 15 === 0;
};
```

#### Conflict Detection Algorithm

Conflict detection runs on every slot INSERT or UPDATE. It checks three dimensions:

```js
function detectConflicts(newSlot, existingSlots) {
  const conflicts = [];
  for (const slot of existingSlots) {
    if (slot.id === newSlot.id) continue; // skip self
    if (slot.day_of_week !== newSlot.day_of_week) continue;
    // Time overlap check: A overlaps B iff A.start < B.end AND B.start < A.end
    const overlaps = newSlot.start_time < slot.end_time && slot.start_time < newSlot.end_time;
    if (!overlaps) continue;
    if (slot.teacher_id === newSlot.teacher_id) {
      conflicts.push({ type: 'teacher', conflictingSlot: slot });
    }
    if (slot.room_id === newSlot.room_id) {
      conflicts.push({ type: 'room', conflictingSlot: slot });
    }
    if (slot.section_id === newSlot.section_id) {
      conflicts.push({ type: 'section', conflictingSlot: slot });
    }
  }
  return conflicts;
}
```

This runs client-side before submission (for immediate feedback) and is also enforced server-side via a PostgreSQL trigger or RPC function.

#### Weekly Slot Count Enforcement

Before inserting a slot, check:
```js
const { count } = await supabase
  .from('slots')
  .select('id', { count: 'exact' })
  .eq('timetable_id', timetableId)
  .eq('course_id', courseId)
  .eq('section_id', sectionId);

if (count >= 2) throw new Error('Weekly slot limit reached for this course-section assignment');
```

#### Course Slot Duration Validation

```js
function validateSlotDuration(slot, course) {
  const expectedDuration = course.contact_hours_minutes / 2;
  const actualDuration = timeDiffMinutes(slot.start_time, slot.end_time);
  if (actualDuration !== expectedDuration) {
    throw new Error(`Slot duration ${actualDuration} min does not match required ${expectedDuration} min for course ${course.code}`);
  }
}
```

---

### Timetable Conversion Algorithm

#### Split Logic (target duration < source duration)

```js
function splitSlot(sourceSlot, targetDurationMinutes) {
  const sourceDuration = timeDiffMinutes(sourceSlot.start_time, sourceSlot.end_time);
  const count = Math.ceil(sourceDuration / targetDurationMinutes);
  const newSlots = [];
  let currentStart = sourceSlot.start_time;
  for (let i = 0; i < count; i++) {
    const currentEnd = addMinutes(currentStart, targetDurationMinutes);
    // Clamp to 20:00
    const clampedEnd = currentEnd > '20:00' ? '20:00' : currentEnd;
    newSlots.push({
      ...sourceSlot,
      id: undefined,
      start_time: currentStart,
      end_time: clampedEnd
    });
    currentStart = clampedEnd;
    if (currentStart >= '20:00') break;
  }
  return newSlots;
}
```

#### Merge Logic (target duration > source duration)

```js
function mergeSlots(sourceSlots, targetDurationMinutes) {
  // Sort by day and start_time
  const sorted = [...sourceSlots].sort((a, b) =>
    a.day_of_week.localeCompare(b.day_of_week) || a.start_time.localeCompare(b.start_time)
  );
  const merged = [];
  let i = 0;
  while (i < sorted.length) {
    const base = sorted[i];
    let accumulatedMinutes = timeDiffMinutes(base.start_time, base.end_time);
    let j = i + 1;
    // Merge consecutive same-assignment slots until we reach target duration
    while (j < sorted.length && accumulatedMinutes < targetDurationMinutes) {
      const next = sorted[j];
      const isSameAssignment = next.course_id === base.course_id &&
        next.teacher_id === base.teacher_id &&
        next.room_id === base.room_id &&
        next.section_id === base.section_id &&
        next.day_of_week === base.day_of_week &&
        next.start_time === sorted[j-1].end_time; // consecutive
      if (!isSameAssignment) break;
      accumulatedMinutes += timeDiffMinutes(next.start_time, next.end_time);
      j++;
    }
    merged.push({
      ...base,
      id: undefined,
      end_time: addMinutes(base.start_time, Math.min(accumulatedMinutes, targetDurationMinutes))
    });
    i = j;
  }
  return merged;
}
```

---

### Scheduling Days Configuration — Safe-Disable Flow

```
Admin clicks "Disable {day}"
        │
        ▼
Query all slots on {day} for current timetable
        │
        ├─ No occupied slots → disable day immediately, show confirmation
        │
        └─ Has occupied slots
                │
                ▼
        Attempt auto-reschedule:
        For each occupied slot:
          Find free time windows on remaining enabled days
          where teacher, room, and section have no conflicts
                │
                ├─ All slots rescheduled → disable day, apply changes, notify Admin
                │
                └─ Some slots unresolvable
                        │
                        ▼
                Show confirmation dialog:
                "These slots cannot be rescheduled: [list]
                 Confirm to permanently remove them, or Cancel."
                        │
                        ├─ Admin confirms → remove unresolvable slots, disable day
                        └─ Admin cancels → leave day enabled, no changes
```

Auto-reschedule algorithm:
```js
async function findFreeWindow(slot, enabledDays, existingSlots) {
  const duration = timeDiffMinutes(slot.start_time, slot.end_time);
  for (const day of enabledDays) {
    for (let i = 0; i <= 48 - duration/15; i++) {
      const start = gridIndexToTime(i);
      const end = addMinutes(start, duration);
      if (end > '20:00') break;
      const candidate = { ...slot, day_of_week: day, start_time: start, end_time: end };
      const conflicts = detectConflicts(candidate, existingSlots);
      if (conflicts.length === 0) return candidate;
    }
  }
  return null; // unresolvable
}
```

---

### AI Scheduler Integration

#### Configuration Check

```js
const AI_ENABLED = Boolean(import.meta.env.VITE_LLM_API_KEY && import.meta.env.VITE_LLM_API_URL);
```

If `AI_ENABLED` is false, the chat input is disabled and a configuration error banner is shown.

#### System Prompt

The AI Scheduler sends a system prompt containing:
- Current timetable context (enabled days, existing slots summary)
- Available courses, sections, teachers, rooms
- Scheduling constraints (15-min grid, 08:00–20:00 window, 2 slots/week/course, conflict rules)
- Response format instruction: return structured JSON with proposed slot assignments

#### Request/Response Flow

```
Admin types instruction
        │
        ▼
Build messages array:
  [{ role: 'system', content: SYSTEM_PROMPT },
   ...conversationHistory,
   { role: 'user', content: adminInstruction }]
        │
        ▼
POST {VITE_LLM_API_URL}/chat/completions
  Authorization: Bearer {VITE_LLM_API_KEY}
  Body: { model, messages, temperature: 0.2 }
        │
        ├─ API error → display error, no changes
        │
        └─ Success
                │
                ▼
        Parse response for slot proposals (JSON block in assistant message)
                │
                ▼
        Run conflict detection on each proposed slot
                │
                ├─ Conflicts found → display conflicts in chat, offer alternatives
                │
                └─ No conflicts → display AIProposalCard with approve/reject buttons
                        │
                        ├─ Admin approves → persist slots to DB
                        └─ Admin rejects → discard proposals
```

#### Proposal Card UI

```
┌─────────────────────────────────────────────────────┐
│ AI Proposal                                          │
│                                                      │
│ Course: CS-301 (Artificial Intelligence)             │
│ Section: BSARIN-5TH-1M                               │
│ Teacher: Wareesa Sharif                              │
│ Room: Lab-3                                          │
│ Monday 09:00–10:30, Wednesday 14:00–15:30            │
│                                                      │
│ [✓ Approve]  [✗ Reject]                              │
└─────────────────────────────────────────────────────┘
```

---

### Timetable Views Design

All four views share the same `TimetableGrid` component with different filter configurations.

#### Grid Layout

```
         Mon    Tue    Wed    Thu    Fri*   Sat*   Sun*
08:00  │       │       │       │       │       │       │
08:15  │       │       │       │       │       │       │
08:30  │       │  CS301│       │       │       │       │
...
20:00  └───────┴───────┴───────┴───────┴───────┴───────┘
* Only shown if enabled for the timetable
```

Each slot cell spans multiple 15-min rows based on its duration (e.g., a 90-min slot spans 6 rows).

#### View Configurations

| View | Filter | Default for |
|---|---|---|
| Section-wise | Select section | Student (own section) |
| Teacher-wise | Select teacher | Teacher (own schedule) |
| Room-wise | Select room | Admin |
| Day-wise | Select day | Admin |

#### Real-Time Updates

```js
// useRealtimeSlots.js
const subscription = supabase
  .channel('slots-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'slots',
    filter: `timetable_id=eq.${timetableId}`
  }, (payload) => {
    // Update local slot state based on payload.eventType
    if (payload.eventType === 'INSERT') addSlot(payload.new);
    if (payload.eventType === 'UPDATE') updateSlot(payload.new);
    if (payload.eventType === 'DELETE') removeSlot(payload.old.id);
  })
  .subscribe();
```

---

### Teacher Swap Request Flow

```
Teacher A views timetable
        │
        ▼
Clicks "Request Swap" on own slot
        │
        ▼
SwapRequestForm: select target slot (from another teacher)
        │
        ▼
Client-side conflict pre-check:
  Would assigning Teacher A to target slot's time/room/section cause conflict?
  Would assigning Teacher B to Teacher A's slot time/room/section cause conflict?
        │
        ├─ Conflict → show error, block submission
        │
        └─ No conflict → submit swap_request record (status='pending')
                │
                ▼
        Teacher B receives notification (Supabase Realtime on swap_requests table)
                │
                ├─ Teacher B approves → RPC function atomically swaps teacher_id on both slots
                │                       → swap_request status='approved'
                │                       → Teacher A notified
                │
                └─ Teacher B rejects → swap_request status='rejected'
                                       → Teacher A notified
```

Atomic swap RPC:
```sql
CREATE OR REPLACE FUNCTION approve_swap_request(swap_id UUID)
RETURNS void AS $$
DECLARE
  req swap_requests%ROWTYPE;
  slot_a slots%ROWTYPE;
  slot_b slots%ROWTYPE;
BEGIN
  SELECT * INTO req FROM swap_requests WHERE id = swap_id AND status = 'pending';
  SELECT * INTO slot_a FROM slots WHERE id = req.requesting_slot_id;
  SELECT * INTO slot_b FROM slots WHERE id = req.target_slot_id;
  -- Atomic exchange
  UPDATE slots SET teacher_id = slot_b.teacher_id WHERE id = slot_a.id;
  UPDATE slots SET teacher_id = slot_a.teacher_id WHERE id = slot_b.id;
  UPDATE swap_requests SET status = 'approved' WHERE id = swap_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### CSV Upload Design

#### Parsing Pipeline

```
File selected by Admin
        │
        ▼
Read file as text (FileReader API)
        │
        ▼
Parse CSV (PapaParse library)
  - header: true
  - skipEmptyLines: true
        │
        ▼
For each row:
  1. Validate required columns present
  2. Validate field formats (pattern, type, range)
  3. Resolve entity references (lookup by code/name)
  4. Check for duplicates
  5. If valid → stage for insert
     If invalid → add to error list with row number and message
        │
        ▼
Batch insert valid rows (Supabase upsert)
        │
        ▼
Display CSVSummaryReport:
  "{n} records imported successfully"
  "{m} rows skipped:"
  - Row 3: Missing required field 'course_code'
  - Row 7: Section 'BSARIN-9TH-1M' not found
  ...
```

#### CSV Schemas

**Students CSV:**
```
registration_no, section_name
F26BARIN1M01001, BSARIN-1ST-1M
```

**Courses CSV:**
```
course_code, name, credit_hours, contact_hours_minutes
CS-301, Artificial Intelligence, 3, 180
```

**Rooms CSV:**
```
name, capacity
Lab-1, 40
```

**Scheduling CSV (course-section-teacher assignments):**
```
course_code, section_code, teacher_code
CS-301, BSARIN-5TH-1M, muzammil.rehman@iub.edu.pk
```

---

### Admin Page Structure

#### Data Management Page

```
┌─────────────────────────────────────────────────────────────────┐
│ Data Management                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │ Academic     │ │ Academic     │ │ Academic     │             │
│ │ Years        │ │ Semesters    │ │ Periods      │             │
│ │ 10 records   │ │ 3 records    │ │ 4 records    │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │ Disciplines  │ │ Programs     │ │ Semester Nos │             │
│ │ 4 records    │ │ 3 records    │ │ 8 records    │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │ Section Nos  │ │ Degree Levels│ │ Campuses     │             │
│ │ 10 records   │ │ 5 records    │ │ 3 records    │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │ Sections     │ │ Teachers     │ │ Students     │             │
│ │ 148 records  │ │ 12 records   │ │ 0 records    │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │ Courses      │ │ Rooms        │ │ Slot Durations│            │
│ │ 0 records    │ │ 0 records    │ │ 5 records    │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

Each card is clickable and navigates to `/admin/data/{entity}`.

#### Timetable Management Page

Lists all timetables with:
- Name (e.g., "2026 SPRING Timetable")
- Academic Period
- Status badge (Draft / Published / Archived)
- Actions: View, Edit, Duplicate, Convert, Publish, Archive

#### Timetable Scheduling Page

```
┌─────────────────────────────────────────────────────────────────┐
│ 2026 SPRING Timetable — Scheduling                               │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │ AI Scheduler             │
│  [Section ▼] [Teacher ▼] [Room ▼]   │                          │
│  [Day ▼]  [Slot Duration ▼]          │ ┌────────────────────┐   │
│                                      │ │ How can I help?    │   │
│  ┌────────────────────────────────┐  │ └────────────────────┘   │
│  │ Timetable Grid (08:00–20:00)   │  │                          │
│  │ Mon | Tue | Wed | Thu | Fri    │  │ [Type a message...]  [→] │
│  │ ... │ ... │ ... │ ... │ ...    │  │                          │
│  └────────────────────────────────┘  │ Scheduling Days:         │
│                                      │ ☑ Mon ☑ Tue ☑ Wed ☑ Thu │
│  Course Completion Status:           │ ☐ Fri ☐ Sat ☐ Sun        │
│  CS-301: ✓ 2/2 | CS-302: ✗ 1/2     │                          │
└──────────────────────────────────────┴──────────────────────────┘
```

---

### Role-Specific Dashboards

#### Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ DAI-TSMS — Admin Dashboard                                       │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ Sections │ │ Teachers │ │ Students │ │  Rooms   │           │
│ │   148    │ │    12    │ │    0     │ │    0     │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│ ┌──────────────────────────┐ ┌──────────────────────────┐      │
│ │ Active Timetable         │ │ Pending Swap Requests    │      │
│ │ 2026 SPRING — Draft      │ │ 0 pending                │      │
│ └──────────────────────────┘ └──────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

#### Teacher Dashboard

- Weekly timetable grid (teacher-wise view, own schedule)
- Pending swap requests list (incoming + outgoing)
- Quick stats: total classes this week, total contact hours

#### Student Dashboard

- Section timetable grid (section-wise view, own section)
- Current active period name
- "No timetable published" message if no active published timetable

---

## UI/UX Design Principles

### Visual Theme

DAI-TSMS uses a **vibrant academic theme** that conveys professionalism, energy, and clarity. The design is inspired by modern university portals with a Pakistani academic context.

**Color Palette:**
```
Primary:    #1E40AF  (Deep Blue — authority, trust)
Secondary:  #7C3AED  (Violet — AI/technology accent)
Accent:     #059669  (Emerald — success, active states)
Warning:    #D97706  (Amber — pending, draft states)
Danger:     #DC2626  (Red — conflicts, errors)
Background: #F8FAFC  (Slate 50 — clean, light)
Surface:    #FFFFFF  (White — cards, panels)
Text:       #0F172A  (Slate 900 — primary text)
Muted:      #64748B  (Slate 500 — secondary text)
```

**Slot Color Coding (in timetable grid):**
- Each course gets a consistent color derived from its code hash
- Colors are drawn from a palette of 12 distinct, accessible hues
- Conflict slots are highlighted with a red border and warning icon

### Typography
- Font family: `Inter` (Google Fonts) — clean, modern, highly legible
- Headings: `font-semibold` to `font-bold`
- Body: `font-normal`, 14–16px
- Monospace (registration numbers, codes): `font-mono`

### Layout
- **Sidebar navigation** (collapsible on mobile) with role-specific links
- **Topbar** with user name, role badge, and logout button
- **Card-based** data management with hover effects
- **Responsive breakpoints:** single-column below 768px (md), two-column at md, full layout at lg+
- **TailwindCSS** utility classes throughout — no custom CSS files except for the timetable grid

### Timetable Grid Specifics
- Time axis on the left (08:00–20:00, every 15 min labeled at each hour)
- Day columns with sticky headers
- Slot cells: rounded corners, course name + teacher name + room name displayed
- Empty cells: subtle dashed border, clickable to open SlotForm
- Hover state: slight elevation shadow
- Conflict indicator: red pulsing dot on conflicting cells

### Accessibility
- All interactive elements have `aria-label` attributes
- Color is never the sole indicator of state (icons + text accompany color)
- Focus rings visible on keyboard navigation
- Minimum touch target size: 44×44px on mobile

---

## Deployment Configuration

### vercel.json

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### vite.config.js

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
```

### Environment Variables (Vercel Dashboard)

| Variable | Example Value | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Yes |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Yes |
| `VITE_LLM_API_KEY` | `sk-...` | Yes (for AI Scheduler) |
| `VITE_LLM_API_URL` | `https://api.openai.com/v1` | Yes (for AI Scheduler) |

### Supabase Client Initialization

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "seed": "node seed/seedRunner.js"
  }
}
```

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@supabase/supabase-js": "^2",
    "papaparse": "^5",
    "tailwindcss": "^3",
    "@headlessui/react": "^2",
    "@heroicons/react": "^2"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "vitest": "^1",
    "@testing-library/react": "^14",
    "@testing-library/jest-dom": "^6",
    "fast-check": "^3",
    "jsdom": "^24"
  }
}
```

---

## Appendix: Scheduling Grid Reference

### 15-Minute Grid (08:00–20:00)

| Index | Time | Index | Time | Index | Time | Index | Time |
|---|---|---|---|---|---|---|---|
| 0 | 08:00 | 12 | 11:00 | 24 | 14:00 | 36 | 17:00 |
| 1 | 08:15 | 13 | 11:15 | 25 | 14:15 | 37 | 17:15 |
| 2 | 08:30 | 14 | 11:30 | 26 | 14:30 | 38 | 17:30 |
| 3 | 08:45 | 15 | 11:45 | 27 | 14:45 | 39 | 17:45 |
| 4 | 09:00 | 16 | 12:00 | 28 | 15:00 | 40 | 18:00 |
| 5 | 09:15 | 17 | 12:15 | 29 | 15:15 | 41 | 18:15 |
| 6 | 09:30 | 18 | 12:30 | 30 | 15:30 | 42 | 18:30 |
| 7 | 09:45 | 19 | 12:45 | 31 | 15:45 | 43 | 18:45 |
| 8 | 10:00 | 20 | 13:00 | 32 | 16:00 | 44 | 19:00 |
| 9 | 10:15 | 21 | 13:15 | 33 | 16:15 | 45 | 19:15 |
| 10 | 10:30 | 22 | 13:30 | 34 | 16:30 | 46 | 19:30 |
| 11 | 10:45 | 23 | 13:45 | 35 | 16:45 | 47 | 19:45 |

End boundary: 20:00 (index 48, not a valid start time)

### Slot Duration → Grid Rows Spanned

| Duration | Rows |
|---|---|
| 30 min | 2 |
| 45 min | 3 |
| 60 min | 4 |
| 75 min | 5 |
| 90 min | 6 |

### Contact Hours → Per-Slot Duration Mapping

| contact_hours_minutes | per_slot_duration | weekly_slots |
|---|---|---|
| 60 | 30 min | 2 |
| 90 | 45 min | 2 |
| 120 | 60 min | 2 |
| 150 | 75 min | 2 |
| 180 | 90 min | 2 |
