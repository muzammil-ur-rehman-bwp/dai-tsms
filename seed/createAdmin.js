#!/usr/bin/env node
/**
 * DAI-TSMS Admin User Creator
 * Creates an admin user with auth account and profile
 *
 * Usage:
 *   npm run create-admin [email] [password]
 *   npm run create-admin admin@example.com mySecurePassword123
 *   npm run create-admin (will prompt for email and password interactively)
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY must be set in .env.local or as env var
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 1. Load environment variables from .env.local
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = resolve(__dirname, '..', '.env.local');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('ERROR: SUPABASE_URL (or VITE_SUPABASE_URL) is not set.');
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error(
    'ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
    'Add it to .env.local or export it as an environment variable.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// 2. Prompt for input
// ---------------------------------------------------------------------------
function promptUser(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function promptPassword(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    // Hide password input
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (char === '\u0003') {
        process.exit();
      } else if (char === '\u007f') {
        // Backspace
        password = password.slice(0, -1);
        process.stdout.write('\b \b');
      } else {
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

// ---------------------------------------------------------------------------
// 3. Validate email format
// ---------------------------------------------------------------------------
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ---------------------------------------------------------------------------
// 4. Create Admin User
// ---------------------------------------------------------------------------
async function createAdminUser(email, password) {
  console.log(`\nCreating admin user: ${email}...`);

  // Step 1: Create or find auth user
  let authUserId = null;
  const { data: createData, error: createErr } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createErr) {
    if (createErr.message?.toLowerCase().includes('already been registered') ||
        createErr.message?.toLowerCase().includes('already exists') ||
        createErr.code === 'email_exists' ||
        createErr.status === 422) {
      // User already exists — look up their ID
      console.log(`  Admin user already exists, fetching ID...`);
      const { data: listData, error: listErr } =
        await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (listErr) {
        console.error(`  ERROR: Could not list users: ${listErr.message}`);
        return false;
      }
      const existing = listData.users.find(u => u.email === email);
      if (existing) {
        authUserId = existing.id;
        console.log(`  ✓ Found existing admin user: ${authUserId}`);
      } else {
        console.error(`  ERROR: Could not find existing admin user`);
        return false;
      }
    } else {
      console.error(`  ERROR: Auth user creation failed: ${createErr.message}`);
      return false;
    }
  } else {
    authUserId = createData.user.id;
    console.log(`  ✓ Created new admin user: ${authUserId}`);
  }

  // Step 2: Create or update profile with role=admin
  console.log(`  Creating admin profile...`);
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: authUserId,
        role: 'admin',
        first_login_pending: false, // Admin doesn't need to change password
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );

  if (profileErr) {
    console.error(`  ERROR: Profile creation failed: ${profileErr.message}`);
    return false;
  }

  console.log(`  ✓ Admin profile created`);
  console.log(`\n✅ Admin user setup complete!`);
  console.log(`   Email: ${email}`);
  console.log(`   Auth ID: ${authUserId}`);
  console.log(`   Role: admin`);
  console.log(`   First Login Pending: false`);
  console.log(`\n⚠️  Save your password securely (not shown here for security)`);

  return true;
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('DAI-TSMS Admin User Creator\n');

  let email = process.argv[2];
  let password = process.argv[3];

  // If email not provided via CLI, prompt for it
  if (!email) {
    console.log('No email provided. Please enter admin credentials.\n');
    email = await promptUser('Admin Email: ');
    
    // Validate email
    while (!isValidEmail(email)) {
      console.log('❌ Invalid email format. Please try again.');
      email = await promptUser('Admin Email: ');
    }
  }

  // If password not provided via CLI, prompt for it
  if (!password) {
    password = await promptPassword('Admin Password: ');
    
    // Validate password length
    while (password.length < 8) {
      console.log('\n❌ Password must be at least 8 characters.');
      password = await promptPassword('Admin Password: ');
    }
    
    // Confirm password
    const confirmPassword = await promptPassword('Confirm Password: ');
    while (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match. Please try again.');
      password = await promptPassword('Admin Password: ');
      const confirmPassword2 = await promptPassword('Confirm Password: ');
      if (password === confirmPassword2) break;
    }
  }

  try {
    const success = await createAdminUser(email, password);
    if (!success) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\nAdmin creation failed:', err.message || err);
    process.exit(1);
  }
}

main();
