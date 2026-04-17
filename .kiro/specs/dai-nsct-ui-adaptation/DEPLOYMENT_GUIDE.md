# DAI-TSMS UI Adaptation - Complete Deployment Guide

## Overview

This guide walks you through deploying the dai-nsct-ui-adaptation implementation to production. The deployment consists of three main parts:

1. **Edge Functions** - Deploy to Supabase
2. **Frontend** - Build and deploy to hosting provider
3. **Verification** - Test and monitor

**Estimated Time**: 30-45 minutes

---

## Prerequisites

Before starting, ensure you have:

- [ ] Supabase project created and configured
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Node.js 16+ installed
- [ ] Git repository initialized
- [ ] Hosting provider account (Vercel or Netlify)
- [ ] Environment variables ready

---

## Part 1: Deploy Edge Functions

### Step 1.1: Verify Supabase Setup

```bash
# Check Supabase CLI version
supabase --version

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>
```

**Expected Output**:
```
Supabase CLI version: 1.x.x
✓ Logged in successfully
✓ Linked to project: <project-ref>
```

### Step 1.2: Deploy create-user Function

```bash
# Navigate to project root
cd /path/to/dai-tsms

# Deploy create-user function
supabase functions deploy create-user --no-verify-jwt

# Expected output:
# ✓ Function deployed successfully
# ✓ Endpoint: https://<project-id>.supabase.co/functions/v1/create-user
```

**Verification**:
```bash
# Test the function
curl -X POST https://<project-id>.supabase.co/functions/v1/create-user \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "role": "teacher",
    "displayName": "Test Teacher"
  }'

# Expected response:
# {"userId": "uuid", "success": true}
```

### Step 1.3: Deploy admin-set-password Function

```bash
# Deploy admin-set-password function
supabase functions deploy admin-set-password --no-verify-jwt

# Expected output:
# ✓ Function deployed successfully
# ✓ Endpoint: https://<project-id>.supabase.co/functions/v1/admin-set-password
```

**Verification**:
```bash
# Test the function
curl -X POST https://<project-id>.supabase.co/functions/v1/admin-set-password \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "newPassword": "NewPassword123"
  }'

# Expected response:
# {"success": true}
```

### Step 1.4: Verify Edge Functions

- [ ] create-user function deployed
- [ ] admin-set-password function deployed
- [ ] Both functions return 200 status on valid requests
- [ ] Both functions return proper error codes on invalid requests

---

## Part 2: Build Frontend

### Step 2.1: Install Dependencies

```bash
# Navigate to project root
cd /path/to/dai-tsms

# Install dependencies
npm install

# Expected output:
# added X packages in Xs
# No peer dependency warnings
```

### Step 2.2: Set Environment Variables

Create `.env.local` file in project root:

```bash
# .env.local
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_LLM_API_KEY=<your-llm-api-key>
VITE_LLM_API_URL=<your-llm-api-url>
```

**Get these values from**:
- Supabase Dashboard → Settings → API
- Your LLM provider dashboard

### Step 2.3: Build Production Bundle

```bash
# Build for production
npm run build

# Expected output:
# ✓ built in 30s
# dist/
#   ├── index.html
#   ├── assets/
#   │   ├── index-xxx.js
#   │   ├── index-xxx.css
#   │   └── ...
```

### Step 2.4: Preview Production Build

```bash
# Preview the production build
npm run preview

# Expected output:
# ➜  Local:   http://localhost:4173/
# ➜  press h to show help
```

**Test in browser**:
- [ ] App loads at http://localhost:4173
- [ ] Login page displays
- [ ] No console errors
- [ ] All assets load

---

## Part 3: Deploy to Hosting

### Option A: Deploy to Vercel

#### Step 3A.1: Install Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Expected output:
# ✓ Logged in
```

#### Step 3A.2: Link Project

```bash
# Link project to Vercel
vercel link

# Follow prompts:
# ? Set up and deploy "dai-tsms"? [Y/n] → Y
# ? Which scope should contain your project? → Select your account
# ? Link to existing project? [y/N] → N (for new project)
# ? What's your project's name? → dai-tsms
# ? In which directory is your code? → . (current directory)
# ? Want to modify these settings? [y/N] → N

# Expected output:
# ✓ Linked to vercel/dai-tsms
```

#### Step 3A.3: Set Environment Variables

```bash
# Set environment variables in Vercel
vercel env add VITE_SUPABASE_URL
# Paste: https://<project-id>.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: <your-anon-key>

vercel env add VITE_LLM_API_KEY
# Paste: <your-llm-api-key>

vercel env add VITE_LLM_API_URL
# Paste: <your-llm-api-url>

# Expected output:
# ✓ Added environment variable
```

#### Step 3A.4: Deploy to Production

```bash
# Deploy to production
vercel deploy --prod

# Expected output:
# ✓ Production: https://dai-tsms.vercel.app
# ✓ Deployment complete
```

**Verification**:
- [ ] Deployment completes successfully
- [ ] URL provided by Vercel
- [ ] App loads at provided URL
- [ ] No console errors

### Option B: Deploy to Netlify

#### Step 3B.1: Install Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Expected output:
# ✓ Logged in
```

#### Step 3B.2: Link Project

```bash
# Link project to Netlify
netlify link

# Follow prompts:
# ? What would you like to do? → Link this directory to an existing site
# ? Search by full site name: → dai-tsms
# ? Link to site? [Y/n] → Y

# Expected output:
# ✓ Linked to site: dai-tsms
```

#### Step 3B.3: Set Environment Variables

```bash
# Set environment variables in Netlify
netlify env:set VITE_SUPABASE_URL https://<project-id>.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY <your-anon-key>
netlify env:set VITE_LLM_API_KEY <your-llm-api-key>
netlify env:set VITE_LLM_API_URL <your-llm-api-url>

# Expected output:
# ✓ Set environment variable
```

#### Step 3B.4: Deploy to Production

```bash
# Deploy to production
netlify deploy --prod

# Expected output:
# ✓ Site deployed to: https://dai-tsms.netlify.app
# ✓ Deployment complete
```

**Verification**:
- [ ] Deployment completes successfully
- [ ] URL provided by Netlify
- [ ] App loads at provided URL
- [ ] No console errors

---

## Part 4: Post-Deployment Verification

### Step 4.1: Test Authentication

```bash
# 1. Open app in browser
# 2. Navigate to login page
# 3. Login with test credentials
# 4. Verify profile loads without timeout
# 5. Verify role-based redirect works
# 6. Verify logout works
```

**Expected Results**:
- [ ] Login succeeds
- [ ] Profile loads within 5 seconds
- [ ] Redirected to correct dashboard (admin/teacher/student)
- [ ] Logout works

### Step 4.2: Test User Management

```bash
# 1. Navigate to /admin/users
# 2. Click "Create User"
# 3. Fill in form:
#    - Email: test-teacher@example.com
#    - Password: TestPassword123
#    - Role: Teacher
#    - Display Name: Test Teacher
#    - Designation: Senior Teacher
# 4. Submit form
# 5. Verify user appears in list
```

**Expected Results**:
- [ ] Form validates correctly
- [ ] User created successfully
- [ ] User appears in list
- [ ] Success toast displayed

### Step 4.3: Test Dashboard

```bash
# 1. Navigate to /admin
# 2. Verify stat cards display
# 3. Verify tables load
# 4. Verify no console errors
```

**Expected Results**:
- [ ] Dashboard loads
- [ ] Stat cards display correct counts
- [ ] Tables display data
- [ ] No console errors

### Step 4.4: Test Responsive Design

```bash
# 1. Open DevTools (F12)
# 2. Toggle device toolbar (Ctrl+Shift+M)
# 3. Test at different breakpoints:
#    - Mobile (375px)
#    - Tablet (768px)
#    - Desktop (1280px)
# 4. Verify layout adapts correctly
```

**Expected Results**:
- [ ] Sidebar hidden on mobile
- [ ] Mobile drawer works
- [ ] Tables scroll horizontally on mobile
- [ ] Forms stack vertically on mobile
- [ ] Touch targets are 44px minimum

### Step 4.5: Test Error Handling

```bash
# 1. Test 401 error:
#    - Logout
#    - Try to access /admin
#    - Should redirect to login

# 2. Test 400 error:
#    - Try to create user with invalid email
#    - Should show field error

# 3. Test 500 error:
#    - Simulate network error
#    - Should show error toast with retry
```

**Expected Results**:
- [ ] 401 redirects to login
- [ ] 400 shows field errors
- [ ] 500 shows error toast
- [ ] Retry button works

### Step 4.6: Monitor Logs

```bash
# Check Supabase logs
# 1. Go to Supabase Dashboard
# 2. Click "Logs" in sidebar
# 3. Check for any errors

# Check hosting provider logs
# 1. Vercel: Dashboard → Deployments → Logs
# 2. Netlify: Site → Deploys → Deploy log

# Check browser console
# 1. Open DevTools (F12)
# 2. Check Console tab for errors
# 3. Check Network tab for failed requests
```

**Expected Results**:
- [ ] No errors in Supabase logs
- [ ] No errors in hosting provider logs
- [ ] No errors in browser console
- [ ] All network requests successful

---

## Part 5: Production Monitoring

### Daily Checks (First Week)

```bash
# 1. Check error logs
#    - Supabase Dashboard → Logs
#    - Hosting provider dashboard

# 2. Monitor user creation flow
#    - Create test user
#    - Verify user appears in list

# 3. Monitor dashboard performance
#    - Load dashboard
#    - Check load time
#    - Check for errors

# 4. Monitor API response times
#    - Check edge function logs
#    - Check database query times

# 5. Check for user-reported issues
#    - Email, Slack, support channel
```

### Weekly Checks (Ongoing)

```bash
# 1. Review error logs
#    - Identify patterns
#    - Fix critical issues

# 2. Check performance metrics
#    - Page load time
#    - API response time
#    - Error rate

# 3. Monitor database usage
#    - Check query performance
#    - Monitor storage usage

# 4. Check edge function usage
#    - Monitor invocation count
#    - Check error rate

# 5. Review user feedback
#    - Collect feedback
#    - Prioritize improvements
```

### Monthly Checks (Ongoing)

```bash
# 1. Review analytics
#    - User growth
#    - Feature usage
#    - Error trends

# 2. Check for security issues
#    - Review access logs
#    - Check for suspicious activity

# 3. Review performance trends
#    - Identify bottlenecks
#    - Plan optimizations

# 4. Plan for improvements
#    - Prioritize features
#    - Schedule updates

# 5. Update documentation
#    - Keep docs current
#    - Document changes
```

---

## Troubleshooting

### Issue: Edge Function Deployment Fails

**Error**: `Error: Function deployment failed`

**Solution**:
```bash
# 1. Check Supabase CLI version
supabase --version

# 2. Update Supabase CLI
npm install -g supabase@latest

# 3. Try deployment again
supabase functions deploy create-user --no-verify-jwt
```

### Issue: Frontend Build Fails

**Error**: `Error: Build failed`

**Solution**:
```bash
# 1. Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# 2. Clear build cache
rm -rf dist

# 3. Try build again
npm run build
```

### Issue: Environment Variables Not Working

**Error**: `VITE_SUPABASE_URL is undefined`

**Solution**:
```bash
# 1. Verify .env.local exists
cat .env.local

# 2. Verify variables are set in hosting provider
# Vercel: Settings → Environment Variables
# Netlify: Site Settings → Build & Deploy → Environment

# 3. Redeploy after setting variables
vercel deploy --prod  # or netlify deploy --prod
```

### Issue: App Shows Blank Screen

**Error**: White screen, no content

**Solution**:
```bash
# 1. Check browser console (F12)
# 2. Check for JavaScript errors
# 3. Check network tab for failed requests
# 4. Check Supabase connection
# 5. Verify environment variables are set
```

### Issue: Profile Fetch Timeout

**Error**: `Profile fetch timeout`

**Solution**:
```bash
# 1. Check Supabase connection
# 2. Check database query performance
# 3. Check network latency
# 4. Verify RLS policies are correct
# 5. Check Supabase logs for errors
```

---

## Rollback Plan

### If Deployment Fails

#### Step 1: Identify Issue
```bash
# 1. Check deployment logs
# 2. Check error messages
# 3. Check browser console
# 4. Check network requests
```

#### Step 2: Rollback Frontend
```bash
# 1. Revert to previous version
git revert <commit-hash>

# 2. Rebuild
npm run build

# 3. Redeploy
vercel deploy --prod  # or netlify deploy --prod
```

#### Step 3: Rollback Edge Functions
```bash
# 1. Revert to previous version
git revert <commit-hash>

# 2. Redeploy
supabase functions deploy create-user --no-verify-jwt
supabase functions deploy admin-set-password --no-verify-jwt
```

#### Step 4: Verify Rollback
```bash
# 1. Test app loads
# 2. Test login works
# 3. Test dashboard loads
# 4. Check logs for errors
```

---

## Post-Deployment Checklist

### Deployment Complete ✅
- [ ] Edge functions deployed
- [ ] Frontend deployed
- [ ] Environment variables set
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

## Success Criteria

### Deployment Success
- ✅ All edge functions deployed
- ✅ Frontend deployed to production
- ✅ All environment variables set
- ✅ No errors in logs
- ✅ All features working

### User Acceptance
- ✅ Users can login
- ✅ Users can create accounts
- ✅ Dashboard loads correctly
- ✅ All pages accessible
- ✅ No performance issues

### Monitoring
- ✅ Error logs monitored
- ✅ Performance metrics tracked
- ✅ User feedback collected
- ✅ Issues resolved quickly

---

## Sign-Off

**Deployment Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Status**: ✅ DEPLOYMENT COMPLETE

---

## Support & Contact

For deployment issues or questions:
- Check TROUBLESHOOTING.md
- Review error logs
- Contact development team
- Check Supabase documentation
- Check hosting provider documentation

---

**Congratulations on your deployment! 🎉**

Your DAI-TSMS application is now live and ready for users!
