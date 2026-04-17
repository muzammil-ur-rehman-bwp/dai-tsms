# DAI-TSMS UI Adaptation - Quick Start Guide

**TL;DR**: Deploy in 3 steps

---

## 🚀 Quick Deployment (30 minutes)

### Step 1: Deploy Edge Functions (5 min)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy create-user --no-verify-jwt
supabase functions deploy admin-set-password --no-verify-jwt
```

### Step 2: Build Frontend (5 min)

```bash
# Install dependencies
npm install

# Create .env.local with your Supabase credentials
cat > .env.local << EOF
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_LLM_API_KEY=<your-llm-api-key>
VITE_LLM_API_URL=<your-llm-api-url>
EOF

# Build
npm run build
```

### Step 3: Deploy to Hosting (20 min)

#### Option A: Vercel
```bash
# Install and login
npm install -g vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_LLM_API_KEY
vercel env add VITE_LLM_API_URL

# Deploy
vercel deploy --prod
```

#### Option B: Netlify
```bash
# Install and login
npm install -g netlify-cli
netlify login

# Link project
netlify link

# Set environment variables
netlify env:set VITE_SUPABASE_URL https://<project-id>.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY <your-anon-key>
netlify env:set VITE_LLM_API_KEY <your-llm-api-key>
netlify env:set VITE_LLM_API_URL <your-llm-api-url>

# Deploy
netlify deploy --prod
```

---

## ✅ Verify Deployment

```bash
# 1. Open app in browser
# 2. Login with test credentials
# 3. Create a new user
# 4. View dashboard
# 5. Check responsive design on mobile
```

---

## 📚 Full Documentation

- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **DEPLOYMENT_CHECKLIST.md** - Pre/post deployment checklist
- **STATUS_REPORT.md** - Project status and metrics
- **FINAL_SUMMARY.md** - Complete project summary
- **design.md** - Technical architecture
- **requirements.md** - Detailed requirements

---

## 🆘 Troubleshooting

### Edge Function Deployment Fails
```bash
# Update Supabase CLI
npm install -g supabase@latest

# Try again
supabase functions deploy create-user --no-verify-jwt
```

### Frontend Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working
```bash
# Verify .env.local exists
cat .env.local

# Verify variables set in hosting provider
# Vercel: Settings → Environment Variables
# Netlify: Site Settings → Build & Deploy → Environment

# Redeploy
vercel deploy --prod  # or netlify deploy --prod
```

### App Shows Blank Screen
```bash
# Check browser console (F12)
# Check network tab for failed requests
# Verify Supabase connection
# Verify environment variables are set
```

---

## 📞 Support

- Check DEPLOYMENT_GUIDE.md for detailed instructions
- Review error logs in Supabase Dashboard
- Check hosting provider logs
- Contact development team

---

## 🎉 You're Done!

Your DAI-TSMS application is now live! 🚀

**Next Steps**:
1. Monitor logs for errors
2. Gather user feedback
3. Set up testing framework
4. Plan for future enhancements

---

**Questions?** Check the full documentation files in `.kiro/specs/dai-nsct-ui-adaptation/`
