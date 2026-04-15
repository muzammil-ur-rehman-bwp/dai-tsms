import {
  SCHEDULING_WINDOW_START,
  SCHEDULING_WINDOW_END,
  SLOT_INTERVAL_MINUTES,
  SEMESTER_CODE_SORT_ORDER,
  CAMPUS_SORT_ORDER,
  PROGRAM_SORT_ORDER,
} from './constants.js'

/**
 * Converts a 0-based 15-minute grid index to a "HH:MM" time string.
 * Index 0 → "08:00", index 1 → "08:15", index 2 → "08:30", etc.
 * @param {number} index - 0-based grid index
 * @returns {string} time string in "HH:MM" format
 */
export function gridIndexToTime(index) {
  const [startHour, startMin] = SCHEDULING_WINDOW_START.split(':').map(Number)
  const totalMinutes = startHour * 60 + startMin + index * SLOT_INTERVAL_MINUTES
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Converts a "HH:MM" time string to a 0-based 15-minute grid index.
 * "08:00" → 0, "08:15" → 1, "08:30" → 2, etc.
 * @param {string} time - time string in "HH:MM" format
 * @returns {number} 0-based grid index
 */
export function timeToGridIndex(time) {
  const [hour, min] = time.split(':').map(Number)
  const [startHour, startMin] = SCHEDULING_WINDOW_START.split(':').map(Number)
  const totalMinutes = hour * 60 + min
  const startTotalMinutes = startHour * 60 + startMin
  return (totalMinutes - startTotalMinutes) / SLOT_INTERVAL_MINUTES
}

/**
 * Returns true if the minutes component of a "HH:MM" time is on the 15-minute grid
 * (i.e., minutes ∈ {0, 15, 30, 45}).
 * @param {string} time - time string in "HH:MM" format
 * @returns {boolean}
 */
export function isOnGrid(time) {
  const [, min] = time.split(':').map(Number)
  return min % SLOT_INTERVAL_MINUTES === 0
}

/**
 * Returns true if the given start/end times are within the scheduling window
 * (start >= 08:00 and end <= 20:00).
 * @param {string} startTime - "HH:MM"
 * @param {string} endTime - "HH:MM"
 * @returns {boolean}
 */
export function isInSchedulingWindow(startTime, endTime) {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const windowStart = toMinutes(SCHEDULING_WINDOW_START)
  const windowEnd = toMinutes(SCHEDULING_WINDOW_END)
  return start >= windowStart && end <= windowEnd
}

/**
 * Adds a number of minutes to a "HH:MM" time string and returns the new "HH:MM".
 * @param {string} time - "HH:MM"
 * @param {number} minutes - minutes to add
 * @returns {string} new time in "HH:MM" format
 */
export function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMinutes = totalMinutes % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

/**
 * Returns the difference in minutes between two "HH:MM" time strings (endTime - startTime).
 * @param {string} startTime - "HH:MM"
 * @param {string} endTime - "HH:MM"
 * @returns {number} difference in minutes
 */
export function timeDiffMinutes(startTime, endTime) {
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  return toMinutes(endTime) - toMinutes(startTime)
}

// ─── Section & Student Utilities ────────────────────────────────────────────

/**
 * Generates a section name from its component parts.
 * Formula: `${discShort}-${semName}-${secName}${progCode}`
 * Example: generateSectionName('BSARIN', '1ST', '1', 'M') → 'BSARIN-1ST-1M'
 *
 * @param {string} discShort  - discipline short name (e.g. 'BSARIN')
 * @param {string} semName    - semester number name (e.g. '1ST')
 * @param {string} secName    - section number name (e.g. '1' or 'A')
 * @param {string} progCode   - program short code (e.g. 'M')
 * @returns {string}
 */
export function generateSectionName(discShort, semName, secName, progCode) {
  return `${discShort}-${semName}-${secName}${progCode}`
}

/**
 * Validates a student registration number against the expected pattern.
 * Pattern: ^[SF][0-9]{2}[BRN]ARIN[1-9][0-9]?[MEW][0-9]{6}$
 * Examples: F26BARIN1M01001, S25RARIN3E000042
 *
 * @param {string} regNo - registration number to validate
 * @returns {boolean}
 */
export function validateStudentRegNo(regNo) {
  return /^[SF][0-9]{2}[BRN]ARIN[1-9][0-9]?[MEW][0-9]{6}$/.test(regNo)
}

/**
 * Sorts an array of section objects using the custom sort order:
 * 1. discipline.sort_order (ascending)
 * 2. semester_number.name (A-Z)
 * 3. program.sort_order (ascending)
 * 4. section_number.name (A-Z)
 *
 * Each section object must have:
 *   section.discipline.sort_order
 *   section.semester_number.name
 *   section.program.sort_order
 *   section.section_number.name
 *
 * @param {Array} sections
 * @returns {Array} new sorted array
 */
export function sortSections(sections) {
  return [...sections].sort((a, b) => {
    // 1. Discipline sort_order
    const discDiff = a.discipline.sort_order - b.discipline.sort_order
    if (discDiff !== 0) return discDiff

    // 2. Semester name A-Z
    const semCmp = a.semester_number.name.localeCompare(b.semester_number.name)
    if (semCmp !== 0) return semCmp

    // 3. Program sort_order
    const progDiff = a.program.sort_order - b.program.sort_order
    if (progDiff !== 0) return progDiff

    // 4. Section number name A-Z
    return a.section_number.name.localeCompare(b.section_number.name)
  })
}

/**
 * Parses a student registration number into its component parts.
 * Pattern: [SF][0-9]{2}[BRN]ARIN[1-9][0-9]?[MEW][0-9]{6}
 *
 * @param {string} regNo
 * @returns {{ semCode: string, year: string, campus: string, degreeLevel: string, program: string, sequence: string } | null}
 */
function parseRegNo(regNo) {
  const match = regNo.match(/^([SF])([0-9]{2})([BRN])ARIN([1-9][0-9]?)([MEW])([0-9]{6})$/)
  if (!match) return null
  return {
    semCode: match[1],
    year: match[2],
    campus: match[3],
    degreeLevel: match[4],
    program: match[5],
    sequence: match[6],
  }
}

/**
 * Sorts an array of student objects using the custom sort order:
 * 1. semester short code custom order (S < F)
 * 2. year short name A-Z
 * 3. campus custom order (B < R < N)
 * 4. degree level number A-Z
 * 5. program custom order (M < E < W)
 * 6. last 6 digits A-Z
 *
 * Each student object must have: student.registration_no
 *
 * @param {Array} students
 * @returns {Array} new sorted array
 */
export function sortStudents(students) {
  return [...students].sort((a, b) => {
    const pa = parseRegNo(a.registration_no)
    const pb = parseRegNo(b.registration_no)

    // Unparseable registrations go to the end
    if (!pa && !pb) return 0
    if (!pa) return 1
    if (!pb) return -1

    // 1. Semester code order (S=1, F=2)
    const semDiff =
      (SEMESTER_CODE_SORT_ORDER[pa.semCode] ?? 99) -
      (SEMESTER_CODE_SORT_ORDER[pb.semCode] ?? 99)
    if (semDiff !== 0) return semDiff

    // 2. Year A-Z
    const yearCmp = pa.year.localeCompare(pb.year)
    if (yearCmp !== 0) return yearCmp

    // 3. Campus order (B=1, R=2, N=3)
    const campusDiff =
      (CAMPUS_SORT_ORDER[pa.campus] ?? 99) -
      (CAMPUS_SORT_ORDER[pb.campus] ?? 99)
    if (campusDiff !== 0) return campusDiff

    // 4. Degree level number A-Z
    const degreeCmp = pa.degreeLevel.localeCompare(pb.degreeLevel)
    if (degreeCmp !== 0) return degreeCmp

    // 5. Program order (M=1, E=2, W=3)
    const progDiff =
      (PROGRAM_SORT_ORDER[pa.program] ?? 99) -
      (PROGRAM_SORT_ORDER[pb.program] ?? 99)
    if (progDiff !== 0) return progDiff

    // 6. Last 6 digits A-Z
    return pa.sequence.localeCompare(pb.sequence)
  })
}

/**
 * Derives the per-slot duration from contact hours.
 * Returns contactHoursMinutes / 2.
 * Throws if the result is not in {30, 45, 60, 75, 90}.
 *
 * @param {number} contactHoursMinutes
 * @returns {number} per-slot duration in minutes
 * @throws {Error} if derived duration is not a supported slot duration
 */
export function derivePerSlotDuration(contactHoursMinutes) {
  const duration = contactHoursMinutes / 2
  if (![30, 45, 60, 75, 90].includes(duration)) {
    throw new Error(
      `Invalid per-slot duration: ${duration} minutes. ` +
      `contact_hours_minutes / 2 must be one of {30, 45, 60, 75, 90}. ` +
      `Got contact_hours_minutes = ${contactHoursMinutes}.`
    )
  }
  return duration
}

// ─── Conflict Detection ──────────────────────────────────────────────────────

/**
 * Checks whether two time intervals overlap.
 * Overlap condition: start_a < end_b AND start_b < end_a
 *
 * @param {string} startA - "HH:MM"
 * @param {string} endA   - "HH:MM"
 * @param {string} startB - "HH:MM"
 * @param {string} endB   - "HH:MM"
 * @returns {boolean}
 */
function intervalsOverlap(startA, endA, startB, endB) {
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  return toMin(startA) < toMin(endB) && toMin(startB) < toMin(endA)
}

/**
 * Detects scheduling conflicts between a new slot and a list of existing slots.
 *
 * Two slots conflict if they are on the same day AND their time intervals overlap.
 * Checks three conflict types independently: teacher, room, section.
 *
 * @param {{ day_of_week: string, start_time: string, end_time: string, teacher_id: string, room_id: string, section_id: string }} newSlot
 * @param {Array<{ id: string, day_of_week: string, start_time: string, end_time: string, teacher_id: string, room_id: string, section_id: string }>} existingSlots
 * @returns {Array<{ type: 'teacher'|'room'|'section', conflictingSlot: object }>}
 */
export function detectConflicts(newSlot, existingSlots) {
  const conflicts = []

  for (const slot of existingSlots) {
    if (slot.day_of_week !== newSlot.day_of_week) continue

    const overlaps = intervalsOverlap(
      newSlot.start_time, newSlot.end_time,
      slot.start_time, slot.end_time
    )
    if (!overlaps) continue

    if (newSlot.teacher_id && slot.teacher_id && newSlot.teacher_id === slot.teacher_id) {
      conflicts.push({ type: 'teacher', conflictingSlot: slot })
    }
    if (newSlot.room_id && slot.room_id && newSlot.room_id === slot.room_id) {
      conflicts.push({ type: 'room', conflictingSlot: slot })
    }
    if (newSlot.section_id && slot.section_id && newSlot.section_id === slot.section_id) {
      conflicts.push({ type: 'section', conflictingSlot: slot })
    }
  }

  return conflicts
}

// ─── Slot Split / Merge ──────────────────────────────────────────────────────

/**
 * Splits a source slot into consecutive equal-duration slots.
 * Each resulting slot has the same course/teacher/room/section/day but split times.
 *
 * @param {{ day_of_week: string, start_time: string, end_time: string, course_id: string, teacher_id: string, room_id: string, section_id: string, timetable_id: string, assignment_id?: string }} sourceSlot
 * @param {number} targetDurationMinutes - duration of each resulting slot
 * @returns {Array<object>} array of new slot objects
 * @throws {Error} if source duration is not evenly divisible by targetDurationMinutes
 */
export function splitSlot(sourceSlot, targetDurationMinutes) {
  const sourceDuration = timeDiffMinutes(sourceSlot.start_time, sourceSlot.end_time)

  if (sourceDuration % targetDurationMinutes !== 0) {
    throw new Error(
      `Cannot split slot of ${sourceDuration} min into ${targetDurationMinutes}-min slots: ` +
      `${sourceDuration} is not evenly divisible by ${targetDurationMinutes}.`
    )
  }

  const count = sourceDuration / targetDurationMinutes
  const slots = []
  let currentStart = sourceSlot.start_time

  for (let i = 0; i < count; i++) {
    const currentEnd = addMinutes(currentStart, targetDurationMinutes)
    slots.push({
      timetable_id: sourceSlot.timetable_id,
      assignment_id: sourceSlot.assignment_id ?? null,
      day_of_week: sourceSlot.day_of_week,
      start_time: currentStart,
      end_time: currentEnd,
      course_id: sourceSlot.course_id,
      teacher_id: sourceSlot.teacher_id,
      room_id: sourceSlot.room_id,
      section_id: sourceSlot.section_id,
    })
    currentStart = currentEnd
  }

  return slots
}

/**
 * Merges consecutive same-assignment slots into a single slot of targetDurationMinutes.
 * The source slots must be consecutive (end of one = start of next), same day,
 * and share the same course/teacher/room/section.
 *
 * @param {Array<{ day_of_week: string, start_time: string, end_time: string, course_id: string, teacher_id: string, room_id: string, section_id: string, timetable_id: string, assignment_id?: string }>} sourceSlots
 * @param {number} targetDurationMinutes - expected duration of the merged slot
 * @returns {object} merged slot object
 * @throws {Error} if slots are not consecutive or combined duration doesn't match targetDurationMinutes
 */
export function mergeSlots(sourceSlots, targetDurationMinutes) {
  if (!sourceSlots || sourceSlots.length === 0) {
    throw new Error('No source slots provided for merging.')
  }

  // Sort by start_time ascending
  const sorted = [...sourceSlots].sort((a, b) =>
    timeDiffMinutes(b.start_time, a.start_time) > 0 ? 1 : -1
  )

  // Validate consecutiveness
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start_time !== sorted[i - 1].end_time) {
      throw new Error(
        `Slots are not consecutive: slot ${i - 1} ends at ${sorted[i - 1].end_time} ` +
        `but slot ${i} starts at ${sorted[i].start_time}.`
      )
    }
  }

  const mergedStart = sorted[0].start_time
  const mergedEnd = sorted[sorted.length - 1].end_time
  const mergedDuration = timeDiffMinutes(mergedStart, mergedEnd)

  if (mergedDuration !== targetDurationMinutes) {
    throw new Error(
      `Merged duration ${mergedDuration} min does not match target ${targetDurationMinutes} min.`
    )
  }

  const first = sorted[0]
  return {
    timetable_id: first.timetable_id,
    assignment_id: first.assignment_id ?? null,
    day_of_week: first.day_of_week,
    start_time: mergedStart,
    end_time: mergedEnd,
    course_id: first.course_id,
    teacher_id: first.teacher_id,
    room_id: first.room_id,
    section_id: first.section_id,
  }
}

// ─── Free Window Finder ──────────────────────────────────────────────────────

/**
 * Finds the first conflict-free time window for a slot on any enabled day.
 * Scans the scheduling window (08:00–20:00) in steps of SLOT_INTERVAL_MINUTES
 * for each enabled day, checking for teacher/room/section conflicts.
 *
 * @param {{ start_time: string, end_time: string, teacher_id: string, room_id: string, section_id: string }} slot
 * @param {string[]} enabledDays - array of day strings (e.g. ['monday', 'tuesday', ...])
 * @param {Array} existingSlots - existing slots to check against
 * @returns {{ day: string, startTime: string, endTime: string } | null}
 */
export function findFreeWindow(slot, enabledDays, existingSlots) {
  const duration = timeDiffMinutes(slot.start_time, slot.end_time)
  const windowStart = SCHEDULING_WINDOW_START
  const windowEnd = SCHEDULING_WINDOW_END

  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const windowStartMin = toMin(windowStart)
  const windowEndMin = toMin(windowEnd)

  for (const day of enabledDays) {
    let startMin = windowStartMin

    while (startMin + duration <= windowEndMin) {
      const startTime = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`
      const endTime = addMinutes(startTime, duration)

      const candidate = {
        ...slot,
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
      }

      const conflicts = detectConflicts(candidate, existingSlots)

      if (conflicts.length === 0) {
        return { day, startTime, endTime }
      }

      startMin += SLOT_INTERVAL_MINUTES
    }
  }

  return null
}
