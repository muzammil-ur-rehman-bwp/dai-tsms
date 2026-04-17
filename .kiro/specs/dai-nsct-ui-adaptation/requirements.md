# DAI-TSMS UI Adaptation Requirements

## Introduction

This specification defines the requirements for adapting the DAI-TSMS frontend to adopt proven UI patterns, edge functions, authentication mechanisms, and design system from the dai-nsct reference project. The primary objectives are to resolve profile fetch timeouts and blank screen issues while establishing a consistent, professional, and responsive user interface across all pages.

The adaptation maintains the existing database schema and routing structure while modernizing the frontend architecture with robust error handling, proper loading states, and a sophisticated color palette.

## Glossary

- **System**: The DAI-TSMS frontend application
- **Edge_Function**: Supabase serverless function deployed at the edge for secure backend operations
- **Auth_Context**: React context providing authentication state, user profile, and auth operations
- **Profile_Fetch**: The operation of retrieving user profile data from the user_profiles table
- **Loading_State**: Visual indicator (spinner, skeleton) shown while async operations are in progress
- **Blank_Screen**: UI state where no content is displayed due to missing profile data or loading state
- **Admin_User**: User with admin role capable of creating users and managing system settings
- **Role_Based_UI**: UI components that render differently based on user role (admin, teacher, student)
- **Design_System**: Cohesive set of UI components, color palette, typography, and layout patterns
- **Gradient_Sidebar**: Navigation sidebar with gradient background and role-based styling
- **Stat_Card**: Dashboard component displaying a metric with icon and value
- **Performance_Table**: Data table showing performance metrics with badges and formatting
- **Color_Palette**: Set of predefined colors: primary #1a56db, secondary #7c3aed, accent #f59e0b, success #10b981, danger #ef4444
- **Typography_System**: Font families: Playfair Display (headings), DM Sans (body), JetBrains Mono (code)
- **RLS**: Row-Level Security policies in Supabase controlling data access
- **Service_Role_Key**: Supabase service role key used by edge functions for admin operations
- **JWT**: JSON Web Token used for authenticating requests to edge functions

## Requirements

### Requirement 1: Create User Edge Function

**User Story:** As an admin, I want to create new users (teachers and students) through a secure edge function, so that user creation is reliable and doesn't timeout.

#### Acceptance Criteria

1. WHEN an admin calls the create-user edge function with valid email, password, role, and displayName, THE System SHALL create a Supabase Auth user with email_confirm set to true
2. WHEN a user is created with role "teacher", THE System SHALL insert a corresponding teacher record with user_id, teacher_name, designation, expertise, email, and is_active fields
3. WHEN a user is created with role "student", THE System SHALL insert a corresponding student record with user_id, reg_number, student_name, father_name, section_id, email, and is_active fields
4. WHEN a user is created, THE System SHALL insert a user_profiles record with id, role, display_name, is_active, and must_change_password set to true
5. IF the email already exists, THEN THE System SHALL return a descriptive error message
6. IF the password is less than 8 characters, THEN THE System SHALL return an error requiring minimum 8 characters
7. IF the caller is not authenticated, THEN THE System SHALL return a 401 Unauthorized error
8. IF the caller does not have admin role, THEN THE System SHALL return a 403 Forbidden error
9. WHEN the create-user function is deployed, THE System SHALL use the --no-verify-jwt flag to allow custom JWT verification
10. IF any database insert fails during user creation, THE System SHALL rollback all changes (delete auth user and any inserted records)

### Requirement 2: Admin Set Password Edge Function

**User Story:** As an admin or teacher, I want to set or reset user passwords through a secure edge function, so that password management is reliable and doesn't timeout.

#### Acceptance Criteria

1. WHEN an admin calls the admin-set-password edge function with userId and newPassword, THE System SHALL update the user's auth password
2. WHEN a teacher calls the admin-set-password edge function, THE System SHALL verify the target student belongs to one of the teacher's assigned sections
3. IF the teacher's student scope check fails, THEN THE System SHALL return a 403 Forbidden error
4. IF the password is less than 8 characters, THEN THE System SHALL return an error requiring minimum 8 characters
5. IF the password does not contain at least one uppercase letter, THEN THE System SHALL return an error requiring uppercase letter
6. IF the password does not contain at least one number, THEN THE System SHALL return an error requiring number
7. WHEN a password is set via admin-set-password, THE System SHALL set must_change_password to false in user_profiles
8. IF the caller is not authenticated, THEN THE System SHALL return a 401 Unauthorized error
9. IF the caller does not have admin or teacher role, THEN THE System SHALL return a 403 Forbidden error
10. WHEN the admin-set-password function is deployed, THE System SHALL use the --no-verify-jwt flag to allow custom JWT verification

### Requirement 3: Robust Auth Context with Profile Loading

**User Story:** As a user, I want the application to reliably load my profile with proper error handling and loading states, so that I don't see blank screens or experience timeouts.

#### Acceptance Criteria

1. WHEN the application initializes, THE Auth_Context SHALL call supabase.auth.getSession() to retrieve the current session
2. WHEN a session exists, THE Auth_Context SHALL load the user profile from the user_profiles table
3. WHILE the profile is loading, THE System SHALL display a loading spinner or skeleton state
4. IF the profile fetch times out or fails, THE Auth_Context SHALL log the error and continue with the authenticated user
5. WHEN the profile loads successfully, THE Auth_Context SHALL store user, profile, and loading state in context
6. WHEN the user signs out, THE Auth_Context SHALL clear user, profile, and loading state
7. WHEN an auth state change event occurs, THE Auth_Context SHALL reload the profile
8. IF the user has must_change_password set to true, THE System SHALL redirect to password change page
9. THE Auth_Context SHALL provide a refreshProfile() method to manually refresh profile data
10. THE Auth_Context SHALL provide a completePasswordChange() method to update password and clear must_change_password flag

### Requirement 4: Dashboard with Stat Cards and Performance Tables

**User Story:** As an admin, I want to see a professional dashboard with stat cards showing key metrics and performance tables, so that I can quickly understand system status.

#### Acceptance Criteria

1. WHEN the admin dashboard loads, THE System SHALL display stat cards for Teachers, Students, Sections, Subjects, Questions, and Attempts
2. EACH stat card SHALL display an icon, metric label, and numeric value
3. EACH stat card SHALL use role-based gradient colors (secondary for Teachers, primary for Students, success for Sections, accent for Subjects)
4. WHEN stat card data is loading, THE System SHALL display a loading state instead of blank values
5. THE dashboard SHALL display a "Performance by Teacher" table with columns: Teacher, Sections, Students, Attempts, Avg Score
6. THE dashboard SHALL display a "Top Students" table with columns: #, Student, Section, Attempts, Avg Score
7. EACH performance table SHALL use badge styling for score display with color coding (success ≥70%, accent ≥50%, danger <50%)
8. WHEN table data is loading, THE System SHALL display a loading state instead of blank rows
9. IF no data exists, THE System SHALL display "No data yet" message in table
10. THE dashboard layout SHALL be responsive on mobile, tablet, and desktop screens

### Requirement 5: Admin Layout with Gradient Sidebar

**User Story:** As a user, I want a professional layout with a gradient sidebar and responsive navigation, so that I can navigate the application easily on any device.

#### Acceptance Criteria

1. THE Admin_Layout SHALL consist of a sidebar, main content area, mobile navigation drawer, and footer
2. THE sidebar SHALL display a gradient background using primary and secondary colors
3. THE sidebar SHALL display navigation links for Dashboard, Users, Settings, and other admin pages
4. THE sidebar SHALL be hidden on mobile devices and replaced with a mobile navigation drawer
5. THE mobile navigation drawer SHALL slide in from the left when triggered
6. THE main content area SHALL be scrollable and display page content with padding
7. THE layout SHALL use flexbox to ensure sidebar and content area fill the screen height
8. WHEN the user is on a mobile device, THE sidebar SHALL be replaced with a hamburger menu
9. THE footer SHALL display at the bottom of the main content area
10. THE layout SHALL maintain consistent spacing and alignment across all pages

### Requirement 6: Color Scheme and Design System

**User Story:** As a designer, I want a sophisticated color palette and consistent design system, so that the application looks professional and cohesive.

#### Acceptance Criteria

1. THE System SHALL use primary color #1a56db for main actions and primary UI elements
2. THE System SHALL use secondary color #7c3aed for secondary actions and accents
3. THE System SHALL use accent color #f59e0b for warnings and highlights
4. THE System SHALL use success color #10b981 for positive states and confirmations
5. THE System SHALL use danger color #ef4444 for errors and destructive actions
6. THE System SHALL use surface colors for backgrounds (default #f8fafc, card #ffffff, border #e2e8f0)
7. THE System SHALL use ink colors for text (default #0f172a, muted #64748b, faint #cbd5e1)
8. THE System SHALL apply Playfair Display font for headings (h1-h6)
9. THE System SHALL apply DM Sans font for body text and UI elements
10. THE System SHALL apply JetBrains Mono font for code and monospace content

### Requirement 7: CSS Utility Classes and Component Styling

**User Story:** As a developer, I want consistent CSS utility classes for common components, so that I can build UI quickly and maintain consistency.

#### Acceptance Criteria

1. THE System SHALL provide a "btn" class for button styling with variants (primary, secondary, danger)
2. THE System SHALL provide a "card" class for card styling with shadow and border radius
3. THE System SHALL provide a "form-input" class for input field styling with focus states
4. THE System SHALL provide a "badge" class for badge styling with variants (success, accent, danger)
5. THE System SHALL provide a "table-base" class for table styling with striped rows and hover states
6. THE System SHALL provide a "sidebar-link" class for sidebar navigation link styling
7. THE System SHALL provide a "page-title" class for page heading styling
8. THE System SHALL provide a "stat-grid-responsive" class for responsive stat card grid
9. THE System SHALL provide a "table-wrap" class for table wrapper with horizontal scroll on mobile
10. THE System SHALL provide a "fade-up" class for fade-in animation on page load

### Requirement 8: Form Components with Validation and Error Handling

**User Story:** As a user, I want forms with consistent styling, validation, and clear error messages, so that I can complete actions without confusion.

#### Acceptance Criteria

1. WHEN a form field is invalid, THE System SHALL display an error message below the field
2. WHEN a form field has focus, THE System SHALL apply focus styling (border color, shadow)
3. WHEN a form is submitted with invalid data, THE System SHALL prevent submission and highlight errors
4. THE form inputs SHALL use the form-input class for consistent styling
5. THE form labels SHALL be clearly associated with inputs using for/id attributes
6. WHEN a form submission is in progress, THE System SHALL disable the submit button and show loading state
7. IF a form submission fails, THE System SHALL display an error message and allow retry
8. THE form validation messages SHALL be specific and actionable (not generic "Invalid input")
9. WHEN a password field is present, THE System SHALL provide a show/hide password toggle
10. THE form layout SHALL be responsive and stack vertically on mobile devices

### Requirement 9: Typography and Responsive Design

**User Story:** As a user, I want readable typography and responsive design that works on all devices, so that I can use the application on mobile, tablet, or desktop.

#### Acceptance Criteria

1. THE page title (h1) SHALL use Playfair Display font at 28px on desktop and 24px on mobile
2. THE section headings (h2-h3) SHALL use Playfair Display font at 20px on desktop and 18px on mobile
3. THE body text SHALL use DM Sans font at 14px with line-height 1.6
4. THE code blocks SHALL use JetBrains Mono font at 12px with monospace styling
5. THE layout SHALL use Tailwind breakpoints (xs: 375px, sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
6. WHEN the viewport is less than 640px, THE sidebar SHALL be hidden and replaced with mobile drawer
7. WHEN the viewport is less than 640px, THE tables SHALL be horizontally scrollable
8. WHEN the viewport is less than 640px, THE stat cards SHALL stack vertically
9. THE layout SHALL maintain consistent padding and margins across all breakpoints
10. THE layout SHALL use mobile-first CSS approach with progressive enhancement

### Requirement 10: Loading States and Error Handling

**User Story:** As a user, I want to see clear loading states and error messages, so that I understand what's happening and can recover from errors.

#### Acceptance Criteria

1. WHEN data is loading, THE System SHALL display a spinner or skeleton state
2. WHEN a request times out, THE System SHALL display a timeout error message with retry option
3. WHEN a request fails, THE System SHALL display an error message with details
4. WHEN the user is not authenticated, THE System SHALL redirect to login page
5. WHEN the user lacks permission, THE System SHALL display a 403 Forbidden message
6. WHEN a profile fetch fails, THE System SHALL log the error and continue with basic user info
7. THE loading spinner SHALL use primary color and be centered on the page
8. THE error messages SHALL be displayed in a toast or alert component
9. WHEN an error is displayed, THE System SHALL provide a "Retry" or "Go Back" action
10. THE loading state SHALL prevent user interaction with the page content

## Acceptance Criteria Testing Strategy

### Property-Based Testing Candidates

1. **Profile Loading Resilience** (Requirement 3)
   - Property: For any valid user session, profile loading either succeeds or fails gracefully without hanging
   - Test: Generate random user sessions and verify profile loads or error is logged within timeout

2. **Edge Function Idempotence** (Requirements 1, 2)
   - Property: Calling create-user or admin-set-password multiple times with same parameters produces same result
   - Test: Call functions multiple times and verify state is consistent

3. **Color Palette Consistency** (Requirement 6)
   - Property: All color values in tailwind config match design specification
   - Test: Parse config and verify each color matches expected hex value

4. **Responsive Layout** (Requirement 9)
   - Property: Layout renders correctly at all breakpoints without overflow or misalignment
   - Test: Generate viewport sizes and verify layout adapts correctly

### Integration Testing Candidates

1. **User Creation Flow** (Requirement 1)
   - Test: Admin creates teacher/student via edge function, verify auth user and profile records exist
   - Scope: 2-3 representative examples (teacher, student, error cases)

2. **Password Reset Flow** (Requirement 2)
   - Test: Admin/teacher resets password, verify user can login with new password
   - Scope: 2-3 representative examples (admin reset, teacher reset, scope violation)

3. **Dashboard Data Loading** (Requirement 4)
   - Test: Dashboard loads and displays stat cards and tables with real data
   - Scope: 1-2 representative examples (with data, empty state)

4. **Auth Context Initialization** (Requirement 3)
   - Test: App initializes with session, profile loads, user can navigate
   - Scope: 2-3 representative examples (authenticated, unauthenticated, profile missing)

