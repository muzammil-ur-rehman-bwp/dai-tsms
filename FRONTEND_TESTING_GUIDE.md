# Frontend Testing Guide — DAI-TSMS

**Dev Server:** http://localhost:5173/

---

## Quick Start

1. **Open the app:** http://localhost:5173/
2. **Login with admin credentials:**
   - Email: `admin@dai-tsms.vercel.app`
   - Password: (check ADMIN_SETUP.md for the password you created)

---

## Testing Checklist

### 1. Authentication Flow

#### Login Page
- [ ] Navigate to http://localhost:5173/
- [ ] Verify login form displays (email + password fields)
- [ ] Try invalid credentials → should show error message
- [ ] Login with admin credentials → should redirect to admin dashboard
- [ ] Check browser console for any errors (F12 → Console tab)

#### First-Login Password Change
- [ ] If this is the first login for a teacher account, you should be redirected to `/change-password`
- [ ] Verify the form displays and allows password change
- [ ] After changing password, verify redirect to dashboard

#### Logout
- [ ] Click logout button (top-right corner)
- [ ] Verify redirect to login page

---

### 2. Admin Dashboard

#### Dashboard Load
- [ ] Verify admin dashboard loads without errors
- [ ] Check for stat widgets (sections, teachers, students, rooms, etc.)
- [ ] Verify all numbers display correctly

#### Navigation
- [ ] Click "Data Management" → should show 16-card grid
- [ ] Click "Timetables" → should show timetable list
- [ ] Click sidebar links → should navigate without errors

---

### 3. Data Management Pages

#### Academic Years
- [ ] Navigate to Data Management → Academic Years
- [ ] Verify list displays seeded years (2021–2030)
- [ ] Try adding a new year
- [ ] Check for any console errors

#### Disciplines
- [ ] Navigate to Data Management → Disciplines
- [ ] Verify list displays seeded disciplines (BSARIN, BSADARIN, MSARIN, PHARIN)
- [ ] Try adding a new discipline
- [ ] Try editing an existing discipline
- [ ] Try deactivating a discipline

#### Sections
- [ ] Navigate to Data Management → Sections
- [ ] Verify list displays 138 seeded sections
- [ ] Verify sections are sorted correctly (discipline → semester → program → section number)
- [ ] Try creating a new section via form
- [ ] Try bulk uploading sections via CSV

#### Teachers
- [ ] Navigate to Data Management → Teachers
- [ ] Verify list displays 12 seeded teachers
- [ ] Try creating a new teacher
- [ ] Try deactivating a teacher

#### Students
- [ ] Navigate to Data Management → Students
- [ ] Try bulk uploading students via CSV (use sample data)

#### Courses
- [ ] Navigate to Data Management → Courses
- [ ] Try creating a new course
- [ ] Verify per-slot duration calculation (contact_hours_minutes ÷ 2)
- [ ] Try bulk uploading courses via CSV

#### Rooms
- [ ] Navigate to Data Management → Rooms
- [ ] Try creating a new room
- [ ] Try bulk uploading rooms via CSV

---

### 4. Timetable Management

#### Create Timetable
- [ ] Navigate to Timetables
- [ ] Click "Create New Timetable"
- [ ] Select an academic period (should be 2026 SPRING)
- [ ] Verify timetable is created with name like "2026 SPRING Timetable"

#### Timetable Scheduling
- [ ] Click on a timetable to open scheduling page
- [ ] Verify timetable grid displays (08:00–20:00, 15-min rows)
- [ ] Verify only enabled days show (Mon–Thu always, Fri–Sun optional)
- [ ] Try creating a slot by clicking on an empty cell
- [ ] Verify slot form displays with course, teacher, room, day, time fields
- [ ] Try creating a slot with valid data
- [ ] Verify slot appears on grid with correct color and duration
- [ ] Try editing a slot
- [ ] Try deleting a slot

#### Conflict Detection
- [ ] Try creating overlapping slots for same teacher → should show conflict error
- [ ] Try creating overlapping slots for same room → should show conflict error
- [ ] Try creating overlapping slots for same section → should show conflict error

#### Timetable Publish
- [ ] Try publishing timetable with incomplete assignments → should show error
- [ ] Create 2 slots for each course-section assignment
- [ ] Try publishing → should succeed
- [ ] Verify timetable status changes to "Published"

---

### 5. Teacher Dashboard

#### Login as Teacher
- [ ] Create a teacher account or use seeded teacher
- [ ] Login with teacher credentials
- [ ] Verify redirect to teacher dashboard
- [ ] Verify teacher sees their own schedule

#### Swap Requests
- [ ] Try submitting a swap request
- [ ] Verify swap request appears in list
- [ ] Try approving/rejecting a swap request

---

### 6. Student Dashboard

#### Login as Student
- [ ] Create a student account or use test student
- [ ] Login with student credentials
- [ ] Verify redirect to student dashboard
- [ ] Verify student sees their section's timetable (read-only)

#### Read-Only Verification
- [ ] Verify no create/edit/delete buttons visible
- [ ] Verify all controls are disabled

---

### 7. Browser Console Check

**Critical:** Open browser console (F12 → Console tab) and verify:
- [ ] No red error messages
- [ ] No warnings about missing environment variables
- [ ] No CORS errors
- [ ] No 404 errors for assets

---

### 8. Common Issues to Check

#### Blank Page
- [ ] Check browser console for errors
- [ ] Verify Tailwind CSS is loading (check Network tab for CSS file)
- [ ] Verify environment variables are set in `.env.local`
- [ ] Check if JavaScript is enabled in browser

#### Login Not Working
- [ ] Verify admin credentials are correct
- [ ] Check browser console for auth errors
- [ ] Verify Supabase URL and anon key are correct in `.env.local`

#### Timetable Grid Not Showing
- [ ] Verify timetable was created successfully
- [ ] Check browser console for errors
- [ ] Verify slots are being fetched from Supabase

#### Realtime Not Working
- [ ] Open two browser windows with same timetable
- [ ] Create a slot in one window
- [ ] Verify slot appears in other window within 2 seconds
- [ ] Check browser console for Realtime subscription errors

---

## Environment Variables

Verify `.env.local` has all required variables:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_LLM_API_KEY=<optional-for-ai-scheduler>
VITE_LLM_API_URL=<optional-for-ai-scheduler>
```

---

## Debugging Tips

### Enable Debug Mode
Add this to browser console to see detailed logs:
```javascript
localStorage.setItem('DEBUG', 'true');
location.reload();
```

### Check Supabase Connection
```javascript
// In browser console:
import { supabase } from './src/lib/supabase.js';
const { data, error } = await supabase.from('sections').select('count');
console.log(data, error);
```

### Check Auth State
```javascript
// In browser console:
const { data } = await supabase.auth.getSession();
console.log(data);
```

---

## Next Steps

After testing, report any issues found:
1. **Error messages** from browser console
2. **Specific page** where issue occurs
3. **Steps to reproduce** the issue
4. **Expected vs actual** behavior

