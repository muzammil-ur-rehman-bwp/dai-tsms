# Integration Tests

These tests require a **live Supabase instance** and cannot run in CI without one.
They are written as `describe.skip` stubs so the test suite still parses cleanly.

## Prerequisites

1. A running Supabase project (local or hosted).
2. The following environment variables set in your shell (or a `.env.test.local` file):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # needed for seed & admin tests
```

3. The seed script has been run at least once:

```bash
npm run seed
```

## Running the Integration Tests

Remove (or comment out) the `.skip` modifier on the `describe` block you want to run,
then execute:

```bash
npx vitest run src/integration/<file>.test.js
```

Or run all integration tests at once:

```bash
npx vitest run src/integration/
```

> **Warning:** These tests mutate live data. Run them against a dedicated test/staging
> Supabase project, never against production.

## Test Files

| File | What it covers |
|------|----------------|
| `seed.test.js` | Seed script record counts and teacher auth users |
| `rls.test.js` | Row-Level Security policies for student and teacher roles |
| `realtime.test.js` | Supabase Realtime propagation latency |
| `timetable.test.js` | Timetable publish guard and atomic swap RPC |
| `deployment.test.js` | End-to-end deployment verification checklist |
