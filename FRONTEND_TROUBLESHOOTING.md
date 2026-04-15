# Frontend Troubleshooting Guide

## Issue 1: Login Succeeds But No Redirect ✅ FIXED

**Problem:** After successful login, the page doesn't redirect to the dashboard.

**Root Cause:** The `LoginPage` was navigating before the `AuthContext` state had fully updated.

**Solution Applied:** Added a 100ms delay to allow the auth state to propagate before navigation.

**File Modified:** `src/pages/auth/LoginPage.jsx`

---

## Issue 2: Blank Home Page When Manually Opened

**Problem:** When manually navigating to `/admin`, `/teacher`, or `/student`, the page appears blank.

**Possible Causes:**

1. **Missing Tailwind CSS** — Styles not loading
2. **Component rendering issue** — Components exist but not rendering
3. **Auth state not initialized** — Page loads before auth context is ready
4. **Missing environment variables** — Supabase not configured

**Diagnostic Steps:**

### Step 1: Check Browser Console
Open DevTools (F12) and check the Console tab for errors:
- Look for "Missing Supabase environment variables"
- Look for import errors or component errors
- Look for network errors

### Step 2: Check Network Tab
- Verify CSS is loading (look for `index-*.css`)
- Verify JavaScript bundles are loading
- Check for 404 errors

### Step 3: Verify Environment Variables
```bash
# Check .env.local exists and has values
cat .env.local
```

Should show:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Step 4: Check Tailwind is Working
In browser console, run:
```javascript
// Should return a color value like "rgb(30, 64, 175)"
window.getComputedStyle(document.body).backgroundColor
```

### Step 5: Verify Components Are Rendering
Add this to `src/pages/admin/AdminDashboard.jsx` temporarily:
```javascript
console.log('AdminDashboard rendered')
```

Then check console when navigating to `/admin`.

---

## Common Fixes

### Fix 1: Clear Cache and Rebuild
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf dist

# Restart dev server
npm run dev
```

### Fix 2: Verify Supabase Connection
Add this to `src/App.jsx` temporarily:
```javascript
import { supabase } from './lib/supabase'

// In App component, add:
useEffect(() => {
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Supabase configured:', !!supabase)
}, [])
```

### Fix 3: Check Auth State
Add this to `src/contexts/AuthContext.jsx` temporarily:
```javascript
useEffect(() => {
  console.log('Auth state updated:', { session, role, loading })
}, [session, role, loading])
```

### Fix 4: Verify CSS Loading
Check `index.html` has the CSS import:
```html
<link rel="stylesheet" href="/src/index.css" />
```

Or Vite should auto-inject it.

---

## Testing Checklist

- [ ] `npm run dev` starts without errors
- [ ] Login page loads with styling
- [ ] Can log in with admin credentials
- [ ] Redirects to `/admin` after login
- [ ] Admin dashboard displays with sidebar and topbar
- [ ] Can manually navigate to `/admin` and see dashboard
- [ ] Can navigate between pages using sidebar
- [ ] Sign out button works
- [ ] Redirects to `/login` after sign out

---

## Debug Mode

To enable detailed logging, add this to `src/App.jsx`:

```javascript
// Enable debug logging
const DEBUG = true

if (DEBUG) {
  console.log('App mounted')
  
  // Log auth state changes
  const originalUseAuth = useAuth
  window.useAuth = function() {
    const auth = originalUseAuth()
    console.log('Auth state:', auth)
    return auth
  }
}
```

---

## If Still Blank

1. **Check browser console for errors** — Copy the full error message
2. **Check Network tab** — Look for failed requests
3. **Check Vite dev server output** — Look for build errors
4. **Try hard refresh** — Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
5. **Check if dev server is running** — Should see "Local: http://localhost:5173"

---

## Next Steps

1. Run `npm run dev`
2. Open http://localhost:5173
3. Try logging in with admin credentials
4. Check browser console for any errors
5. If blank, follow diagnostic steps above
6. Report any errors found

---

**If you encounter specific errors, share them and we'll fix them immediately.**
