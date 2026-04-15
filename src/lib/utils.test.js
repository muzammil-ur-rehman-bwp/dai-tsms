/**
 * Unit and Property-Based Tests for src/lib/utils.js
 *
 * **Validates: Requirements R5, R6, R9**
 * Task 5.12 — Property-based tests using fast-check
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  generateSectionName,
  validateStudentRegNo,
  sortSections,
  sortStudents,
  derivePerSlotDuration,
  isOnGrid,
  isInSchedulingWindow,
  detectConflicts,
  splitSlot,
  mergeSlots,
  gridIndexToTime,
  addMinutes,
  timeDiffMinutes,
} from './utils.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes from midnight */
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Build a grid-aligned time string from a 0-based 15-min index (0 = 08:00) */
const gridTime = (index) => {
  const totalMin = 8 * 60 + index * 15
  return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
}

// ─── Unit Tests ──────────────────────────────────────────────────────────────

describe('generateSectionName', () => {
  it('produces correct format', () => {
    expect(generateSectionName('BSARIN', '1ST', 'A', 'M')).toBe('BSARIN-1ST-AM')
    expect(generateSectionName('MSARIN', '3RD', 'B', 'E')).toBe('MSARIN-3RD-BE')
  })
})

describe('validateStudentRegNo', () => {
  it('accepts valid registration numbers', () => {
    expect(validateStudentRegNo('F26BARIN1M000001')).toBe(true)
    expect(validateStudentRegNo('S25RARIN3E000042')).toBe(true)
    expect(validateStudentRegNo('F24NARIN7W999999')).toBe(true)
  })

  it('rejects invalid registration numbers', () => {
    expect(validateStudentRegNo('')).toBe(false)
    expect(validateStudentRegNo('X26BARIN1M000001')).toBe(false) // bad prefix
    expect(validateStudentRegNo('F26BARIN0M000001')).toBe(false) // degree level 0
    expect(validateStudentRegNo('F26BARIN1Z000001')).toBe(false) // bad program
    expect(validateStudentRegNo('F26BARIN1M00001')).toBe(false)  // only 5 digits
    expect(validateStudentRegNo('F26BARIN1M0000001')).toBe(false) // 7 digits
  })
})

describe('derivePerSlotDuration', () => {
  it('returns half of contact hours for valid inputs', () => {
    expect(derivePerSlotDuration(60)).toBe(30)
    expect(derivePerSlotDuration(90)).toBe(45)
    expect(derivePerSlotDuration(120)).toBe(60)
    expect(derivePerSlotDuration(150)).toBe(75)
    expect(derivePerSlotDuration(180)).toBe(90)
  })

  it('throws for invalid inputs', () => {
    expect(() => derivePerSlotDuration(45)).toThrow()
    expect(() => derivePerSlotDuration(100)).toThrow()
    expect(() => derivePerSlotDuration(0)).toThrow()
  })
})

describe('isOnGrid', () => {
  it('returns true for grid-aligned times', () => {
    expect(isOnGrid('08:00')).toBe(true)
    expect(isOnGrid('08:15')).toBe(true)
    expect(isOnGrid('08:30')).toBe(true)
    expect(isOnGrid('08:45')).toBe(true)
    expect(isOnGrid('20:00')).toBe(true)
  })

  it('returns false for off-grid times', () => {
    expect(isOnGrid('08:01')).toBe(false)
    expect(isOnGrid('09:10')).toBe(false)
    expect(isOnGrid('12:37')).toBe(false)
  })
})

describe('isInSchedulingWindow', () => {
  it('accepts times within window', () => {
    expect(isInSchedulingWindow('08:00', '09:00')).toBe(true)
    expect(isInSchedulingWindow('08:00', '20:00')).toBe(true)
    expect(isInSchedulingWindow('19:00', '20:00')).toBe(true)
  })

  it('rejects times outside window', () => {
    expect(isInSchedulingWindow('07:45', '09:00')).toBe(false)
    expect(isInSchedulingWindow('08:00', '20:15')).toBe(false)
    expect(isInSchedulingWindow('07:00', '21:00')).toBe(false)
  })
})

describe('detectConflicts', () => {
  const base = {
    id: 'existing',
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '10:00',
    teacher_id: 'T1',
    room_id: 'R1',
    section_id: 'S1',
  }

  it('detects teacher conflict on overlap', () => {
    const newSlot = { day_of_week: 'monday', start_time: '09:30', end_time: '10:30', teacher_id: 'T1', room_id: 'R2', section_id: 'S2' }
    const conflicts = detectConflicts(newSlot, [base])
    expect(conflicts.some(c => c.type === 'teacher')).toBe(true)
  })

  it('detects room conflict on overlap', () => {
    const newSlot = { day_of_week: 'monday', start_time: '09:30', end_time: '10:30', teacher_id: 'T2', room_id: 'R1', section_id: 'S2' }
    const conflicts = detectConflicts(newSlot, [base])
    expect(conflicts.some(c => c.type === 'room')).toBe(true)
  })

  it('detects section conflict on overlap', () => {
    const newSlot = { day_of_week: 'monday', start_time: '09:30', end_time: '10:30', teacher_id: 'T2', room_id: 'R2', section_id: 'S1' }
    const conflicts = detectConflicts(newSlot, [base])
    expect(conflicts.some(c => c.type === 'section')).toBe(true)
  })

  it('returns no conflicts for adjacent slots', () => {
    const newSlot = { day_of_week: 'monday', start_time: '10:00', end_time: '11:00', teacher_id: 'T1', room_id: 'R1', section_id: 'S1' }
    expect(detectConflicts(newSlot, [base])).toHaveLength(0)
  })

  it('returns no conflicts on different days', () => {
    const newSlot = { day_of_week: 'tuesday', start_time: '09:30', end_time: '10:30', teacher_id: 'T1', room_id: 'R1', section_id: 'S1' }
    expect(detectConflicts(newSlot, [base])).toHaveLength(0)
  })
})

describe('splitSlot', () => {
  const slot = {
    timetable_id: 'TT1',
    assignment_id: 'A1',
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '10:00',
    course_id: 'C1',
    teacher_id: 'T1',
    room_id: 'R1',
    section_id: 'S1',
  }

  it('splits a 60-min slot into two 30-min slots', () => {
    const parts = splitSlot(slot, 30)
    expect(parts).toHaveLength(2)
    expect(parts[0].start_time).toBe('09:00')
    expect(parts[0].end_time).toBe('09:30')
    expect(parts[1].start_time).toBe('09:30')
    expect(parts[1].end_time).toBe('10:00')
  })

  it('throws when not evenly divisible', () => {
    expect(() => splitSlot(slot, 45)).toThrow()
  })
})

describe('mergeSlots', () => {
  const makeSlot = (start, end) => ({
    timetable_id: 'TT1',
    assignment_id: 'A1',
    day_of_week: 'monday',
    start_time: start,
    end_time: end,
    course_id: 'C1',
    teacher_id: 'T1',
    room_id: 'R1',
    section_id: 'S1',
  })

  it('merges two consecutive 30-min slots into 60-min', () => {
    const merged = mergeSlots([makeSlot('09:00', '09:30'), makeSlot('09:30', '10:00')], 60)
    expect(merged.start_time).toBe('09:00')
    expect(merged.end_time).toBe('10:00')
  })

  it('throws when slots are not consecutive', () => {
    expect(() => mergeSlots([makeSlot('09:00', '09:30'), makeSlot('10:00', '10:30')], 60)).toThrow()
  })

  it('throws when combined duration does not match target', () => {
    expect(() => mergeSlots([makeSlot('09:00', '09:30'), makeSlot('09:30', '10:00')], 90)).toThrow()
  })
})

// ─── Property-Based Tests ────────────────────────────────────────────────────

// Feature: academic-timetable-system, Property 5: Section Name Formula Correctness
describe('Property 5 — Section Name Formula Correctness', () => {
  // **Validates: Requirements R5**
  it('always produces {discShort}-{semName}-{secName}{progCode}', () => {
    fc.assert(
      fc.property(
        fc.record({
          discShort: fc.constantFrom('BSARIN', 'BSADARIN', 'MSARIN', 'PHARIN'),
          semName: fc.constantFrom('1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH'),
          secName: fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'),
          progCode: fc.constantFrom('M', 'E', 'W'),
        }),
        ({ discShort, semName, secName, progCode }) => {
          const name = generateSectionName(discShort, semName, secName, progCode)
          expect(name).toBe(`${discShort}-${semName}-${secName}${progCode}`)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 6: Section Sort Order Invariant
describe('Property 6 — Section Sort Order Invariant', () => {
  // **Validates: Requirements R5**
  const DISC_ORDER = { BSARIN: 1, BSADARIN: 2, MSARIN: 3, PHARIN: 4 }
  const PROG_ORDER = { M: 1, E: 2, W: 3 }

  const sectionArb = fc.record({
    discipline: fc.record({
      short_name: fc.constantFrom('BSARIN', 'BSADARIN', 'MSARIN', 'PHARIN'),
      sort_order: fc.integer({ min: 1, max: 4 }),
    }),
    semester_number: fc.record({ name: fc.constantFrom('1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH') }),
    program: fc.record({
      short_code: fc.constantFrom('M', 'E', 'W'),
      sort_order: fc.integer({ min: 1, max: 3 }),
    }),
    section_number: fc.record({ name: fc.constantFrom('A', 'B', 'C', 'D', 'E') }),
  }).map(s => ({
    ...s,
    discipline: { ...s.discipline, sort_order: DISC_ORDER[s.discipline.short_name] },
    program: { ...s.program, sort_order: PROG_ORDER[s.program.short_code] },
  }))

  it('sorted list never has adjacent pair violating order', () => {
    fc.assert(
      fc.property(fc.array(sectionArb, { minLength: 2, maxLength: 20 }), (sections) => {
        const sorted = sortSections(sections)
        for (let i = 1; i < sorted.length; i++) {
          const a = sorted[i - 1], b = sorted[i]
          const discDiff = a.discipline.sort_order - b.discipline.sort_order
          if (discDiff !== 0) { expect(discDiff).toBeLessThan(0); continue }
          const semCmp = a.semester_number.name.localeCompare(b.semester_number.name)
          if (semCmp !== 0) { expect(semCmp).toBeLessThanOrEqual(0); continue }
          const progDiff = a.program.sort_order - b.program.sort_order
          if (progDiff !== 0) { expect(progDiff).toBeLessThan(0); continue }
          expect(a.section_number.name.localeCompare(b.section_number.name)).toBeLessThanOrEqual(0)
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 7: Student Registration Number Validation
describe('Property 7 — Student Registration Number Validation', () => {
  // **Validates: Requirements R6**
  const validRegNoArb = fc.tuple(
    fc.constantFrom('S', 'F'),
    fc.integer({ min: 21, max: 30 }).map(n => n.toString()),
    fc.constantFrom('B', 'R', 'N'),
    fc.constantFrom('1', '2', '3', '4', '7'),
    fc.constantFrom('M', 'E', 'W'),
    fc.integer({ min: 1, max: 999999 }).map(n => n.toString().padStart(6, '0'))
  ).map(([sem, yr, campus, deg, prog, seq]) => `${sem}${yr}${campus}ARIN${deg}${prog}${seq}`)

  it('accepts all strings matching the valid pattern', () => {
    fc.assert(
      fc.property(validRegNoArb, (regNo) => {
        expect(validateStudentRegNo(regNo)).toBe(true)
      }),
      { numRuns: 200 }
    )
  })

  it('rejects strings with invalid prefix character', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'),
        fc.integer({ min: 21, max: 30 }).map(n => n.toString()),
        fc.constantFrom('B', 'R', 'N'),
        fc.constantFrom('1', '2', '3'),
        fc.constantFrom('M', 'E', 'W'),
        fc.integer({ min: 1, max: 999999 }).map(n => n.toString().padStart(6, '0')),
        (badPrefix, yr, campus, deg, prog, seq) => {
          const regNo = `${badPrefix}${yr}${campus}ARIN${deg}${prog}${seq}`
          expect(validateStudentRegNo(regNo)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 8: Student Sort Order Invariant
describe('Property 8 — Student Sort Order Invariant', () => {
  // **Validates: Requirements R6**
  const SEM_ORDER = { S: 1, F: 2 }
  const CAMPUS_ORDER = { B: 1, R: 2, N: 3 }
  const PROG_ORDER = { M: 1, E: 2, W: 3 }

  const studentArb = fc.tuple(
    fc.constantFrom('S', 'F'),
    fc.integer({ min: 21, max: 30 }).map(n => n.toString()),
    fc.constantFrom('B', 'R', 'N'),
    fc.constantFrom('1', '2', '3'),
    fc.constantFrom('M', 'E', 'W'),
    fc.integer({ min: 1, max: 999999 }).map(n => n.toString().padStart(6, '0'))
  ).map(([sem, yr, campus, deg, prog, seq]) => ({
    registration_no: `${sem}${yr}${campus}ARIN${deg}${prog}${seq}`,
  }))

  it('sorted list never has adjacent pair violating order', () => {
    fc.assert(
      fc.property(fc.array(studentArb, { minLength: 2, maxLength: 20 }), (students) => {
        const sorted = sortStudents(students)
        for (let i = 1; i < sorted.length; i++) {
          const ra = sorted[i - 1].registration_no
          const rb = sorted[i].registration_no
          const semDiff = (SEM_ORDER[ra[0]] ?? 99) - (SEM_ORDER[rb[0]] ?? 99)
          if (semDiff !== 0) { expect(semDiff).toBeLessThan(0); continue }
          const yearCmp = ra.slice(1, 3).localeCompare(rb.slice(1, 3))
          if (yearCmp !== 0) { expect(yearCmp).toBeLessThanOrEqual(0); continue }
          const campDiff = (CAMPUS_ORDER[ra[3]] ?? 99) - (CAMPUS_ORDER[rb[3]] ?? 99)
          if (campDiff !== 0) { expect(campDiff).toBeLessThan(0); continue }
          const arinA = ra.indexOf('ARIN'), arinB = rb.indexOf('ARIN')
          const degCmp = ra[arinA + 4].localeCompare(rb[arinB + 4])
          if (degCmp !== 0) { expect(degCmp).toBeLessThanOrEqual(0); continue }
          const progDiff = (PROG_ORDER[ra[arinA + 5]] ?? 99) - (PROG_ORDER[rb[arinB + 5]] ?? 99)
          if (progDiff !== 0) { expect(progDiff).toBeLessThan(0); continue }
          expect(ra.slice(-6).localeCompare(rb.slice(-6))).toBeLessThanOrEqual(0)
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 9: Course Per-Slot Duration Validity
describe('Property 9 — Course Per-Slot Duration Validity', () => {
  // **Validates: Requirements R9**
  const VALID_CONTACT_HOURS = [60, 90, 120, 150, 180]
  const VALID_DURATIONS = [30, 45, 60, 75, 90]

  it('valid contact_hours_minutes always produce a supported duration', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_CONTACT_HOURS), (contactHours) => {
        const duration = derivePerSlotDuration(contactHours)
        expect(VALID_DURATIONS).toContain(duration)
        expect(duration).toBe(contactHours / 2)
      }),
      { numRuns: 50 }
    )
  })

  it('invalid contact_hours_minutes always throw', () => {
    // Values whose halves are NOT in {30,45,60,75,90}
    const invalidValues = [15, 30, 45, 75, 100, 200, 300]
    fc.assert(
      fc.property(fc.constantFrom(...invalidValues), (contactHours) => {
        expect(() => derivePerSlotDuration(contactHours)).toThrow()
      }),
      { numRuns: 50 }
    )
  })
})

// Feature: academic-timetable-system, Property 10: Slot Time Grid Alignment
describe('Property 10 — Slot Time Grid Alignment', () => {
  // **Validates: Requirements R9**
  it('all 15-min grid indices produce isOnGrid=true times', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 47 }).map(i => gridTime(i)),
        (time) => {
          expect(isOnGrid(time)).toBe(true)
        }
      ),
      { numRuns: 48 }
    )
  })

  it('off-grid times (non-15-min boundaries) return isOnGrid=false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 14 }).map(offset => {
          const base = gridTime(fc.sample(fc.integer({ min: 0, max: 46 }), 1)[0])
          const baseMin = toMin(base)
          const offMin = baseMin + offset
          return `${String(Math.floor(offMin / 60)).padStart(2, '0')}:${String(offMin % 60).padStart(2, '0')}`
        }),
        (time) => {
          expect(isOnGrid(time)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 11: Slot Scheduling Window Constraint
describe('Property 11 — Slot Scheduling Window Constraint', () => {
  // **Validates: Requirements R9**
  it('slots within 08:00–20:00 pass window check', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 43 }).map(i => gridTime(i)),
        fc.constantFrom(30, 45, 60, 75, 90),
        (startTime, duration) => {
          const endMin = toMin(startTime) + duration
          if (endMin > 20 * 60) return // skip if end exceeds window
          const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
          expect(isInSchedulingWindow(startTime, endTime)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('slots starting before 08:00 fail window check', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 7 * 60 - 1 }).map(m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`),
        (earlyStart) => {
          expect(isInSchedulingWindow(earlyStart, '09:00')).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 12: Slot Duration Validity
describe('Property 12 — Slot Duration Validity', () => {
  // **Validates: Requirements R9**
  const VALID_DURATIONS = [30, 45, 60, 75, 90]

  it('derivePerSlotDuration only succeeds for durations in {30,45,60,75,90}', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_DURATIONS), (duration) => {
        // contact_hours = duration * 2
        const contactHours = duration * 2
        expect(derivePerSlotDuration(contactHours)).toBe(duration)
      }),
      { numRuns: 50 }
    )
  })
})

// Feature: academic-timetable-system, Property 13: Bifurcation Duration Preservation
describe('Property 13 — Bifurcation Duration Preservation', () => {
  // **Validates: Requirements R9**
  it('split slots combined duration equals original slot duration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 40 }).map(i => gridTime(i)),
        fc.constantFrom(60, 90),  // durations evenly divisible by 30
        (startTime, totalDuration) => {
          const endMin = toMin(startTime) + totalDuration
          if (endMin > 20 * 60) return
          const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
          const slot = {
            timetable_id: 'TT1', assignment_id: 'A1', day_of_week: 'monday',
            start_time: startTime, end_time: endTime,
            course_id: 'C1', teacher_id: 'T1', room_id: 'R1', section_id: 'S1',
          }
          const parts = splitSlot(slot, totalDuration / 2)
          const combinedDuration = parts.reduce((sum, p) => sum + timeDiffMinutes(p.start_time, p.end_time), 0)
          expect(combinedDuration).toBe(totalDuration)
          parts.forEach(p => expect(timeDiffMinutes(p.start_time, p.end_time)).toBe(totalDuration / 2))
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 15: Teacher Conflict Detection
describe('Property 15 — Teacher Conflict Detection', () => {
  // **Validates: Requirements R12**
  it('two overlapping slots with same teacher always produce a teacher conflict', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday'),
        fc.integer({ min: 0, max: 40 }).map(i => gridTime(i)),
        fc.constantFrom(30, 45, 60, 75, 90),
        (day, start1, duration) => {
          const end1Min = toMin(start1) + duration
          if (end1Min > 20 * 60) return
          const end1 = `${String(Math.floor(end1Min / 60)).padStart(2, '0')}:${String(end1Min % 60).padStart(2, '0')}`
          const existing = { id: 'E1', day_of_week: day, start_time: start1, end_time: end1, teacher_id: 'T1', room_id: 'R1', section_id: 'S1' }
          const newSlot = { day_of_week: day, start_time: start1, end_time: end1, teacher_id: 'T1', room_id: 'R2', section_id: 'S2' }
          const conflicts = detectConflicts(newSlot, [existing])
          expect(conflicts.some(c => c.type === 'teacher')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('non-overlapping slots with same teacher produce no teacher conflict', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday'),
        fc.integer({ min: 0, max: 35 }).map(i => gridTime(i)),
        fc.constantFrom(30, 45, 60),
        (day, start1, duration) => {
          const end1Min = toMin(start1) + duration
          if (end1Min + duration > 20 * 60) return
          const end1 = `${String(Math.floor(end1Min / 60)).padStart(2, '0')}:${String(end1Min % 60).padStart(2, '0')}`
          const start2 = end1
          const end2Min = end1Min + duration
          const end2 = `${String(Math.floor(end2Min / 60)).padStart(2, '0')}:${String(end2Min % 60).padStart(2, '0')}`
          const existing = { id: 'E1', day_of_week: day, start_time: start1, end_time: end1, teacher_id: 'T1', room_id: 'R1', section_id: 'S1' }
          const newSlot = { day_of_week: day, start_time: start2, end_time: end2, teacher_id: 'T1', room_id: 'R1', section_id: 'S1' }
          const conflicts = detectConflicts(newSlot, [existing])
          expect(conflicts.some(c => c.type === 'teacher')).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 16: Room Conflict Detection
describe('Property 16 — Room Conflict Detection', () => {
  // **Validates: Requirements R12**
  it('two overlapping slots with same room always produce a room conflict', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday'),
        fc.integer({ min: 0, max: 40 }).map(i => gridTime(i)),
        fc.constantFrom(30, 45, 60, 75, 90),
        (day, start1, duration) => {
          const end1Min = toMin(start1) + duration
          if (end1Min > 20 * 60) return
          const end1 = `${String(Math.floor(end1Min / 60)).padStart(2, '0')}:${String(end1Min % 60).padStart(2, '0')}`
          const existing = { id: 'E1', day_of_week: day, start_time: start1, end_time: end1, teacher_id: 'T1', room_id: 'R1', section_id: 'S1' }
          const newSlot = { day_of_week: day, start_time: start1, end_time: end1, teacher_id: 'T2', room_id: 'R1', section_id: 'S2' }
          const conflicts = detectConflicts(newSlot, [existing])
          expect(conflicts.some(c => c.type === 'room')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 17: Section Conflict Detection
describe('Property 17 — Section Conflict Detection', () => {
  // **Validates: Requirements R12**
  it('two overlapping slots with same section always produce a section conflict', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('monday', 'tuesday', 'wednesday', 'thursday'),
        fc.integer({ min: 0, max: 40 }).map(i => gridTime(i)),
        fc.constantFrom(30, 45, 60, 75, 90),
        (day, start1, duration) => {
          const end1Min = toMin(start1) + duration
          if (end1Min > 20 * 60) return
          const end1 = `${String(Math.floor(end1Min / 60)).padStart(2, '0')}:${String(end1Min % 60).padStart(2, '0')}`
          const existing = { id: 'E1', day_of_week: day, start_time: start1, end_time: end1, teacher_id: 'T1', room_id: 'R1', section_id: 'S1' }
          const newSlot = { day_of_week: day, start_time: start1, end_time: end1, teacher_id: 'T2', room_id: 'R2', section_id: 'S1' }
          const conflicts = detectConflicts(newSlot, [existing])
          expect(conflicts.some(c => c.type === 'section')).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 20: Timetable Conversion Split Duration Preservation
describe('Property 20 — Timetable Conversion Split Duration Preservation', () => {
  // **Validates: Requirements R14**
  it('split slots count = ceil(D/T) and each has duration T', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 36 }).map(i => gridTime(i)),
        fc.constantFrom(60, 90),   // source durations evenly divisible by 30
        (startTime, sourceDuration) => {
          const endMin = toMin(startTime) + sourceDuration
          if (endMin > 20 * 60) return
          const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`
          const slot = {
            timetable_id: 'TT1', assignment_id: 'A1', day_of_week: 'monday',
            start_time: startTime, end_time: endTime,
            course_id: 'C1', teacher_id: 'T1', room_id: 'R1', section_id: 'S1',
          }
          const targetDuration = 30
          const parts = splitSlot(slot, targetDuration)
          expect(parts).toHaveLength(Math.ceil(sourceDuration / targetDuration))
          parts.forEach(p => expect(timeDiffMinutes(p.start_time, p.end_time)).toBe(targetDuration))
          const combined = parts.reduce((sum, p) => sum + timeDiffMinutes(p.start_time, p.end_time), 0)
          expect(combined).toBe(sourceDuration)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: academic-timetable-system, Property 21: Timetable Conversion Merge Duration Preservation
describe('Property 21 — Timetable Conversion Merge Duration Preservation', () => {
  // **Validates: Requirements R14**
  it('merged slot duration equals sum of source slot durations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 36 }).map(i => gridTime(i)),
        fc.constantFrom(2, 3),  // number of 30-min slots to merge
        (startTime, count) => {
          const slotDuration = 30
          const totalDuration = slotDuration * count
          const endMin = toMin(startTime) + totalDuration
          if (endMin > 20 * 60) return
          const slots = []
          let cur = toMin(startTime)
          for (let i = 0; i < count; i++) {
            const s = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`
            const e = `${String(Math.floor((cur + slotDuration) / 60)).padStart(2, '0')}:${String((cur + slotDuration) % 60).padStart(2, '0')}`
            slots.push({ timetable_id: 'TT1', assignment_id: 'A1', day_of_week: 'monday', start_time: s, end_time: e, course_id: 'C1', teacher_id: 'T1', room_id: 'R1', section_id: 'S1' })
            cur += slotDuration
          }
          const merged = mergeSlots(slots, totalDuration)
          expect(timeDiffMinutes(merged.start_time, merged.end_time)).toBe(totalDuration)
        }
      ),
      { numRuns: 100 }
    )
  })
})
