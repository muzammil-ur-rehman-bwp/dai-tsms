# DAI-TSMS Quick Reference Card

## Database Status
- **Project:** nryjxluuseawwweczouj (Supabase)
- **URL:** https://nryjxluuseawwweczouj.supabase.co
- **Status:** ✅ Schema applied, seed data loaded

## Seed Data Summary
| Entity | Count | Status |
|--------|-------|--------|
| Academic Years | 10 | ✅ |
| Academic Semesters | 3 | ✅ |
| Academic Periods | 4 | ✅ |
| Disciplines | 4 | ✅ |
| Programs | 3 | ✅ |
| Semester Numbers | 8 | ✅ |
| Section Numbers | 10 | ✅ |
| Degree Levels | 5 | ✅ |
| Campuses | 3 | ✅ |
| Sections | 138 | ✅ |
| Slot Durations | 5 | ✅ |
| Teachers | 12 | ✅ |

## Key Tables
- **Reference:** academic_years, disciplines, programs, campuses, etc.
- **Core:** teachers, students, courses, rooms, timetables
- **Scheduling:** slots, course_section_assignments, swap_requests

## RLS Roles
- **Admin:** Full read/write access
- **Teacher:** Read all slots, cannot modify directly
- **Student:** Read only own section's slots

## Teacher Accounts (12)
All created with auth users and profiles:
- Najia Saher, Wareesa Sharif, Ghulam Gilanie, Amna Shifa
- Qurat ul Ain Quraishi, Amna Ashraf, Mobeen Shahroz
- Syed Adnan Shah Bukhari, Muhammad Altaf Ahmad
- Haseeb Ali, Muzammil Ur Rehman, Saba Tahir

## Section Naming
Format: `{DISCIPLINE}-{SEMESTER}-{SECTION}{PROGRAM}`
- Example: BSARIN-1ST-1M (BS AI, 1st semester, section 1, Morning)
- Total: 138 sections (4 disciplines × 8 semesters × 10 sections × 3 programs)

## Slot Constraints
- **Time Window:** 08:00–20:00
- **Grid:** 15-minute intervals
- **Valid Durations:** 30, 45, 60, 75, 90 minutes
- **Days:** Mon–Thu always on; Fri–Sun optional per timetable

## Active Period
- **Current:** 2026 SPRING (is_active = true)
- **Others:** 2026 FALL, 2027 SPRING, 2027 FALL

## Environment Variables
```
VITE_SUPABASE_URL=https://nryjxluuseawwweczouj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Common Commands
```bash
# Run seed script
npm run seed

# Generate TypeScript types
supabase gen types --linked > src/types/database.ts

# Reset database (destructive)
supabase db reset --linked --yes

# Push migrations
supabase db push --linked --yes
```

## Next Steps
1. ✅ Database schema verified
2. ✅ Seed data loaded
3. ⏳ Enable Realtime for slots table
4. ⏳ Create admin user in Supabase Auth
5. ⏳ Generate TypeScript types
6. ⏳ Start frontend development

## Documentation
- `DATABASE_VERIFICATION.md` — Full schema and seed details
- `SETUP_COMPLETE.md` — Setup completion summary
- `plan.md` — Complete implementation plan (28 tasks)
- `seed/seed_logic.md` — Seed data logic and naming conventions

## Spec Location
`.kiro/specs/academic-timetable-system/`
- Workflow: Requirements-First
- Status: Ready for task execution

---

**Last Updated:** April 15, 2026  
**Status:** ✅ Database Ready for Frontend Development
