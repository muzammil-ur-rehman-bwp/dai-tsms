import { describe, it, expect } from 'vitest'
import { parseStudentsCSV, parseCoursesCSV, parseRoomsCSV, parseSchedulingCSV } from './csvParsers.js'

// ─── parseStudentsCSV ────────────────────────────────────────────────────────

describe('parseStudentsCSV', () => {
  it('accepts valid rows', () => {
    const rows = [
      { registration_no: 'F26BARIN1M000001', section_name: 'BSARIN-1ST-1M' },
      { registration_no: 'S25RARIN3E000042', section_name: 'BSARIN-3RD-1E' },
    ]
    const { valid, errors } = parseStudentsCSV(rows)
    expect(valid).toHaveLength(2)
    expect(errors).toHaveLength(0)
    expect(valid[0].registration_no).toBe('F26BARIN1M000001')
    expect(valid[0].section_name).toBe('BSARIN-1ST-1M')
  })

  it('reports error for missing registration_no', () => {
    const rows = [{ registration_no: '', section_name: 'BSARIN-1ST-1M' }]
    const { valid, errors } = parseStudentsCSV(rows)
    expect(valid).toHaveLength(0)
    expect(errors[0].message).toMatch(/Missing registration_no/i)
    expect(errors[0].row).toBe(2)
  })

  it('reports error for missing section_name', () => {
    const rows = [{ registration_no: 'F26BARIN1M000001', section_name: '' }]
    const { valid, errors } = parseStudentsCSV(rows)
    expect(valid).toHaveLength(0)
    expect(errors[0].message).toMatch(/Missing section_name/i)
  })

  it('reports error for invalid registration_no pattern', () => {
    const rows = [{ registration_no: 'INVALID123', section_name: 'BSARIN-1ST-1M' }]
    const { valid, errors } = parseStudentsCSV(rows)
    expect(valid).toHaveLength(0)
    expect(errors[0].message).toMatch(/Invalid registration number/i)
  })

  it('handles multiple rows with mixed valid/invalid', () => {
    const rows = [
      { registration_no: 'F26BARIN1M000001', section_name: 'BSARIN-1ST-1M' },
      { registration_no: 'BAD', section_name: 'BSARIN-1ST-1M' },
    ]
    const { valid, errors } = parseStudentsCSV(rows)
    expect(valid).toHaveLength(1)
    expect(errors).toHaveLength(1)
  })
})

// ─── parseCoursesCSV ─────────────────────────────────────────────────────────

describe('parseCoursesCSV', () => {
  it('accepts valid rows', () => {
    const rows = [
      { course_code: 'AI101', name: 'Intro to AI', credit_hours: '3', contact_hours_minutes: '120' },
    ]
    const { valid, errors } = parseCoursesCSV(rows)
    expect(valid).toHaveLength(1)
    expect(errors).toHaveLength(0)
    expect(valid[0].code).toBe('AI101')
    expect(valid[0].contact_hours_minutes).toBe(120)
  })

  it('reports error for missing course_code', () => {
    const rows = [{ course_code: '', name: 'Intro to AI', credit_hours: '3', contact_hours_minutes: '120' }]
    const { valid, errors } = parseCoursesCSV(rows)
    expect(errors[0].message).toMatch(/Missing course_code/i)
  })

  it('reports error for invalid contact_hours_minutes (not multiple of 15)', () => {
    const rows = [{ course_code: 'AI101', name: 'Intro to AI', credit_hours: '3', contact_hours_minutes: '100' }]
    const { valid, errors } = parseCoursesCSV(rows)
    expect(errors[0].message).toMatch(/multiple of 15/i)
  })

  it('reports error when derived per-slot duration is not in {30,45,60,75,90}', () => {
    // contact_hours_minutes=45 → per-slot=22.5 (invalid)
    const rows = [{ course_code: 'AI101', name: 'Intro to AI', credit_hours: '3', contact_hours_minutes: '45' }]
    const { valid, errors } = parseCoursesCSV(rows)
    expect(errors[0].message).toMatch(/per-slot duration/i)
  })

  it('reports error for non-positive credit_hours', () => {
    const rows = [{ course_code: 'AI101', name: 'Intro to AI', credit_hours: '0', contact_hours_minutes: '120' }]
    const { valid, errors } = parseCoursesCSV(rows)
    expect(errors[0].message).toMatch(/credit_hours/i)
  })
})

// ─── parseRoomsCSV ───────────────────────────────────────────────────────────

describe('parseRoomsCSV', () => {
  it('accepts valid rows', () => {
    const rows = [
      { name: 'Room 101', capacity: '30' },
      { name: 'Lab A', capacity: '20' },
    ]
    const { valid, errors } = parseRoomsCSV(rows)
    expect(valid).toHaveLength(2)
    expect(errors).toHaveLength(0)
    expect(valid[0].name).toBe('Room 101')
    expect(valid[0].capacity).toBe(30)
  })

  it('reports error for missing name', () => {
    const rows = [{ name: '', capacity: '30' }]
    const { valid, errors } = parseRoomsCSV(rows)
    expect(errors[0].message).toMatch(/Missing name/i)
  })

  it('reports error for invalid capacity (zero)', () => {
    const rows = [{ name: 'Room 101', capacity: '0' }]
    const { valid, errors } = parseRoomsCSV(rows)
    expect(errors[0].message).toMatch(/positive integer/i)
  })

  it('reports error for non-integer capacity', () => {
    const rows = [{ name: 'Room 101', capacity: '25.5' }]
    const { valid, errors } = parseRoomsCSV(rows)
    expect(errors[0].message).toMatch(/positive integer/i)
  })

  it('reports error for negative capacity', () => {
    const rows = [{ name: 'Room 101', capacity: '-5' }]
    const { valid, errors } = parseRoomsCSV(rows)
    expect(errors[0].message).toMatch(/positive integer/i)
  })
})

// ─── parseSchedulingCSV ──────────────────────────────────────────────────────

describe('parseSchedulingCSV', () => {
  it('accepts valid rows', () => {
    const rows = [
      { course_code: 'AI101', section_code: 'BSARIN-1ST-1M', teacher_code: 'T001' },
    ]
    const { valid, errors } = parseSchedulingCSV(rows)
    expect(valid).toHaveLength(1)
    expect(errors).toHaveLength(0)
    expect(valid[0].course_code).toBe('AI101')
    expect(valid[0].section_code).toBe('BSARIN-1ST-1M')
    expect(valid[0].teacher_code).toBe('T001')
  })

  it('reports error for missing course_code', () => {
    const rows = [{ course_code: '', section_code: 'BSARIN-1ST-1M', teacher_code: 'T001' }]
    const { valid, errors } = parseSchedulingCSV(rows)
    expect(errors[0].message).toMatch(/Missing course_code/i)
  })

  it('reports error for missing section_code', () => {
    const rows = [{ course_code: 'AI101', section_code: '', teacher_code: 'T001' }]
    const { valid, errors } = parseSchedulingCSV(rows)
    expect(errors[0].message).toMatch(/Missing section_code/i)
  })

  it('reports error for missing teacher_code', () => {
    const rows = [{ course_code: 'AI101', section_code: 'BSARIN-1ST-1M', teacher_code: '' }]
    const { valid, errors } = parseSchedulingCSV(rows)
    expect(errors[0].message).toMatch(/Missing teacher_code/i)
  })

  it('handles multiple rows with mixed valid/invalid', () => {
    const rows = [
      { course_code: 'AI101', section_code: 'BSARIN-1ST-1M', teacher_code: 'T001' },
      { course_code: '', section_code: 'BSARIN-1ST-1M', teacher_code: 'T001' },
      { course_code: 'AI102', section_code: 'BSARIN-2ND-1M', teacher_code: 'T002' },
    ]
    const { valid, errors } = parseSchedulingCSV(rows)
    expect(valid).toHaveLength(2)
    expect(errors).toHaveLength(1)
  })
})
