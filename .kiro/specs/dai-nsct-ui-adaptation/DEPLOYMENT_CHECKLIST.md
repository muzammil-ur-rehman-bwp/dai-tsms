# DAI-TSMS UI Adaptation - Deployment Checklist

## Pre-Deployment Verification

### Code Quality ✅
- [ ] Run `npm run lint` - No errors or warnings
- [ ] Run `npm run build` - Clean production bundle
- [ ] Check console for any errors or warnings
- [ ] Verify all imports are correct
- [ ] Verify all routes are configured

### Environment Variables ✅
- [ ] `VITE_SUPABASE_URL` - Set in `.env.local`
- [ ] `VITE_SUPABASE_ANON_KEY` - Set in `.env.local`
- [ ] `VITE_LLM_API_KEY` - Set in `.env.local` (if using AI features)
- [ ] `VITE_LLM_API_URL` - Set in `.env.local` (if using AI features)

### Database ✅
- [ ] Supabase project created
- [ ] Database schema migrated
- [ ] RLS policies enabled
- [ ] Seed data populated
- [ ] Test data created for verification

### Edge Functions ✅
- [ ] `create-user` function code reviewed
- [ ] `admin-set-password` function code reviewed
- [ ] Both functions ready for deployment

---

## Phase 1: Deploy Edge Functions

### Step 1: Deploy create-user Function
```bash
# Navigate to project root
cd /path/to/dai-tsms

# Deploy create-user function
supabase functions deploy create-user --no-verify-jwt

# Verify deployment
curl -X POST https://<project-id>.supabase.co/functions/v1/create-user \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "role": "teacher",
    "displayName": "Test Teacher"
  }'
```

**Verification Checklist:**
- [ ] Function deployed successfully
- [ ] Function returns 200 status on valid request
- [ ] Function returns 401 on missing Authorization header
- [ ] Function returns 403 on non-admin caller
- [ ] Function returns 400 on invalid password

### Step 2: Deploy admin-set-password Function
```bash
# Deploy admin-set-password function
supabase functions deploy admin-set-password --no-verify-jwt

# Verify deployment
curl -X POST https://<project-id>.supabase.co/functions/v1/admin-set-password \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "newPassword": "NewPassword123"
  }'
```

**Verification Checklist:**
- [ ] Function deployed successfully
- [ ] Function returns 200 status on valid request
- [ ] Function returns 401 on missing Authorization header
- [ ] Function returns 403 on non-admin caller
- [ ] Function returns 400 on invalid password

---

## Phase 2: Build Frontend

### Step 1: Install Dependencies
```bash
npm install
```

**Verification Checklist:**
- [ ] All dependencies installed
- [ ] No peer dependency warnings
- [ ] node_modules folder created

### Step 2: Build Production Bundle
```bash
npm run build
```

**Verification Checklist:**
- [ ] Build completes without errors
- [ ] dist/ folder created
- [ ] All assets bundled
- [ ] No console errors or warnings

### Step 3: Preview Production Build
```bash
npm run preview
```

**Verification Checklist:**
- [ ] Preview server starts
- [ ] App loads at http://localhost:4173
- [ ] All pages accessible
- [ ] No console errors

---

## Phase 3: Deploy to Hosting

### Option A: Deploy to Vercel

#### Step 1: Connect Repository
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### Step 2: Set Environment Variables
```bash
# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables

VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_LLM_API_KEY=<your-llm-api-key>
VITE_LLM_API_URL=<your-llm-api-url>
```

#### Step 3: Deploy
```bash
vercel deploy --prod
```

**Verification Checklist:**
- [ ] Deployment completes successfully
- [ ] URL provided by Vercel
- [ ] App loads at provided URL
- [ ] All pages accessible
- [ ] No console errors

### Option B: Deploy to Netlify

#### Step 1: Connect Repository
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link project
netlify link
```

#### Step 2: Set Environment Variables
```bash
# Set environment variables in Netlify dashboard
# Site Settings → Build & Deploy → Environment

VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_LLM_API_KEY=<your-llm-api-key>
VITE_LLM_API_URL=<your-llm-api-url>
```

#### Step 3: Deploy
```bash
netlify deploy --prod
```

**Verification Checklist:**
- [ ] Deployment completes successfully
- [ ] URL provided by Netlify
- [ ] App loads at provided URL
- [ ] All pages accessible
- [ ] No console errors

---

## Phase 4: Post-Deployment Verification

### Step 1: Test Authentication
- [ ] Login with test user credentials
- [ ] Verify profile loads without timeout
- [ ] Verify role-based redirect works
- [ ] Verify logout works

### Step 2: Test User Management
- [ ] Create new teacher user
- [ ] Create new student user
- [ ] Verify users appear in users list
- [ ] Verify user deletion works
- [ ] Verify error handling for duplicate email

### Step 3: Test Dashboard
- [ ] Dashboard loads with stat cards
- [ ] Stat cards display correct counts
- [ ] Performance tables load
- [ ] Tables display correct data
- [ ] Loading states work correctly

### Step 4: Test Responsive Design
- [ ] Test on mobile (375px)
- [ ] Test on tablet (768px)
- [ ] Test on desktop (1280px)
- [ ] Sidebar responsive
- [ ] Tables responsive
- [ ] Forms responsive
- [ ] Navigation responsive

### Step 5: Test Error Handling
- [ ] Test 401 error (invalid session)
- [ ] Test 403 error (insufficient permissions)
- [ ] Test 400 error (invalid input)
- [ ] Test 500 error (server error)
- [ ] Test timeout error (network timeout)
- [ ] Verify error messages display correctly
- [ ] Verify retry buttons work

### Step 6: Monitor Logs
- [ ] Check Supabase logs for errors
- [ ] Check hosting provider logs for errors
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests

---

## Phase 5: Production Monitoring

### Daily Checks (First Week)
- [ ] Check error logs daily
- [ ] Monitor user creation flow
- [ ] Monitor dashboard performance
- [ ] Monitor API response times
- [ ] Check for any user-reported issues

### Weekly Checks (Ongoing)
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Monitor database usage
- [ ] Check edge function usage
- [ ] Review user feedback

### Monthly Checks (Ongoing)
- [ ] Review analytics
- [ ] Check for security issues
- [ ] Review performance trends
- [ ] Plan for optimizations
- [ ] Update documentation

---

## Rollback Plan

### If Deployment Fails

#### Step 1: Identify Issue
- [ ] Check deployment logs
- [ ] Check error messages
- [ ] Check browser console
- [ ] Check network requests

#### Step 2: Rollback Frontend
```bash
# Revert to previous version
git revert <commit-hash>
npm run build
vercel deploy --prod  # or netlify deploy --prod
```

#### Step 3: Rollback Edge Functions
```bash
# Revert to previous version
git revert <commit-hash>
supabase functions deploy create-user --no-verify-jwt
supabase functions deploy admin-set-password --no-verify-jwt
```

#### Step 4: Verify Rollback
- [ ] App loads correctly
- [ ] All features work
- [ ] No errors in logs
- [ ] Users can login

---

## Post-Deployment Documentation

### Update Documentation
- [ ] Update README.md with deployment URL
- [ ] Update DEPLOYMENT_GUIDE.md with actual URLs
- [ ] Update TROUBLESHOOTING.md with common issues
- [ ] Update CHANGELOG.md with release notes

### Notify Stakeholders
- [ ] Send deployment notification to team
- [ ] Send deployment notification to users
- [ ] Provide feedback channel for issues
- [ ] Schedule post-deployment review

---

## Success Criteria

### Deployment Success ✅
- [ ] All edge functions deployed
- [ ] Frontend deployed to production
- [ ] All environment variables set
- [ ] No errors in logs
- [ ] All features working

### User Acceptance ✅
- [ ] Users can login
- [ ] Users can create accounts
- [ ] Dashboard loads correctly
- [ ] All pages accessible
- [ ] No performance issues

### Monitoring ✅
- [ ] Error logs monitored
- [ ] Performance metrics tracked
- [ ] User feedback collected
- [ ] Issues resolved quickly

---

## Sign-Off

**Deployment Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Status**: ✅ READY FOR DEPLOYMENT

---

## Contact & Support

For deployment issues or questions:
- Check TROUBLESHOOTING.md
- Review error logs
- Contact development team
- Check Supabase documentation
- Check hosting provider documentation

---

**Good luck with your deployment! 🚀**
