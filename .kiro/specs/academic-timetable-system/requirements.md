# Requirements Document

## Introduction

The Department of Artificial Intelligence - Timetable Scheduling & Management System (DAI-TSMS) is a comprehensive, organization-specific scheduling and management application built for the Department of Artificial Intelligence, Faculty of Computing, The Islamia University of Bahawalpur, Pakistan. It is developed by Muzammil Ur Rehman (muzammil.rehman@iub.edu.pk).

The system is a React + Vite single-page application hosted on Vercel, backed by Supabase for authentication, database, and real-time capabilities. It supports three user roles (Admin, Teacher, Student), AI-assisted scheduling via any OpenAI-compatible LLM, flexible 15-minute-granularity time slots, conflict-free timetable generation, and multiple timetable views. The Admin is the primary power user responsible for all data management and scheduling operations.

---

## Glossary

- **System**: The Department of Artificial Intelligence - Timetable Scheduling & Management System (DAI-TSMS) application as a whole.
- **Admin**: A privileged user responsible for managing all entities, scheduling, and system configuration.
- **Teacher**: A faculty member with name, designation, expertise, mobile number, email, and initial password. Also a system user with the Teacher role. 12 teachers are pre-loaded from seed data.
- **Student**: A learner enrolled in exactly one Section. The Student registration number is provided by the Admin and follows the naming pattern `{semester_short_code}{year_short_name}{campus_short_name}ARIN{degree_level_number}{program_short_code}{6-digit-sequence}` (e.g., F26BARIN1M01001) — this pattern is used for validation and sorting reference only, not auto-generation. Sorted by semester code custom order (S→F), year short name A-Z, campus custom order (B→R→N), degree level number A-Z, program custom order (M→E→W), then last 6 digits A-Z.
- **Academic_Year**: A calendar year record (e.g., 2026) with a name and short name (e.g., "26"). Seeded for years 2021–2030.
- **Academic_Semester**: A system-defined academic period type with name, short name, and short code. Fixed values: SPRING (SP, S), SUMMER (SU, SU), FALL (FA, F). Not user-editable.
- **Academic_Period**: A unique combination of an Academic_Year and Academic_Semester (e.g., "2026 SPRING"), with an `is_active` flag. Named as `{year_name} {semester_name}`. Seeded: 2026 SPRING (active), 2026 FALL, 2027 SPRING, 2027 FALL.
- **Discipline**: An academic discipline offered by the department (e.g., BS Artificial Intelligence / BSARIN). Has a name and short name. Custom sort order: BSARIN → BSADARIN → MSARIN → PHARIN.
- **Program**: A study program type with name, short name, and short code. Values: Morning (MOR, M), Evening (EVE, E), Weekend (WEE, W). Custom sort order: M → E → W.
- **Semester_Number**: An ordinal semester label (1ST through 8TH) with a numeric value (1–8).
- **Section_Number**: An alphabetic section label (A through J) with a numeric value (1–10).
- **Degree_Level**: An academic degree classification with name, short name, and number. Values: BS 16yr (BS, 1), M.Sc 16yr (M.Sc, 2), MS 18yr (MS, 3), PhD (PhD, 4), BSAD ADP (BSAD, 7).
- **Campus**: A physical university campus location with name and short name. Values: Bahawalpur (B), Rahim Yar Khan (R), Bahawalnagar (N). Custom sort order: B → R → N.
- **Section**: A class group named as `{discipline_short_name}-{semester_number_name}-{section_number}{program_short_code}` (e.g., BSARIN-1ST-1M). Sorted by discipline custom order (BSARIN→BSADARIN→MSARIN→PHARIN), then semester name A-Z, then program custom order (M→E→W), then section number A-Z. Pre-loaded from seed data covering all BSARIN semesters 1ST–8TH, and 1ST-semester sections for BSADARIN, MSARIN, and PHARIN.
- **Course**: An academic subject with name, code, credit_hours, and contact_hours_minutes. `credit_hours` is the academic credit value. `contact_hours_minutes` is the total weekly face-time in minutes (must be a multiple of 15), used to derive the per-slot duration: each course is scheduled as exactly 2 slots per week, each of duration `contact_hours_minutes ÷ 2` minutes (e.g., 180 contact minutes → 2 × 90-minute slots). No seed data; uploaded by Admin.
- **Room**: A physical or virtual space with name and capacity. No seed data; uploaded by Admin.
- **Slot**: A scheduled unit of time on a Timetable, defined by day, start time, end time, course, teacher, room, section, and timetable reference.
- **Slot_Duration**: A permitted lecture duration in minutes (30, 45, 60, 75, or 90), always a multiple of 15.
- **Timetable**: A complete weekly schedule for a given Academic_Period, composed of Slots.
- **Timetable_Conversion**: The process of duplicating a Timetable and adjusting all Slot_Durations proportionally (e.g., 90 min → 45 min) without full rescheduling.
- **AI_Scheduler**: The AI chat subsystem that accepts natural-language scheduling instructions and produces or modifies Slots.
- **LLM_Provider**: An external large language model API endpoint that is OpenAI-API-compatible.
- **Swap_Request**: A Teacher-initiated request to exchange a Slot with another Teacher's Slot.
- **Conflict**: A scheduling violation where a Teacher, Room, or Section is assigned to more than one Slot at the same time.
- **CSV_Upload**: A bulk data import operation using a comma-separated values file.
- **First_Login**: The initial authenticated session for a newly created user account.
- **Dashboard**: The role-specific landing page shown after successful authentication.
- **Scheduling_Day**: Any day of the week (Monday through Sunday) that can be enabled for a Timetable. Monday–Thursday are standard days (always enabled by default); Friday–Sunday are extended days (optionally enabled per Timetable by the Admin).
- **Scheduling_Window**: The daily time range within which Slots may be placed: 08:00 to 20:00 (12 hours), divided into 48 fifteen-minute intervals (08:00, 08:15, 08:30 … 19:45, 20:00).
- **Seed_Data**: Pre-loaded reference data inserted into Supabase at system initialization, covering Academic Years, Academic Semesters, Academic Periods, Disciplines, Programs, Semester Numbers, Section Numbers, Degree Levels, Campuses, Sections, and Teachers.
- **Data_Management_Page**: The admin interface for managing all master data entities (Academic Years, Academic Semesters, Academic Periods, Disciplines, Programs, Semester Numbers, Section Numbers, Degree Levels, Campuses, Sections, Teachers, Students, Courses, Rooms, Slots, Slot_Durations).
- **Timetable_Management_Page**: The admin interface for viewing, duplicating, converting, publishing, and archiving existing Timetables.
- **Timetable_Scheduling_Page**: The admin interface for creating and editing Slot assignments, including access to the AI_Scheduler chat panel.
- **Supabase**: The backend-as-a-service platform providing the database, authentication, and real-time APIs.
- **Vercel**: The cloud hosting platform on which the System is deployed.

---

## Requirements

### Requirement 1: Deployment and Hosting

> **Depends on:** None — foundation requirement

**User Story:** As a developer, I want the application deployed on Vercel with environment-based configuration, so that the system is publicly accessible and securely configured.

#### Acceptance Criteria

1. THE System SHALL be deployable to Vercel as a static React + Vite SPA with all environment variables injected via Vercel environment configuration; the required variables are: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LLM_API_KEY`, and `VITE_LLM_API_URL`.
2. THE System SHALL NOT hard-code any API keys, database URLs, LLM API keys, or secrets in the source code; all such values SHALL be read exclusively from Vite environment variables prefixed with `VITE_`.
3. WHEN the application is built with `vite build`, THE System SHALL produce a production-ready static bundle with no build errors.
4. THE System SHALL configure client-side routing so that all routes return the root `index.html` on Vercel (via a `vercel.json` rewrite rule), preventing 404 errors on direct URL access.

---

### Requirement 2: Seed Data Initialization

> **Depends on:** R1 (Deployment)

**User Story:** As a developer, I want all reference data pre-loaded into Supabase at system initialization from the seed CSV files, so that the system is immediately usable without manual data entry for foundational entities.

#### Acceptance Criteria

1. WHEN the System is initialized, THE System SHALL pre-load all Seed_Data from the `seed/*.csv` files into Supabase, covering: Academic Years (2021–2030), Academic Semesters (SPRING, SUMMER, FALL), Academic Periods (2026 SPRING as active, 2026 FALL, 2027 SPRING, 2027 FALL), Disciplines (4 records), Programs (3 records), Semester Numbers (1ST–8TH), Section Numbers (A–J), Degree Levels (5 records), Campuses (3 records), Sections (all records from sections.csv), and Teachers (12 records from teachers.csv).
2. WHEN Teacher seed data is loaded, THE System SHALL auto-create a corresponding Supabase Auth user for each Teacher using the Teacher's email and initial password from the seed file, and SHALL assign the Teacher role to each created user.
3. THE seed script SHALL be idempotent: re-running the seed SHALL NOT create duplicate records; existing records SHALL be skipped or upserted without error.
4. WHEN the Admin views the Data_Management_Page after initialization, THE System SHALL display the correct seeded record counts for all pre-loaded entity cards.
5. THE System SHALL mark Academic_Semester records as system-defined so that the Admin_Panel renders them as read-only and suppresses create, edit, and delete controls for those records.

---

### Requirement 3: User Authentication and Role Management

> **Depends on:** R1 (Deployment), R2 (Seed Data)

**User Story:** As an Admin, I want to manage all user accounts and enforce role-based access, so that only authorized personnel can access the system and each role sees only what is relevant to them.

#### Acceptance Criteria

1. THE System SHALL support exactly three roles: Admin, Teacher, and Student.
2. THE System SHALL authenticate users using standard email and password credentials via Supabase Auth.
3. WHEN a user attempts to log in with invalid credentials, THE System SHALL display a descriptive authentication error and SHALL NOT grant access.
4. WHEN a user logs in for the First_Login, THE System SHALL redirect the user to a mandatory password-change screen before displaying the Dashboard.
5. WHILE a First_Login password change is pending, THE System SHALL block access to all Dashboard routes.
6. THE System SHALL allow only the Admin to create, deactivate, or delete user accounts.
7. IF a deactivated user attempts to log in, THEN THE System SHALL reject the login and display an account-deactivated message.
8. THE System SHALL enforce role-based route protection so that Teacher routes are inaccessible to Students and vice versa, and Admin routes are inaccessible to both Teachers and Students.

---

### Requirement 4: Academic Period Management

> **Depends on:** R2 (Seed Data)

**User Story:** As an Admin, I want to manage Academic Years, Academic Semesters, and Academic Periods and associate each Timetable with a specific Academic Period, so that schedules are clearly organized by academic calendar context.

#### Acceptance Criteria

1. THE System SHALL pre-load Academic_Year records for years 2021 through 2030 from seed data; the Admin SHALL be able to add additional Academic_Year records beyond this range.
2. THE System SHALL define Academic_Semester values as a fixed, system-level enumeration: SPRING (short name SP, short code S), SUMMER (short name SU, short code SU), and FALL (short name FA, short code F); the Admin SHALL NOT be able to create, rename, or delete Academic_Semester values.
3. THE Admin_Panel SHALL allow the Admin to create an Academic_Period by selecting an existing Academic_Year and one of the three fixed Academic_Semester values; the System SHALL auto-generate the Academic_Period name using the format `{year_name} {semester_name}` (e.g., "2026 SPRING").
4. IF an Admin attempts to create an Academic_Period with an Academic_Year and Academic_Semester combination that already exists, THEN THE System SHALL reject the creation and return a descriptive duplicate-entry error.
5. THE System SHALL allow exactly one Academic_Period to have `is_active` set to true at any given time; activating a new Academic_Period SHALL automatically deactivate the previously active one.
6. WHEN a Timetable is created, THE System SHALL require the Admin to associate it with exactly one Academic_Period.
7. THE System SHALL auto-generate the Timetable name from its Academic_Period using the format `{year_name} {semester_name} Timetable` (e.g., "2026 SPRING Timetable").
8. THE System SHALL prevent a Timetable from being saved without an associated Academic_Period.
9. THE System SHALL allow each Academic_Period to be associated with at most one active (draft or published) Timetable at a time.

---

### Requirement 5: Section Naming and Sorting

> **Depends on:** R2 (Seed Data)

**User Story:** As an Admin, I want Section names to be auto-generated from their component parts and displayed in a consistent custom sort order, so that sections are always identifiable and predictably ordered across the system.

#### Acceptance Criteria

1. WHEN a Section is created, THE System SHALL auto-generate the Section name using the formula `{discipline_short_name}-{semester_number_name}-{section_number}{program_short_code}` (e.g., BSARIN-1ST-1M, BSARIN-1ST-1E).
2. THE Admin_Panel SHALL allow the Admin to create a Section individually by selecting a Discipline, Semester_Number, Section_Number, and Program from dropdown lists populated with existing records.
3. THE Admin_Panel SHALL allow the Admin to bulk-create Sections via CSV upload; each CSV row SHALL supply the four component fields (discipline, semester number, section number, program) and the System SHALL derive the Section name automatically.
4. IF a Section name derived from the selected components already exists, THEN THE System SHALL reject the creation and return a descriptive duplicate-entry error.
5. WHEN Sections are listed anywhere in the System, THE System SHALL sort them by: discipline custom order (BSARIN → BSADARIN → MSARIN → PHARIN), then semester name A-Z ascending, then program custom order (M → E → W), then section number A-Z ascending.

---

### Requirement 6: Student ID Naming and Sorting

> **Depends on:** R3 (User Authentication), R5 (Section Naming)

**User Story:** As an Admin, I want Student IDs to be auto-generated from enrollment metadata and students to be displayed in a consistent custom sort order, so that each student is uniquely and predictably identified across the system.

#### Acceptance Criteria

1. WHEN a Student record is created, THE System SHALL accept the Student registration number as provided by the Admin; the naming pattern `{semester_short_code}{year_short_name}{campus_short_name}ARIN{degree_level_number}{program_short_code}{6-digit-sequence}` (e.g., F26BARIN1M01001) is the expected format and SHALL be used for validation reference only — the System SHALL NOT auto-generate Student IDs.
2. THE System SHALL validate that each provided Student registration number conforms to the expected naming pattern and SHALL reject any registration number that does not match, returning a descriptive validation error.
3. THE Admin_Panel SHALL require a CSV upload to create Student records in bulk; the CSV SHALL include the student registration number directly as a column, along with section assignment.
4. IF a derived Student ID already exists in the System, THEN THE System SHALL skip that row, record a descriptive duplicate-entry error, and continue processing remaining rows.
5. WHEN Students are listed anywhere in the System, THE System SHALL sort them by: semester short code custom order (S → F), then year short name A-Z ascending, then campus custom order (B → R → N), then degree level number A-Z ascending, then program custom order (M → E → W), then last 6 digits A-Z ascending.

---

### Requirement 7: Admin — Entity Management

> **Depends on:** R3 (User Authentication), R4 (Academic Period Management), R5 (Section Naming), R6 (Student ID Naming)

**User Story:** As an Admin, I want to view and manage all data entities — both pre-loaded seed data and upload-only entities — so that I can keep the academic data accurate and up to date.

#### Acceptance Criteria

**Category A — Seed Data Entities (pre-loaded at initialization):**

1. THE Admin_Panel SHALL allow the Admin to view all Academic_Year records; the Admin SHALL also be able to add new Academic_Year records beyond the seeded range (2021–2030).
2. THE Admin_Panel SHALL display all Academic_Semester records (SPRING, SUMMER, FALL) as read-only; the Admin SHALL NOT be able to create, edit, or delete Academic_Semester records.
3. THE Admin_Panel SHALL allow the Admin to create, read, update, and deactivate Academic_Period records by selecting an existing Academic_Year and an existing Academic_Semester.
4. THE Admin_Panel SHALL allow the Admin to view, update, and deactivate Discipline records; the Admin SHALL also be able to add new Disciplines.
5. THE Admin_Panel SHALL allow the Admin to view, update, and deactivate Program records; the Admin SHALL also be able to add new Programs.
6. THE Admin_Panel SHALL allow the Admin to view Semester_Number and Section_Number records; the Admin SHALL also be able to add new values beyond the seeded ranges.
7. THE Admin_Panel SHALL allow the Admin to view, update, and deactivate Degree_Level records; the Admin SHALL also be able to add new Degree_Levels.
8. THE Admin_Panel SHALL allow the Admin to view, update, and deactivate Campus records; the Admin SHALL also be able to add new Campuses.
9. THE Admin_Panel SHALL allow the Admin to view all seeded Section records and create new Sections individually by selecting a Discipline, Semester_Number, Section_Number, and Program; the System SHALL auto-generate the Section name using the formula `{discipline_short_name}-{semester_number_name}-{section_number}{program_short_code}`.
10. THE Admin_Panel SHALL allow the Admin to view, update, and deactivate Teacher accounts; each Teacher is associated with a unique email address and is also a Supabase Auth user.
11. WHEN a Teacher record is created from seed data, THE System SHALL auto-create a corresponding Supabase Auth user using the Teacher's email and initial password from the seed file.

**Category B — Upload-Only Entities (no seed data; Admin uploads individually or via CSV):**

12. THE Admin_Panel SHALL allow the Admin to create, read, update, and deactivate Course records, each requiring a unique course code, a display name, a `credit_hours` value, and a `contact_hours_minutes` value; `contact_hours_minutes` SHALL be a positive integer that is a multiple of 15 (e.g., 90, 135, 180).
13. WHEN a Course record is saved, THE System SHALL validate that `contact_hours_minutes ÷ 2` produces a Slot_Duration value within the supported set {30, 45, 60, 75, 90}; IF the derived per-slot duration is not in the supported set, THEN THE System SHALL reject the record and return a descriptive validation error.
14. THE System SHALL derive and display the per-slot duration for each Course as `contact_hours_minutes ÷ 2` minutes and the weekly slot count as 2.
15. THE Admin_Panel SHALL allow the Admin to create, read, update, and deactivate Room records, each requiring a unique name and a capacity value.
16. THE Admin_Panel SHALL allow the Admin to bulk-upload Students via CSV; each Student record SHALL be associated with exactly one Section and the Admin SHALL provide the Student registration number directly in the CSV; the System SHALL NOT auto-generate Student IDs.
17. WHEN the Admin uploads a CSV file for bulk Student import, THE System SHALL parse each row, accept the provided registration number as the Student ID, validate it against the expected pattern `{semester_short_code}{year_short_name}{campus_short_name}ARIN{degree_level_number}{program_short_code}{6-digit-sequence}`, and enroll each valid Student in the resolved Section.
18. WHEN the Admin uploads a CSV file for bulk Course import, THE System SHALL parse each row and create a Course record for each valid row; the CSV SHALL include `course_code`, `name`, `credit_hours`, and `contact_hours_minutes` columns.
19. WHEN the Admin uploads a CSV file for bulk Room import, THE System SHALL parse each row and create a Room record for each valid row.
20. IF a CSV row contains missing required fields or a duplicate identifier, THEN THE System SHALL skip that row, record a descriptive error for it, and continue processing remaining rows.
21. AFTER a CSV upload completes, THE System SHALL display a summary report showing the count of successful imports and the list of skipped rows with their errors.

---

### Requirement 8: Admin Page Structure

> **Depends on:** R7 (Entity Management), R4 (Academic Period Management)

**User Story:** As an Admin, I want three distinct top-level pages beyond the Dashboard — Data Management, Timetable Management, and Timetable Scheduling — so that I can navigate clearly between master data administration, timetable lifecycle management, and active scheduling work.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide three top-level pages in addition to the Dashboard: Data_Management_Page, Timetable_Management_Page, and Timetable_Scheduling_Page.
2. THE Data_Management_Page SHALL display a card or section for each of the following master data entities: Academic Years, Academic Semesters, Academic Periods, Disciplines, Programs, Semester Numbers, Section Numbers, Degree Levels, Campuses, Sections, Teachers, Students, Courses, Rooms, Slots, and Slot_Durations.
3. WHEN the Admin views the Data_Management_Page, THE System SHALL display a quick-stats count of existing records for each entity card.
4. WHEN the Admin selects an entity card on the Data_Management_Page, THE System SHALL navigate to the full management view for that entity, supporting the operations permitted for that entity (create, read, update, deactivate, or view-only as applicable).
5. THE Timetable_Management_Page SHALL list all Timetables with their Academic_Period, current status (draft, published, or archived), and available actions (view, duplicate, convert, publish, archive).
6. WHEN the Admin selects the duplicate or convert action on the Timetable_Management_Page, THE System SHALL prompt the Admin to assign a new Academic_Period before proceeding.
7. THE Timetable_Scheduling_Page SHALL serve as the active workspace for assigning Slots to a selected Timetable.
8. THE Timetable_Scheduling_Page SHALL provide access to the AI_Scheduler chat panel from within the scheduling workspace.
9. WHEN the Admin navigates between the three top-level pages, THE System SHALL update the active route without a full page reload.

---

### Requirement 9: Time Slot Granularity and Duration Management

> **Depends on:** R1 (Deployment)

**User Story:** As an Admin, I want to define and manage time slot durations in 15-minute increments, so that I can configure the timetable to match different academic scheduling modes (standard lectures, smart lockdown phases, etc.).

#### Acceptance Criteria

1. THE System SHALL represent all time boundaries using a 15-minute granularity grid (i.e., valid start/end times are multiples of 15 minutes from midnight).
2. THE System SHALL support Slot_Duration values of 30, 45, 60, 75, and 90 minutes.
3. WHEN an Admin creates or edits a Slot, THE System SHALL only allow start and end times that align to the 15-minute grid.
4. WHEN an Admin configures a scheduling mode, THE System SHALL allow a single global or per-timetable Slot_Duration to be selected from the supported values.
5. IF a Slot_Duration value outside the set {30, 45, 60, 75, 90} is submitted, THEN THE System SHALL reject the input and return a descriptive validation error.
6. THE System SHALL allow the Admin to define a "bifurcation duration" for splitting a single Slot into two consecutive shorter Slots of equal length.
7. WHEN a bifurcation is applied to a Slot, THE System SHALL replace the original Slot with two new Slots whose combined duration equals the original Slot_Duration.
8. THE System SHALL constrain all Slot start and end times to the Scheduling_Window: no earlier than 08:00 and no later than 20:00.
9. IF a Slot start time is before 08:00 or a Slot end time is after 20:00, THEN THE System SHALL reject the Slot and return a descriptive validation error.
10. THE System SHALL display the scheduling grid from 08:00 to 20:00 in all timetable views, with 15-minute row granularity.

---

### Requirement 10: Scheduling Days Configuration

> **Depends on:** R9 (Time Slot Granularity), R4 (Academic Period Management)

**User Story:** As an Admin, I want to configure which days of the week are active for a Timetable, with Monday through Thursday always enabled as standard days and Friday through Sunday optionally enabled as extended days, so that the timetable accurately reflects the institution's working calendar.

#### Acceptance Criteria

1. THE System SHALL support seven Scheduling_Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, and Sunday.
2. WHEN a new Timetable is created, THE System SHALL automatically enable Monday, Tuesday, Wednesday, and Thursday as standard scheduling days.
3. THE Admin_Panel SHALL allow the Admin to optionally enable or disable Friday, Saturday, and Sunday as extended scheduling days on a per-Timetable basis.
4. WHEN a day is disabled for a Timetable, THE System SHALL prevent Slots from being created on that day for that Timetable.
5. IF a Slot is submitted for a disabled day, THEN THE System SHALL reject the Slot and return a descriptive error identifying the disabled day.
6. THE System SHALL display only the enabled days in all timetable views for a given Timetable.
7. THE Admin_Panel SHALL allow the Admin to change the enabled/disabled state of extended days (Friday–Sunday) at any time before the Timetable is published.
8. WHEN the Admin attempts to disable an extended day, THE System SHALL first inspect all Slots assigned to that day in the current Timetable and apply the following decision flow:
   - IF all Slots on that day are empty (no course, teacher, room, or section assigned), THEN THE System SHALL disable the day immediately and display a confirmation message indicating it was safe to remove.
   - IF one or more Slots on that day are occupied, THEN THE System SHALL attempt to automatically reschedule those occupied Slots into free time windows on the remaining enabled days, respecting all Conflict rules (teacher, room, and section conflicts).
   - IF all occupied Slots are successfully rescheduled, THEN THE System SHALL disable the day, apply the rescheduled Slot assignments, and notify the Admin of the changes made.
   - IF one or more occupied Slots cannot be rescheduled due to no available conflict-free time window, THEN THE System SHALL display a detailed confirmation dialog listing the unresolvable Slots and explicitly ask the Admin to confirm permanent removal of those Slots; THE System SHALL NOT remove any Slots until the Admin explicitly confirms.
9. IF the Admin cancels the confirmation dialog in the unresolvable case, THEN THE System SHALL leave the day enabled and all Slots unchanged.

---

### Requirement 11: Admin — Scheduling via CSV

> **Depends on:** R7 (Entity Management)

**User Story:** As an Admin, I want to upload a CSV file that maps courses to sections and teachers, so that I can quickly populate the scheduling data without entering each assignment manually.

#### Acceptance Criteria

1. THE System SHALL accept a scheduling CSV file with the columns: `course_code`, `section_code`, `teacher_code`.
2. WHEN the Admin uploads a scheduling CSV, THE System SHALL validate that each `course_code`, `section_code`, and `teacher_code` references an existing, active entity.
3. IF a scheduling CSV row references a non-existent or inactive entity, THEN THE System SHALL skip that row and include it in the error summary.
4. WHEN all rows in a scheduling CSV are valid, THE System SHALL create Course-Section-Teacher assignment records for each row.
5. THE System SHALL prevent duplicate Course-Section-Teacher assignments and SHALL report duplicates as errors in the summary.

---

### Requirement 12: Conflict Detection and Resolution

> **Depends on:** R9 (Time Slot Granularity), R10 (Scheduling Days), R11 (Scheduling via CSV)

**User Story:** As an Admin, I want the system to automatically detect and report scheduling conflicts, so that no teacher, room, or section is double-booked at the same time.

#### Acceptance Criteria

1. WHEN a Slot is created or modified, THE System SHALL check for Teacher Conflicts (same teacher assigned to overlapping Slots on the same day).
2. WHEN a Slot is created or modified, THE System SHALL check for Room Conflicts (same room assigned to overlapping Slots on the same day).
3. WHEN a Slot is created or modified, THE System SHALL check for Section Conflicts (same section assigned to overlapping Slots on the same day).
4. IF any Conflict is detected, THEN THE System SHALL reject the Slot creation or modification and return a descriptive Conflict message identifying the conflicting Slot.
5. THE System SHALL provide a Conflict report view in the Admin_Panel listing all current Conflicts in a Timetable.
6. WHEN the Admin resolves all Conflicts in a Timetable, THE System SHALL mark the Timetable as conflict-free.

---

### Requirement 13: Course Weekly Slot Scheduling Constraint

> **Depends on:** R9 (Time Slot Granularity), R7 (Entity Management), R12 (Conflict Detection)

**User Story:** As an Admin, I want each course to be scheduled exactly twice per week with a per-slot duration derived from its contact hours, so that the timetable consistently reflects the institution's weekly teaching load for every course.

#### Acceptance Criteria

1. EACH Course SHALL be scheduled as exactly 2 Slots per week within a Timetable; the System SHALL enforce this constraint during both manual and AI-assisted scheduling.
2. THE per-slot duration for a Course SHALL be derived as `contact_hours_minutes ÷ 2` minutes (e.g., a Course with `contact_hours_minutes = 180` SHALL produce 2 Slots of 90 minutes each).
3. WHEN the AI_Scheduler or manual scheduling assigns Slots for a Course, THE System SHALL use the Course's derived per-slot duration as the fixed Slot_Duration for those Slots.
4. IF a Slot is submitted for a Course with a duration that does not match the Course's derived per-slot duration, THEN THE System SHALL reject the Slot and return a descriptive validation error.
5. THE Timetable_Scheduling_Page SHALL display the required weekly slot count (2) and the derived per-slot duration for each Course in the scheduling workspace to guide the Admin.
6. WHEN the Admin views a Timetable's completion status, THE System SHALL indicate for each Course-Section assignment whether both required weekly Slots have been scheduled (complete) or are still pending (incomplete).
7. THE System SHALL prevent publishing a Timetable that has any Course-Section assignment with fewer than 2 scheduled Slots, and SHALL display a list of incomplete Course-Section assignments to the Admin before blocking the publish action.

---

### Requirement 14: Timetable Conversion (Smart Duplication)

> **Depends on:** R9 (Time Slot Granularity), R12 (Conflict Detection), R4 (Academic Period Management), R13 (Course Weekly Slot Scheduling Constraint)

**User Story:** As an Admin, I want to duplicate an existing timetable and automatically convert all slot durations to a new target duration, so that I can switch between scheduling modes (e.g., exam prep vs. normal semester) without rebuilding the timetable from scratch.

#### Acceptance Criteria

1. WHEN an Admin initiates a Timetable_Conversion, THE System SHALL create a new Timetable that is a copy of the source Timetable with all Slot_Durations adjusted to the target Slot_Duration.
2. WHEN an Admin initiates a Timetable_Conversion, THE System SHALL require the Admin to assign a new Academic_Period to the converted Timetable that is distinct from the source Timetable's Academic_Period.
3. THE System SHALL auto-generate the name of the new Timetable from its assigned Academic_Period (e.g., "2026 SPRING Timetable").
4. THE System SHALL preserve the day, course, teacher, room, and section assignments of each Slot during Timetable_Conversion.
5. WHEN the target Slot_Duration is smaller than the source Slot_Duration, THE System SHALL split each source Slot into the minimum number of consecutive target-duration Slots required to fill the original time block.
6. WHEN the target Slot_Duration is larger than the source Slot_Duration, THE System SHALL merge consecutive same-course, same-teacher, same-room, same-section Slots into a single Slot of the target duration where possible.
7. IF a Timetable_Conversion would produce a Conflict, THEN THE System SHALL report each Conflict to the Admin before saving the converted Timetable.
8. THE System SHALL allow the Admin to cancel a Timetable_Conversion after reviewing reported Conflicts without saving the converted Timetable.

---

### Requirement 15: AI-Powered Scheduling Assistant

> **Depends on:** R9 (Time Slot Granularity), R12 (Conflict Detection), R1 (Deployment), R13 (Course Weekly Slot Scheduling Constraint)

**User Story:** As an Admin, I want to instruct an AI assistant in natural language to schedule or modify time slots, so that I can build and adjust timetables faster without manually filling every slot.

#### Acceptance Criteria

1. THE System SHALL provide an AI_Scheduler chat interface accessible to the Admin from the scheduling dashboard.
2. WHEN the Admin submits a natural-language scheduling instruction, THE AI_Scheduler SHALL interpret the instruction and propose one or more Slot assignments.
3. THE AI_Scheduler SHALL validate proposed Slot assignments against all Conflict rules before presenting them to the Admin.
4. WHEN proposed Slot assignments contain Conflicts, THE AI_Scheduler SHALL describe each Conflict and offer alternative suggestions.
5. WHEN the Admin approves AI_Scheduler proposals, THE System SHALL persist the approved Slots to the database.
6. THE System SHALL read the LLM_Provider API key from the environment variable `VITE_LLM_API_KEY` and the LLM_Provider base URL from `VITE_LLM_API_URL`; both variables SHALL be configured in the Vercel environment and SHALL NOT be hard-coded in the source code.
7. WHEN both `VITE_LLM_API_KEY` and `VITE_LLM_API_URL` are present, THE System SHALL route all AI_Scheduler requests to the configured LLM_Provider endpoint.
8. IF either `VITE_LLM_API_KEY` or `VITE_LLM_API_URL` is missing or empty, THEN THE AI_Scheduler SHALL display a descriptive configuration-error message to the Admin and SHALL disable the chat input until the variables are set.
9. IF the LLM_Provider API call fails or returns an error, THEN THE AI_Scheduler SHALL display a descriptive error message to the Admin and SHALL NOT modify any Slots.

---

### Requirement 16: Data Persistence and Real-Time Updates

> **Depends on:** R3 (User Authentication), R7 (Entity Management), R12 (Conflict Detection)

**User Story:** As any authenticated user, I want timetable changes to be reflected immediately without manual refresh, so that I always see the most current schedule.

#### Acceptance Criteria

1. THE System SHALL persist all Timetable, Slot, User, Course, Section, Room, and Swap_Request data in Supabase.
2. WHEN a Slot is created, updated, or deleted by the Admin or via an approved Swap_Request, THE System SHALL propagate the change to all connected clients in real time using Supabase Realtime subscriptions.
3. THE System SHALL apply Row Level Security policies in Supabase so that each role can only read and write data permitted by their role.
4. WHEN a Student queries Slot data, THE System SHALL return only Slots belonging to the Student's Section.
5. WHEN a Teacher queries Slot data, THE System SHALL return all Slots (for view purposes) but restrict write operations to Swap_Request submissions only.

---

### Requirement 17: Timetable Views

> **Depends on:** R9 (Time Slot Granularity), R10 (Scheduling Days), R16 (Data Persistence)

**User Story:** As any authenticated user, I want to view the timetable filtered by section, teacher, room, or day, so that I can quickly find the schedule relevant to me.

#### Acceptance Criteria

1. THE System SHALL provide a Section-wise timetable view displaying all Slots for a selected Section grouped by day.
2. THE System SHALL provide a Teacher-wise timetable view displaying all Slots for a selected Teacher grouped by day.
3. THE System SHALL provide a Room-wise timetable view displaying all Slots for a selected Room grouped by day.
4. THE System SHALL provide a Day-wise timetable view displaying all Slots for a selected day across all Sections, Teachers, and Rooms.
5. WHEN a Student accesses the timetable views, THE System SHALL default the Section-wise view to the Student's own Section.
6. WHEN a Teacher accesses the timetable views, THE System SHALL default the Teacher-wise view to the Teacher's own schedule.
7. THE System SHALL make all four timetable views accessible to Admin, Teacher, and Student roles.
8. WHEN a user selects a filter (section, teacher, room, or day), THE System SHALL update the timetable view without a full page reload.
9. WHEN rendering any timetable view, THE System SHALL display the time axis from 08:00 to 20:00 with 15-minute row granularity.
10. THE System SHALL display only the days enabled for the selected Timetable in all timetable view layouts.

---

### Requirement 18: Teacher Swap Requests

> **Depends on:** R3 (User Authentication), R12 (Conflict Detection), R17 (Timetable Views), R16 (Data Persistence)

**User Story:** As a Teacher, I want to request a time slot swap with another teacher, so that I can resolve personal scheduling conflicts without requiring Admin intervention for every change.

#### Acceptance Criteria

1. THE System SHALL allow a Teacher to submit a Swap_Request specifying the Teacher's own Slot and a target Slot belonging to another Teacher.
2. WHEN a Swap_Request is submitted, THE System SHALL validate that swapping the two Slots would not introduce any new Conflicts.
3. IF the proposed swap would introduce a Conflict, THEN THE System SHALL reject the Swap_Request and return a descriptive Conflict message.
4. WHEN a valid Swap_Request is submitted, THE System SHALL notify the target Teacher of the pending request.
5. WHEN the target Teacher approves a Swap_Request, THE System SHALL atomically exchange the two Slots and update the Timetable.
6. WHEN the target Teacher rejects a Swap_Request, THE System SHALL mark the request as rejected and notify the requesting Teacher.
7. THE Admin_Panel SHALL display all pending, approved, and rejected Swap_Requests and SHALL allow the Admin to override or cancel any Swap_Request.

---

### Requirement 19: Student Timetable Access

> **Depends on:** R3 (User Authentication), R17 (Timetable Views)

**User Story:** As a Student, I want to view my own section's timetable and browse other views, so that I can plan my academic week.

#### Acceptance Criteria

1. WHEN a Student logs in, THE Dashboard SHALL display the Student's own Section timetable for the current active Timetable.
2. THE System SHALL allow a Student to navigate to Section-wise, Teacher-wise, Room-wise, and Day-wise timetable views.
3. THE System SHALL prevent a Student from modifying any Slot or submitting any scheduling request.
4. WHEN no active Timetable exists, THE System SHALL display an informational message to the Student indicating that no timetable is currently published.

---

### Requirement 20: Role-Specific Dashboards

> **Depends on:** R3 (User Authentication), R17 (Timetable Views), R18 (Teacher Swap Requests), R19 (Student Timetable Access)

**User Story:** As any authenticated user, I want a professional, role-appropriate dashboard, so that I can immediately access the features most relevant to my role.

#### Acceptance Criteria

1. THE System SHALL display a distinct Dashboard for each role: Admin_Dashboard, Teacher_Dashboard, and Student_Dashboard.
2. THE Admin_Dashboard SHALL provide quick-access widgets for: total sections, total teachers, total students, total rooms, active timetable status, and pending Swap_Requests.
3. THE Teacher_Dashboard SHALL display the Teacher's own weekly timetable and a list of pending Swap_Requests involving the Teacher.
4. THE Student_Dashboard SHALL display the Student's own Section timetable for the current active Timetable.
5. THE System SHALL apply a professional, vibrant academic visual design using a consistent color palette, typography, and layout across all Dashboards.
6. WHEN the viewport width is below 768px, THE System SHALL render all Dashboard layouts in a responsive single-column format.

---

### Requirement 21: plan.md Output Artifact

> **Depends on:** R1 through R20 — meta-requirement placed last

**User Story:** As a developer, I want a detailed `plan.md` file that describes the application purpose, architecture, and step-by-step build instructions formatted as a Kiro agentic prompt, so that an AI coding agent can build the system incrementally with professional standards.

#### Acceptance Criteria

1. THE System SHALL include a `plan.md` file at the repository root describing the application purpose, tech stack, folder structure, and all major features.
2. THE `plan.md` SHALL be structured as a sequenced, step-by-step prompt suitable for guiding a Kiro AI coding agent through the full build lifecycle.
3. THE `plan.md` SHALL include sections for: project setup, database schema design, authentication, entity management, timetable scheduling, AI integration, timetable views, swap requests, dashboards, testing strategy, and deployment.
4. THE `plan.md` SHALL specify that the agent must ask for confirmation or additional information before executing each major step.
5. THE `plan.md` SHALL follow professional designer, developer, and tester standards including accessibility, security, and performance considerations.
