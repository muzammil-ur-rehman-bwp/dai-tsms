# DAI-TSMS UI Adaptation - Design Document

## Overview

This design document translates the requirements into a technical implementation plan. It specifies the architecture, component structure, edge functions, styling system, and integration patterns needed to adapt DAI-TSMS with dai-nsct patterns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DAI-TSMS Frontend                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Application                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  AuthContext (Profile Loading + Error Handling)│  │  │
│  │  │  - loadProfile() with timeout handling         │  │  │
│  │  │  - completePasswordChange()                    │  │  │
│  │  │  - refreshProfile()                            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Layout Components                             │  │  │
│  │  │  - AdminLayout (Sidebar + Main + Footer)       │  │  │
│  │  │  - Sidebar (Gradient, Mobile Drawer)           │  │  │
│  │  │  - MobileNav (Hamburger Menu)                  │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Page Components                               │  │  │
│  │  │  - Dashboard (Stat Cards + Tables)             │  │  │
│  │  │  - Users (Create/Edit with Forms)              │  │  │
│  │  │  - Settings                                    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  UI Components                                 │  │  │
│  │  │  - Button, Input, Badge, Card                  │  │  │
│  │  │  - Table, Modal, Toast, Spinner               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Backend                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Edge Functions (Serverless)                        │  │
│  │  - create-user (Admin user creation)                │  │
│  │  - admin-set-password (Password management)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth Service                                       │  │
│  │  - JWT verification                                │  │
│  │  - Session management                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL)                              │  │
│  │  - user_profiles (id, role, display_name, etc.)    │  │
│  │  - teachers, students, sections, etc.              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Edge Functions Design

### 1. Create User Edge Function

**Location:** `supabase/functions/create-user/index.ts`

**Purpose:** Securely create new users (teachers/students) with associated records

**Flow:**
1. Verify caller JWT and admin role
2. Validate request body (email, password, role, displayName, extraData)
3. Create Supabase Auth user with email_confirm=true
4. Insert user_profiles record
5. Insert role-specific record (teachers or students)
6. Return userId on success or error on failure

**Error Handling:**
- Missing Authorization header → 401
- Invalid JWT → 401
- Non-admin caller → 403
- Invalid JSON → 400
- Missing required fields → 400
- Password too short → 400
- Email already exists → 400
- Database insert fails → 500 (with rollback)

**Deployment:**
```bash
supabase functions deploy create-user --no-verify-jwt
```

### 2. Admin Set Password Edge Function

**Location:** `supabase/functions/admin-set-password/index.ts`

**Purpose:** Securely set or reset user passwords with role-based scope

**Flow:**
1. Verify caller JWT and admin/teacher role
2. If teacher, verify target student is in caller's section
3. Validate newPassword (8+ chars, uppercase, number)
4. Update auth password via service role
5. Clear must_change_password flag
6. Return success

**Error Handling:**
- Missing Authorization header → 401
- Invalid JWT → 401
- Non-admin/teacher caller → 403
- Teacher scope violation → 403
- Invalid JSON → 400
- Missing required fields → 400
- Password validation fails → 400
- Password update fails → 400

**Deployment:**
```bash
supabase functions deploy admin-set-password --no-verify-jwt
```

## Auth Context Design

### AuthContext Implementation

**Location:** `src/contexts/AuthContext.jsx`

**State:**
```javascript
{
  user: AuthUser | null,           // Supabase auth user
  profile: UserProfile | null,     // user_profiles record
  loading: boolean,                // Profile loading state
}
```

**Methods:**
- `signIn(email, password)` - Sign in with email/password
- `signOut()` - Sign out and clear state
- `loadProfile(authUser)` - Load profile with error handling
- `refreshProfile()` - Manually refresh profile
- `completePasswordChange(newPassword)` - Update password and clear flag

**Key Features:**
- Timeout handling: Profile fetch wrapped in Promise.race() with 5s timeout
- Error recovery: If profile fetch fails, continue with authenticated user
- Loading states: Separate loading flag for UI feedback
- Password change: Atomic update of auth password + DB flag + profile refresh
- Session persistence: Restore session on app init

**Profile Loading Logic:**
```javascript
async function loadProfile(authUser) {
  if (!authUser) {
    setUser(null)
    setProfile(null)
    setLoading(false)
    return
  }
  
  try {
    const { data, error } = await Promise.race([
      supabase.from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )
    ])
    
    if (error) throw error
    setUser(authUser)
    setProfile(data)
  } catch (err) {
    console.error('Profile load error:', err.message)
    setUser(authUser)
    setProfile(null)
  } finally {
    setLoading(false)
  }
}
```

## Layout Components Design

### AdminLayout Component

**Location:** `src/components/layout/AdminLayout.jsx`

**Structure:**
```
<div className="flex h-screen overflow-hidden bg-surface">
  <Sidebar />
  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
    <MobileNav />
    <main className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 fade-up">
        {children}
      </div>
    </main>
    <Footer />
  </div>
</div>
```

**Features:**
- Flexbox layout for full-height sidebar + content
- Sidebar hidden on mobile, replaced with MobileNav
- Main content scrollable with padding
- Footer at bottom
- Fade-up animation on page load

### Sidebar Component

**Location:** `src/components/layout/Sidebar.jsx`

**Features:**
- Gradient background (primary to secondary)
- Navigation links with active state
- Role-based menu items
- Mobile drawer with slide-in animation
- Hamburger menu toggle

**Navigation Structure:**
```
Dashboard
Users
  ├─ Create User
  ├─ Manage Teachers
  └─ Manage Students
Settings
  ├─ System Settings
  └─ User Preferences
```

## Dashboard Design

### Dashboard Component

**Location:** `src/pages/admin/Dashboard.jsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                                               │
│ System overview and performance metrics                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┬──────────┬──────────┬──────────┐          │
│ │ Teachers │ Students │ Sections │ Subjects │          │
│ │    12    │    45    │    8     │    15    │          │
│ └──────────┴──────────┴──────────┴──────────┘          │
│                                                         │
│ ┌──────────┬──────────┐                                │
│ │Questions │ Attempts │                                │
│ │   120    │   340    │                                │
│ └──────────┴──────────┘                                │
│                                                         │
│ ┌──────────────────────┬──────────────────────┐        │
│ │ Performance by       │ Top Students         │        │
│ │ Teacher              │                      │        │
│ │                      │                      │        │
│ │ Teacher | Sections   │ # | Student | Score │        │
│ │ ─────────────────    │ ─────────────────    │        │
│ │ John    │ 2          │ 1 | Ahmed   | 92%   │        │
│ │ Sarah   │ 3          │ 2 | Fatima  | 88%   │        │
│ └──────────────────────┴──────────────────────┘        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Stat Cards:**
- Teachers (secondary color, UserCheck icon)
- Students (primary color, Users icon)
- Sections (success color, School icon)
- Subjects (accent color, BookOpen icon)
- Questions (secondary color, Database icon)
- Attempts (primary color, ClipboardList icon)

**Performance Tables:**
- Teacher table: Teacher, Sections, Students, Attempts, Avg Score
- Student table: #, Student, Section, Attempts, Avg Score
- Badge styling: success (≥70%), accent (≥50%), danger (<50%)

## Styling System Design

### Tailwind Configuration

**Location:** `tailwind.config.js`

**Color Palette:**
```javascript
colors: {
  primary:   { DEFAULT: '#1a56db', light: '#3b82f6', dark: '#1e3a8a' },
  secondary: { DEFAULT: '#7c3aed', light: '#a78bfa', dark: '#4c1d95' },
  accent:    { DEFAULT: '#f59e0b', light: '#fcd34d', dark: '#b45309' },
  success:   { DEFAULT: '#10b981', light: '#6ee7b7', dark: '#065f46' },
  danger:    { DEFAULT: '#ef4444', light: '#fca5a5', dark: '#991b1b' },
  surface:   { DEFAULT: '#f8fafc', card: '#ffffff', border: '#e2e8f0' },
  ink:       { DEFAULT: '#0f172a', muted: '#64748b', faint: '#cbd5e1' },
}
```

**Typography:**
```javascript
fontFamily: {
  display: ['"Playfair Display"', 'serif'],
  body:    ['"DM Sans"', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'monospace'],
}
```

**Shadows:**
```javascript
boxShadow: {
  card: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)',
  lift: '0 4px 24px rgba(0,0,0,.12)',
  glow: '0 0 0 3px rgba(26,86,219,.25)',
}
```

### CSS Utility Classes

**Location:** `src/index.css`

**Component Classes:**
```css
/* Buttons */
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors;
}
.btn-primary {
  @apply bg-primary text-white hover:bg-primary-dark;
}
.btn-secondary {
  @apply bg-secondary text-white hover:bg-secondary-dark;
}
.btn-danger {
  @apply bg-danger text-white hover:bg-danger-dark;
}

/* Cards */
.card {
  @apply bg-surface-card rounded-xl shadow-card border border-surface-border;
}

/* Form Inputs */
.form-input {
  @apply w-full px-3 py-2 border border-surface-border rounded-lg 
         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent;
}

/* Badges */
.badge {
  @apply inline-block px-2 py-1 rounded-full text-xs font-medium;
}
.badge-success {
  @apply bg-success/10 text-success;
}
.badge-accent {
  @apply bg-accent/10 text-accent;
}
.badge-danger {
  @apply bg-danger/10 text-danger;
}

/* Tables */
.table-base {
  @apply w-full border-collapse;
}
.table-base th {
  @apply bg-surface px-4 py-2 text-left text-xs font-semibold text-ink-muted;
}
.table-base td {
  @apply px-4 py-3 border-b border-surface-border;
}
.table-base tbody tr:hover {
  @apply bg-surface;
}

/* Sidebar Links */
.sidebar-link {
  @apply block px-4 py-2 rounded-lg text-ink-muted hover:bg-white/10 
         hover:text-white transition-colors;
}
.sidebar-link.active {
  @apply bg-white/20 text-white font-medium;
}

/* Page Title */
.page-title {
  @apply text-3xl font-display font-bold text-ink;
}

/* Stat Grid */
.stat-grid-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4;
}

/* Table Wrapper */
.table-wrap {
  @apply overflow-x-auto;
}

/* Fade Up Animation */
.fade-up {
  @apply animate-fadeUp;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Component Structure

### UI Components

**Location:** `src/components/ui/`

**Components:**
- `Button.jsx` - Reusable button with variants
- `Input.jsx` - Form input with validation
- `Badge.jsx` - Status badge with variants
- `Card.jsx` - Card container
- `Table.jsx` - Data table with sorting
- `Modal.jsx` - Modal dialog
- `Toast.jsx` - Toast notification
- `Spinner.jsx` - Loading spinner
- `ConfirmDialog.jsx` - Confirmation dialog

### Layout Components

**Location:** `src/components/layout/`

**Components:**
- `AdminLayout.jsx` - Main admin layout
- `Sidebar.jsx` - Navigation sidebar
- `MobileNav.jsx` - Mobile navigation drawer
- `Footer.jsx` - Footer component

### Page Components

**Location:** `src/pages/admin/`

**Components:**
- `Dashboard.jsx` - Admin dashboard
- `Users.jsx` - User management
- `CreateUser.jsx` - User creation form
- `Settings.jsx` - System settings

## Form Design

### User Creation Form

**Fields:**
- Email (required, email format)
- Password (required, 8+ chars, uppercase, number)
- Role (required, select: teacher/student)
- Display Name (required, text)
- Designation (optional, for teachers)
- Expertise (optional, for teachers)
- Registration Number (required for students)
- Father Name (required for students)
- Section (required for students, select)

**Validation:**
- Email: Valid email format, not already in use
- Password: 8+ chars, 1+ uppercase, 1+ number
- Role: Must be teacher or student
- Display Name: 2-100 characters
- Required fields: All marked fields must be filled

**Error Handling:**
- Display field-level errors below each input
- Disable submit button during submission
- Show loading spinner on submit button
- Display form-level error message on failure
- Allow retry after error

## Responsive Design

### Breakpoints

- **xs:** 375px (small phones)
- **sm:** 640px (phones)
- **md:** 768px (tablets)
- **lg:** 1024px (small laptops)
- **xl:** 1280px (desktops)

### Mobile Adaptations

**Sidebar:**
- Hidden on sm and below
- Replaced with hamburger menu
- Slide-in drawer from left

**Tables:**
- Horizontal scroll on sm and below
- Sticky header on scroll
- Compact cell padding

**Stat Cards:**
- 1 column on xs/sm
- 2 columns on md
- 3 columns on lg+

**Forms:**
- Full width on mobile
- Stack vertically
- Larger touch targets (44px minimum)

## Loading States

### Profile Loading

**State:** `loading: boolean`

**UI:**
- Show spinner while loading
- Disable navigation until loaded
- Show skeleton cards on dashboard

**Timeout:** 5 seconds

**Fallback:** Continue with authenticated user if profile fails

### Data Loading

**State:** `loader.loading: boolean`

**UI:**
- Show spinner in center of page
- Show skeleton rows in tables
- Disable user interaction

**Timeout:** 10 seconds per request

**Retry:** Show retry button on timeout

## Error Handling

### Error Types

1. **Authentication Errors (401)**
   - Message: "Invalid or expired session — please log in again"
   - Action: Redirect to login

2. **Authorization Errors (403)**
   - Message: "You don't have permission to perform this action"
   - Action: Show error toast, stay on page

3. **Validation Errors (400)**
   - Message: Specific field error (e.g., "Email already in use")
   - Action: Show field error, allow retry

4. **Timeout Errors**
   - Message: "Request timed out — please try again"
   - Action: Show retry button

5. **Server Errors (500)**
   - Message: "An error occurred — please try again later"
   - Action: Show error toast, allow retry

### Error Display

- **Toast:** For temporary errors (auto-dismiss after 5s)
- **Alert:** For critical errors (requires dismissal)
- **Field Error:** For validation errors (below input)
- **Page Error:** For page-level errors (centered on page)

## Integration Points

### Supabase Integration

**Auth:**
- `supabase.auth.getSession()` - Get current session
- `supabase.auth.signInWithPassword()` - Sign in
- `supabase.auth.signOut()` - Sign out
- `supabase.auth.updateUser()` - Update password
- `supabase.auth.onAuthStateChange()` - Listen for auth changes

**Database:**
- `supabase.from('user_profiles').select()` - Get profile
- `supabase.from('user_profiles').update()` - Update profile
- `supabase.from('teachers').select()` - Get teachers
- `supabase.from('students').select()` - Get students

**Edge Functions:**
- `POST /functions/v1/create-user` - Create user
- `POST /functions/v1/admin-set-password` - Set password

## Testing Strategy

### Unit Tests

- Component rendering with different props
- Form validation logic
- Error handling in auth context
- Color palette values in config

### Integration Tests

- User creation flow (edge function + DB)
- Password reset flow (edge function + auth)
- Dashboard data loading
- Auth context initialization

### Property-Based Tests

- Profile loading resilience (timeout handling)
- Edge function idempotence
- Responsive layout at all breakpoints
- Color palette consistency

## Migration Path

### Phase 1: Edge Functions
1. Deploy create-user edge function
2. Deploy admin-set-password edge function
3. Test with manual API calls

### Phase 2: Auth Context
1. Update AuthContext with profile loading
2. Add timeout handling
3. Add error recovery
4. Test with app initialization

### Phase 3: Layout & Styling
1. Update tailwind config with new colors
2. Add CSS utility classes
3. Create layout components
4. Update existing pages to use new layout

### Phase 4: Dashboard & Components
1. Create dashboard with stat cards
2. Create performance tables
3. Update form components
4. Add loading states

### Phase 5: Testing & Polish
1. Run integration tests
2. Test responsive design
3. Test error scenarios
4. Performance optimization

