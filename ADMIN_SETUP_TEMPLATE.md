# Admin User Setup Template

**⚠️ IMPORTANT:** This is a template. The actual ADMIN_SETUP.md file contains sensitive credentials and is in .gitignore.

---

## How to Create Admin User

### Option 1: Interactive Prompt (Recommended)
```bash
npm run create-admin
```

The script will prompt you for:
1. Admin email address
2. Admin password (hidden input)
3. Password confirmation

### Option 2: Command Line Parameters
```bash
npm run create-admin admin@example.com MySecurePassword123
```

This will create an admin user with the provided email and password.

---

## Usage Examples

### Interactive Mode
```bash
$ npm run create-admin

DAI-TSMS Admin User Creator

No email provided. Please enter admin credentials.

Admin Email: admin@company.com
Admin Password: **********************
Confirm Password: **********************

Creating admin user: admin@company.com...
  ✓ Created new admin user: bcad415f-2147-4a6f-8fd8-1e9c99516c9e
  Creating admin profile...
  ✓ Admin profile created

✅ Admin user setup complete!
   Email: admin@company.com
   Auth ID: bcad415f-2147-4a6f-8fd8-1e9c99516c9e
   Role: admin
   First Login Pending: false

⚠️  Save your password securely (not shown here for security)
```

### CLI Parameters Mode
```bash
npm run create-admin admin@company.com MySecurePassword123
```

---

## Admin Permissions

Admin users have:
- ✅ Full read/write access to all tables
- ✅ Can manage all entities
- ✅ Can view all users
- ✅ Can manage timetables
- ✅ Can approve swap requests

---

## Security Notes

- ✅ ADMIN_SETUP.md is in .gitignore (won't be committed)
- ✅ Passwords are hashed in Supabase Auth
- ✅ Service role key is only used in seed scripts
- ✅ Password input is hidden when prompted
- ✅ Password confirmation required in interactive mode
- ⚠️ Keep admin credentials secure
- ⚠️ Don't share passwords via email or chat
- ⚠️ Consider changing password after first login

---

## Troubleshooting

### Admin login fails
```bash
npm run create-admin
```

### Need to reset admin password
1. Go to Supabase Dashboard → Authentication → Users
2. Find the admin user
3. Click "Reset password"
4. User receives password reset email

### Need to create additional admin users
```bash
npm run create-admin newadmin@company.com SecurePassword456
```

Or use interactive mode:
```bash
npm run create-admin
```

---

## Files

- `seed/createAdmin.js` — Admin creation script (accepts CLI params or prompts)
- `ADMIN_SETUP_TEMPLATE.md` — This template (safe to commit)
- `ADMIN_SETUP.md` — Actual credentials (in .gitignore, not committed)

---

**Never commit ADMIN_SETUP.md to git. It contains sensitive credentials.**
