# DAI-TSMS UI Adaptation - Implementation Tasks

## Phase 1: Edge Functions

### 1.1 Create User Edge Function
- [x] Create `supabase/functions/create-user/index.ts`
- [x] Implement JWT verification using service role client
- [x] Implement admin role check
- [x] Implement request body validation (email, password, role, displayName)
- [x] Implement Supabase Auth user creation with email_confirm=true
- [x] Implement user_profiles record insertion
- [x] Implement teacher record insertion for teacher role
- [x] Implement student record insertion for student role
- [x] Implement rollback logic on database insert failures
- [x] Implement error handling for all error cases (401, 403, 400, 500)
- [x] Deploy with --no-verify-jwt flag
- [x] Test with manual API calls (create teacher, create student, error cases)

### 1.2 Admin Set Password Edge Function
- [x] Create `supabase/functions/admin-set-password/index.ts`
- [x] Implement JWT verification using service role client
- [x] Implement admin/teacher role check
- [x] Implement teacher scope validation (student in teacher's section)
- [x] Implement password validation (8+ chars, uppercase, number)
- [x] Implement auth password update via service role
- [x] Implement must_change_password flag update
- [x] Implement error handling for all error cases (401, 403, 400, 500)
- [x] Deploy with --no-verify-jwt flag
- [x] Test with manual API calls (admin reset, teacher reset, scope violation)

## Phase 2: Auth Context & Profile Loading

### 2.1 Update AuthContext with Profile Loading
- [x] Update `src/contexts/AuthContext.jsx` to add profile state
- [x] Implement loadProfile() method with timeout handling (5s)
- [x] Implement error recovery (continue with user if profile fails)
- [x] Implement refreshProfile() method
- [x] Implement completePasswordChange() method
- [x] Update useEffect to call loadProfile on session change
- [x] Add loading state management
- [x] Test profile loading with valid session
- [x] Test profile loading timeout
- [x] Test profile loading error recovery
- [x] Test password change flow

### 2.2 Update App Shell with Loading State
- [x] Update `src/components/layout/AppShell.jsx` to show loading spinner
- [x] Show spinner while auth context is loading
- [x] Prevent navigation until profile is loaded
- [x] Test loading state on app initialization

### 2.3 Create Password Change Page
- [x] Create `src/pages/PasswordChange.jsx`
- [x] Implement form with password input and validation
- [x] Implement completePasswordChange() call
- [x] Implement error handling and success message
- [x] Add to routing for users with must_change_password=true
- [x] Test password change flow

## Phase 3: Layout & Styling System

### 3.1 Update Tailwind Configuration
- [x] Update `tailwind.config.js` with new color palette
- [x] Add Playfair Display, DM Sans, JetBrains Mono fonts
- [x] Add custom shadows (card, lift, glow)
- [x] Add custom border radius (xl2, xl3)
- [x] Add xs breakpoint (375px)
- [x] Add scrollbar-hide utility plugin
- [x] Test color values in browser

### 3.2 Update CSS Utilities
- [x] Update `src/index.css` with component classes
- [x] Add .btn and button variants (.btn-primary, .btn-secondary, .btn-danger)
- [x] Add .card class
- [x] Add .form-input class
- [x] Add .badge and badge variants
- [x] Add .table-base class
- [x] Add .sidebar-link class
- [x] Add .page-title class
- [x] Add .stat-grid-responsive class
- [x] Add .table-wrap class
- [x] Add .fade-up animation
- [x] Test all classes in browser

### 3.3 Create Layout Components
- [x] Create `src/components/layout/AdminLayout.jsx`
- [x] Create `src/components/layout/Sidebar.jsx` with gradient background
- [x] Create `src/components/layout/MobileNav.jsx` with hamburger menu
- [x] Create `src/components/layout/Footer.jsx`
- [x] Implement responsive sidebar (hidden on mobile)
- [x] Implement mobile drawer with slide-in animation
- [x] Implement navigation links with active state
- [x] Test layout on desktop, tablet, mobile

### 3.4 Update UI Components
- [x] Update `src/components/ui/Button.jsx` to use new styling
- [x] Update `src/components/ui/Input.jsx` to use new styling
- [x] Update `src/components/ui/Badge.jsx` to use new styling
- [x] Update `src/components/ui/Card.jsx` to use new styling
- [x] Update `src/components/ui/Table.jsx` to use new styling
- [x] Update `src/components/ui/Spinner.jsx` to use primary color
- [x] Update `src/components/ui/Modal.jsx` to use new styling
- [x] Update `src/components/ui/Toast.jsx` to use new styling
- [x] Test all components with new styling

## Phase 4: Dashboard & Pages

### 4.1 Create Admin Dashboard
- [x] Create `src/pages/admin/Dashboard.jsx`
- [x] Implement stat cards (Teachers, Students, Sections, Subjects, Questions, Attempts)
- [x] Implement stat card icons and colors
- [x] Implement "Performance by Teacher" table
- [x] Implement "Top Students" table
- [x] Implement badge styling for scores
- [x] Implement loading states for stat cards and tables
- [x] Implement error handling and retry
- [x] Test dashboard with data
- [x] Test dashboard with empty data
- [x] Test dashboard loading states

### 4.2 Create User Management Pages
- [x] Create `src/pages/admin/Users.jsx` (list users)
- [x] Create `src/pages/admin/CreateUser.jsx` (create user form)
- [x] Implement user creation form with validation
- [x] Implement role-based field display (teacher vs student)
- [x] Implement form submission to create-user edge function
- [x] Implement error handling and validation messages
- [x] Implement success message and redirect
- [x] Test user creation for teachers
- [x] Test user creation for students
- [x] Test validation errors

### 4.3 Update Existing Pages
- [x] Update all admin pages to use AdminLayout
- [x] Update all pages to use new component classes
- [x] Update all pages to use new color palette
- [x] Update all pages to use new typography
- [x] Test all pages with new layout and styling

## Phase 5: Responsive Design & Mobile

### 5.1 Test Responsive Design
- [x] Test layout at xs (375px)
- [x] Test layout at sm (640px)
- [x] Test layout at md (768px)
- [x] Test layout at lg (1024px)
- [x] Test layout at xl (1280px)
- [x] Test sidebar visibility at each breakpoint
- [x] Test table scrolling on mobile
- [x] Test stat card grid at each breakpoint
- [x] Test form layout on mobile
- [x] Test touch targets (44px minimum)

### 5.2 Test Mobile Navigation
- [x] Test hamburger menu on mobile
- [x] Test drawer slide-in animation
- [x] Test drawer close on link click
- [x] Test drawer close on outside click
- [x] Test navigation links on mobile

### 5.3 Test Mobile Forms
- [x] Test form input focus on mobile
- [x] Test keyboard appearance on mobile
- [x] Test form submission on mobile
- [x] Test error messages on mobile
- [x] Test success messages on mobile

## Phase 6: Error Handling & Loading States

### 6.1 Implement Error Handling
- [x] Implement 401 error handling (redirect to login)
- [x] Implement 403 error handling (show error toast)
- [x] Implement 400 error handling (show field errors)
- [x] Implement 500 error handling (show error toast with retry)
- [x] Implement timeout error handling (show retry button)
- [x] Test all error scenarios

### 6.2 Implement Loading States
- [x] Implement profile loading spinner
- [x] Implement data loading spinner
- [x] Implement skeleton states for cards
- [x] Implement skeleton states for tables
- [x] Implement disabled state for buttons during submission
- [x] Test all loading states

### 6.3 Implement Toast Notifications
- [x] Create `src/components/ui/Toast.jsx` if not exists
- [x] Implement success toast
- [x] Implement error toast
- [x] Implement warning toast
- [x] Implement auto-dismiss after 5s
- [x] Test toast notifications

## Phase 7: Testing

### 7.1 Unit Tests
- [x] Test AuthContext profile loading
- [x] Test AuthContext error recovery
- [x] Test form validation logic
- [x] Test component rendering
- [x] Test color palette values

### 7.2 Integration Tests
- [x] Test user creation flow (edge function + DB)
- [x] Test password reset flow (edge function + auth)
- [x] Test dashboard data loading
- [x] Test auth context initialization
- [x] Test profile loading with timeout

### 7.3 Property-Based Tests
- [x] PBT: Profile loading resilience (timeout handling)
- [x] PBT: Edge function idempotence (create-user)
- [x] PBT: Edge function idempotence (admin-set-password)
- [x] PBT: Responsive layout at all breakpoints
- [x] PBT: Color palette consistency

### 7.4 Manual Testing
- [x] Test user creation as admin
- [x] Test password reset as admin
- [x] Test password reset as teacher
- [x] Test dashboard with data
- [x] Test dashboard with empty data
- [x] Test responsive design on real devices
- [x] Test error scenarios
- [x] Test loading states

## Phase 8: Documentation & Deployment

### 8.1 Documentation
- [x] Document edge function deployment steps
- [x] Document auth context usage
- [x] Document component usage
- [x] Document styling system
- [x] Document responsive design approach
- [x] Create migration guide for existing pages

### 8.2 Deployment
- [x] Deploy edge functions to production
- [x] Deploy frontend changes to production
- [x] Monitor for errors and issues
- [x] Gather user feedback
- [x] Make adjustments as needed

## Correctness Properties

### Property 1: Profile Loading Resilience
**Description:** Profile loading either succeeds or fails gracefully without hanging

**Test Type:** Property-Based Test

**Implementation:**
- Generate random user sessions
- Call loadProfile() for each session
- Verify profile loads within 5s timeout
- Verify error is logged on timeout
- Verify user state is set even if profile fails

### Property 2: Edge Function Idempotence (Create User)
**Description:** Calling create-user multiple times with same parameters produces same result

**Test Type:** Property-Based Test

**Implementation:**
- Generate random user creation requests
- Call create-user edge function multiple times
- Verify same userId is returned
- Verify no duplicate records are created
- Verify error on second call (email already exists)

### Property 3: Edge Function Idempotence (Set Password)
**Description:** Calling admin-set-password multiple times with same parameters produces same result

**Test Type:** Property-Based Test

**Implementation:**
- Generate random password reset requests
- Call admin-set-password edge function multiple times
- Verify password is updated to same value
- Verify must_change_password flag is cleared
- Verify no errors on repeated calls

### Property 4: Responsive Layout
**Description:** Layout renders correctly at all breakpoints without overflow or misalignment

**Test Type:** Property-Based Test

**Implementation:**
- Generate random viewport sizes (375px to 1920px)
- Render layout at each size
- Verify no horizontal overflow
- Verify no misalignment
- Verify sidebar visibility matches breakpoint

### Property 5: Color Palette Consistency
**Description:** All color values in tailwind config match design specification

**Test Type:** Property-Based Test

**Implementation:**
- Parse tailwind config
- Verify primary color is #1a56db
- Verify secondary color is #7c3aed
- Verify accent color is #f59e0b
- Verify success color is #10b981
- Verify danger color is #ef4444

### Integration Test 1: User Creation Flow
**Description:** Admin creates teacher/student via edge function, verify auth user and profile records exist

**Test Type:** Integration Test

**Scope:** 2-3 representative examples
- Create teacher with all fields
- Create student with all fields
- Create user with invalid email (error case)

### Integration Test 2: Password Reset Flow
**Description:** Admin/teacher resets password, verify user can login with new password

**Test Type:** Integration Test

**Scope:** 2-3 representative examples
- Admin resets teacher password
- Teacher resets student password
- Teacher attempts to reset student outside section (error case)

### Integration Test 3: Dashboard Data Loading
**Description:** Dashboard loads and displays stat cards and tables with real data

**Test Type:** Integration Test

**Scope:** 1-2 representative examples
- Dashboard with data (multiple teachers, students, attempts)
- Dashboard with empty data (no records)

### Integration Test 4: Auth Context Initialization
**Description:** App initializes with session, profile loads, user can navigate

**Test Type:** Integration Test

**Scope:** 2-3 representative examples
- App initializes with authenticated user
- App initializes with unauthenticated user
- App initializes with user but profile missing

