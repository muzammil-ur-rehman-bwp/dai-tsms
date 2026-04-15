#!/usr/bin/env node
/**
 * DAI-TSMS Seed Runner
 * Seeds all reference data into Supabase using the service-role key.
 *
 * IMPORTANT: SUPABASE_SERVICE_ROLE_KEY must be set as an environment variable
 * or added to .env.local manually. Do NOT commit the service-role key to source code.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=your_key npm run seed
 *   — or —
 *   Add SUPABASE_SERVICE_ROLE_KEY=your_key to .env.local, then: npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 1. Load environment variables from .env.local (simple KEY=VALUE parser)
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
    'Add it to .env.local or export it as an environment variable.\n' +
    'Do NOT commit the service-role key to source code.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// 2. CSV parser — handles quoted fields, trims whitespace
// ---------------------------------------------------------------------------
function parseCSV(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    if (values.every(v => !v.trim())) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ---------------------------------------------------------------------------
// 3. Upsert helper with logging
// ---------------------------------------------------------------------------
async function upsertAll(table, records, conflictColumn, label) {
  if (records.length === 0) {
    console.log(`Seeding ${label}... skipped (no records)`);
    return;
  }
  process.stdout.write(`Seeding ${label}... `);
  const { error } = await supabase
    .from(table)
    .upsert(records, { onConflict: conflictColumn, ignoreDuplicates: false });
  if (error) {
    console.error(`\nERROR seeding ${label}:`, error.message);
    throw error;
  }
  console.log(`done (${records.length} records)`);
}

// ---------------------------------------------------------------------------
// 4. Seed functions
// ---------------------------------------------------------------------------

// 3.2 academic_years
async function seedAcademicYears() {
  const rows = parseCSV(resolve(__dirname, 'academic_years.csv'));
  const records = rows.map(r => ({
    name: r['name'],
    short_name: r['short name'],
  }));
  await upsertAll('academic_years', records, 'name', 'academic_years');
}

// 3.3 academic_semesters
async function seedAcademicSemesters() {
  const rows = parseCSV(resolve(__dirname, 'academic_semesters.csv'));
  const records = rows.map(r => ({
    name: r['name'],
    short_name: r['short name'],
    short_code: r['short code'],
    is_system_defined: true,
  }));
  await upsertAll('academic_semesters', records, 'name', 'academic_semesters');
}

// 3.4 academic_periods — resolve FK IDs from year name + semester name
async function seedAcademicPeriods() {
  const rows = parseCSV(resolve(__dirname, 'academic_periods.csv'));

  // Fetch lookup maps
  const { data: years, error: yearsErr } = await supabase
    .from('academic_years').select('id, name');
  if (yearsErr) throw yearsErr;
  const { data: semesters, error: semsErr } = await supabase
    .from('academic_semesters').select('id, name');
  if (semsErr) throw semsErr;

  const yearMap = Object.fromEntries(years.map(y => [y.name, y.id]));
  const semMap = Object.fromEntries(semesters.map(s => [s.name, s.id]));

  const records = rows.map(r => {
    const yearId = yearMap[r['acadmic year'] || r['academic year']];
    const semId = semMap[r['academic semester']];
    if (!yearId) throw new Error(`academic_periods: unknown year "${r['acadmic year'] || r['academic year']}"`);
    if (!semId) throw new Error(`academic_periods: unknown semester "${r['academic semester']}"`);
    return {
      name: r['name'],
      academic_year_id: yearId,
      academic_semester_id: semId,
      is_active: r['is_active'] === 'true',
    };
  });

  await upsertAll('academic_periods', records, 'name', 'academic_periods');
}

// 3.5 disciplines — with sort_order
async function seedDisciplines() {
  const rows = parseCSV(resolve(__dirname, 'disciplines.csv'));
  const sortOrderMap = { BSARIN: 1, BSADARIN: 2, MSARIN: 3, PHARIN: 4 };
  const records = rows
    .filter(r => r['name'] && r['short name'])
    .map(r => ({
      name: r['name'],
      short_name: r['short name'],
      sort_order: sortOrderMap[r['short name']] ?? 99,
      is_active: true,
    }));
  await upsertAll('disciplines', records, 'name', 'disciplines');
}

// 3.6 programs — with sort_order
async function seedPrograms() {
  const rows = parseCSV(resolve(__dirname, 'programs.csv'));
  const sortOrderMap = { M: 1, E: 2, W: 3 };
  const records = rows
    .filter(r => r['name'])
    .map(r => ({
      name: r['name'],
      short_name: r['short name'],
      short_code: r['short code'],
      sort_order: sortOrderMap[r['short code']] ?? 99,
      is_active: true,
    }));
  await upsertAll('programs', records, 'name', 'programs');
}

// 3.7 semester_numbers
async function seedSemesterNumbers() {
  const rows = parseCSV(resolve(__dirname, 'semester_numbers.csv'));
  const records = rows.map(r => ({
    name: r['name'],
    number: parseInt(r['number'], 10),
  }));
  await upsertAll('semester_numbers', records, 'name', 'semester_numbers');
}

// 3.8 section_numbers
async function seedSectionNumbers() {
  const rows = parseCSV(resolve(__dirname, 'section_numbers.csv'));
  const records = rows.map(r => ({
    name: r['name'],
    number: parseInt(r['number'], 10),
  }));
  await upsertAll('section_numbers', records, 'name', 'section_numbers');
}

// 3.9 degree_levels
async function seedDegreeLevels() {
  const rows = parseCSV(resolve(__dirname, 'degree_levels.csv'));
  const records = rows
    .filter(r => r['name'])
    .map(r => ({
      name: r['name'],
      short_name: r['short name'],
      number: parseInt(r['number'], 10),
      is_active: true,
    }));
  await upsertAll('degree_levels', records, 'name', 'degree_levels');
}

// 3.10 campuses — with sort_order
async function seedCampuses() {
  const rows = parseCSV(resolve(__dirname, 'campuses.csv'));
  const sortOrderMap = { B: 1, R: 2, N: 3 };
  const records = rows
    .filter(r => r['name'])
    .map(r => ({
      name: r['name'],
      short_name: r['short name'],
      sort_order: sortOrderMap[r['short name']] ?? 99,
      is_active: true,
    }));
  await upsertAll('campuses', records, 'name', 'campuses');
}

// 3.11 sections — parse section name into component parts, resolve FK IDs
async function seedSections() {
  const rows = parseCSV(resolve(__dirname, 'sections.csv'));

  // Fetch lookup maps
  const { data: disciplines, error: discErr } = await supabase
    .from('disciplines').select('id, short_name');
  if (discErr) throw discErr;
  const { data: semNums, error: semErr } = await supabase
    .from('semester_numbers').select('id, name');
  if (semErr) throw semErr;
  const { data: secNums, error: secErr } = await supabase
    .from('section_numbers').select('id, name');
  if (secErr) throw secErr;
  const { data: programs, error: progErr } = await supabase
    .from('programs').select('id, short_code');
  if (progErr) throw progErr;

  const discMap = Object.fromEntries(disciplines.map(d => [d.short_name, d.id]));
  const semMap = Object.fromEntries(semNums.map(s => [s.name, s.id]));
  const secMap = Object.fromEntries(secNums.map(s => [s.name, s.id]));
  const progMap = Object.fromEntries(programs.map(p => [p.short_code, p.id]));

  // Deduplicate section names from CSV
  const seen = new Set();
  const records = [];
  let skipped = 0;

  for (const row of rows) {
    const sectionName = row['section name'];
    if (!sectionName) continue;
    if (seen.has(sectionName)) { skipped++; continue; }
    seen.add(sectionName);

    // Parse: DISCIPLINE-SEMNUM-SECNUMPROGCODE
    // e.g. BSARIN-1ST-1M  → disc=BSARIN, sem=1ST, sec=1, prog=M
    // e.g. BSARIN-1ST-10M → disc=BSARIN, sem=1ST, sec=10, prog=M
    const match = sectionName.match(/^([A-Z]+)-([A-Z0-9]+)-(\d+)([A-Z]+)$/);
    if (!match) {
      console.warn(`  sections: cannot parse name "${sectionName}", skipping`);
      skipped++;
      continue;
    }
    const [, discShort, semName, secName, progCode] = match;

    const disciplineId = discMap[discShort];
    const semesterId = semMap[semName];
    const sectionNumId = secMap[secName];
    const programId = progMap[progCode];

    if (!disciplineId || !semesterId || !sectionNumId || !programId) {
      console.warn(`  sections: unresolved FK for "${sectionName}" (disc=${discShort}, sem=${semName}, sec=${secName}, prog=${progCode}), skipping`);
      skipped++;
      continue;
    }

    records.push({
      discipline_id: disciplineId,
      semester_number_id: semesterId,
      section_number_id: sectionNumId,
      program_id: programId,
      is_active: true,
    });
  }

  if (skipped > 0) {
    console.log(`  (${skipped} duplicate/unparseable section names skipped)`);
  }

  // The trigger auto-generates the name; upsert on the 4-FK unique constraint
  process.stdout.write(`Seeding sections... `);
  if (records.length === 0) {
    console.log('skipped (no valid records)');
    return;
  }
  const { error } = await supabase
    .from('sections')
    .upsert(records, {
      onConflict: 'discipline_id,semester_number_id,section_number_id,program_id',
      ignoreDuplicates: true,
    });
  if (error) {
    console.error(`\nERROR seeding sections:`, error.message);
    throw error;
  }
  console.log(`done (${records.length} records)`);
}

// 3.12 slot_durations — hardcoded, no CSV
async function seedSlotDurations() {
  const records = [30, 45, 60, 75, 90].map(m => ({ minutes: m }));
  await upsertAll('slot_durations', records, 'minutes', 'slot_durations');
}

// 3.13 teachers — upsert teacher + create auth user + insert profile
async function seedTeachers() {
  const rows = parseCSV(resolve(__dirname, 'teachers.csv'));
  console.log(`Seeding teachers... (${rows.length} records)`);

  const summary = { created: 0, existing: 0, errors: 0 };

  for (const row of rows) {
    const name = row['teacher name'];
    const email = row['email'];
    const password = row['password'];
    const designation = row['designation'] || null;
    const expertise = row['expertise'] || null;
    const mobileNumber = row['mobile number'] || null;

    if (!email || !password) {
      console.warn(`  Skipping teacher "${name}": missing email or password`);
      summary.errors++;
      continue;
    }

    // Step 1: Create or find Supabase Auth user
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
        const { data: listData, error: listErr } =
          await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (listErr) {
          console.warn(`  Could not list users to find existing "${email}": ${listErr.message}`);
          summary.errors++;
          continue;
        }
        const existing = listData.users.find(u => u.email === email);
        if (existing) {
          authUserId = existing.id;
          summary.existing++;
        } else {
          console.warn(`  Could not find existing auth user for "${email}"`);
          summary.errors++;
          continue;
        }
      } else {
        console.warn(`  Auth user creation failed for "${email}": ${createErr.message}`);
        summary.errors++;
        continue;
      }
    } else {
      authUserId = createData.user.id;
      summary.created++;
    }

    // Step 2: Upsert teacher record
    const { error: teacherErr } = await supabase
      .from('teachers')
      .upsert(
        {
          auth_user_id: authUserId,
          name,
          designation,
          expertise,
          mobile_number: mobileNumber,
          email,
          is_active: true,
        },
        { onConflict: 'email', ignoreDuplicates: false }
      );
    if (teacherErr) {
      console.warn(`  Teacher upsert failed for "${email}": ${teacherErr.message}`);
      summary.errors++;
      continue;
    }

    // Step 3: Upsert profile with role=teacher, first_login_pending=true
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUserId,
          role: 'teacher',
          first_login_pending: true,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    if (profileErr) {
      console.warn(`  Profile upsert failed for "${email}": ${profileErr.message}`);
      // Non-fatal — teacher record is already in place
    }

    console.log(`  ✓ ${name} <${email}> (auth_user_id: ${authUserId})`);
  }

  console.log(
    `  Teachers done — created: ${summary.created}, already existed: ${summary.existing}, errors: ${summary.errors}`
  );
}

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------
async function printSummary() {
  const tables = [
    'academic_years', 'academic_semesters', 'academic_periods',
    'disciplines', 'programs', 'semester_numbers', 'section_numbers',
    'degree_levels', 'campuses', 'sections', 'slot_durations', 'teachers',
  ];
  console.log('\n--- Seed Summary ---');
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ${table}: ERROR (${error.message})`);
    } else {
      console.log(`  ${table}: ${count} records`);
    }
  }
  console.log('--------------------\n');
}

// ---------------------------------------------------------------------------
// 6. Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('DAI-TSMS Seed Runner starting...\n');

  try {
    await seedAcademicYears();       // 3.2
    await seedAcademicSemesters();   // 3.3
    await seedAcademicPeriods();     // 3.4
    await seedDisciplines();         // 3.5
    await seedPrograms();            // 3.6
    await seedSemesterNumbers();     // 3.7
    await seedSectionNumbers();      // 3.8
    await seedDegreeLevels();        // 3.9
    await seedCampuses();            // 3.10
    await seedSections();            // 3.11
    await seedSlotDurations();       // 3.12
    await seedTeachers();            // 3.13

    await printSummary();            // 3.14 idempotency verified via summary counts
    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('\nSeed failed:', err.message || err);
    process.exit(1);
  }
}

main();
