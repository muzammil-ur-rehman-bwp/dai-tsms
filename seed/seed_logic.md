# Seed Data Reference & Logic

## Target
Before a timetable is scheduled and created, admin is required to upload (single form based or bulk csv based) data necessary for timetable generation and scheduling. Providing seed data via files: seed/*.csv, which should be fed to the supabase and used by requirement.md file for reference and logic. Data Entities with reference and logic are given below: 

---

### 1. Academic Year
- **Plural**: Academic Years
- **Seed file path**: seed/academic_years.csv

### 2. Academic Semester
- **Plural**: Academic Semesters
- **Seed file path**: seed/academic_semesters.csv

### 3. Academic Period
- **Plural**: Academic Periods
- **Naming Logic**: `<academic year name>` `<academic semester name>`
- **Example**: 2026 SPRING, 2026 FALL etc.
- **Seed file path**: seed/academic_periods.csv

### 4. Discipline
- **Plural**: Disciplines
- **Seed file path**: seed/disciplines.csv

### 5. Program
- **Plural**: Programs
- **Seed file path**: seed/porgrams.csv

### 6. Semester Number
- **Plural**: Semester Numbers
- **Seed file path**: seed/semester_numbers.csv

### 7. Section Number
- **Plural**: Section Numbers
- **Seed file path**: seed/section_numbers.csv

### 8. Degree Level
- **Plural**: Degree Levels
- **Seed file path**: seed/degree_levels.csv

### 9. Campus
- **Plural**: Campuses
- **Seed file path**: seed/campuses.csv

### 10. Section
- **Plural**: Sections 
- **Nameing Logic**: `<discipline short name>`-`<semester name>`-`<section number><program short name>`
- **Example**: BSARIN-1ST-1M, BSARIN-1ST-1E etc. 
- **Sorting Logic**: first by discipline short name custom order i.e.: BSARIN, BSADARIN, MSARIN, PHARIN, then by semester name A-Z ascending sort, then by program short name custom order: M, E, W, then by section number: A-Z ascending sort
- **Sortign Examples**: BSARIN-1ST-1M, BSARIN-1ST-1E, BSADARIN-1ST-1M, BSADARIN-1ST-1E, MSARIN-1ST-1M, MSARIN-1ST-1E, PHARIN-1ST-1M, PHARIN-1ST-1E
- **Seed file path**: seed/sections.csv

### 11. Teacher
- **Plural**: Teachers
- **Seed file path**: seed/teachers.csv

### 12. Student
- **Plural**: Students
- **Nameing Logic**: `<academic semester short code><academic year short name><campus short name>`ARIN`<degree level number><program short name>`0[0-9]{4}
- **Example**: F26BARIN1M01001, F26BARIN1M01002, F26BARIN1E02001, F26BARIN1E02002, F26BARIN1E02001, F26BARIN7M01001, F26BARIN7M01002, F26BARIN7E02001, F26BARIN7E02002, F26BARIN1E02001 etc. 
- **Sorting Logic**: first by academic semester short code custom order i.e.: S,F, then by academic year short name A-Z ascending sort, then by campus short name custom order: B, R, N, , then by degree level number A-Z ascending sort, then by program short name custom order: M, E, W, then by last 6 digits A-Z ascending sort
- **Sortign Examples**: F26BARIN1M01001, F26BARIN1M01002, F26BARIN1E02001, F26BARIN1E02002, F26BARIN1E02001, F26BARIN7M01001, F26BARIN7M01002, F26BARIN7E02001, F26BARIN7E02002, F26BARIN1E02001, F26BARIN3M01001, F26BARIN3M01002, F26BARIN3E02001, F26BARIN3E02002, F26BARIN4M01001, F26BARIN4M01002, F26BARIN4E02001, F26BARIN4E02002
 Data seed: none, to be uploaded in bulk via csv later.

### 13. Course
- **Plural**: Courses
- **Fields**: name, code, credit hours
- **Data seed**: none, to be uploaded in bulk via csv later.

### 14. Room
- **Plural**: Rooms
- **Fields**: name, capacity
- **Data seed**: none, to be uploaded in bulk via csv later.

### 15. Slot
- **Plural**: Slots
- **Fields**: infer
- **Data seed**: none, to be uploaded in bulk via csv later.

### 16. Slot Duration
- **Plural**: Slot Durations
- **Fields**: infer
- **Data seed**: none, to be uploaded in bulk via csv later.