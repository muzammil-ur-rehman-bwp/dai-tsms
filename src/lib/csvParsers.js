import { validateStudentRegNo, derivePerSlotDuration } from './utils'

/**
 * Parses student CSV rows.
 * Expected columns: registration_no, section_name
 * @param {Array<Object>} rows - parsed CSV rows (PapaParse header mode)
 * @returns {{ valid: Array, errors: Array<{row: number, message: string}> }}
 */
export function parseStudentsCSV(rows) {
  const valid = []
  const errors = []

  rows.forEach((row, i) => {
    const rowNum = i + 2 // 1-indexed + header row
    const regNo = (row.registration_no ?? '').trim()
    const sectionName = (row.section_name ?? '').trim()

    if (!regNo) {
      errors.push({ row: rowNum, message: 'Missing registration_no.' })
      return
    }
    if (!sectionName) {
      errors.push({ row: rowNum, message: 'Missing section_name.' })
      return
    }
    if (!validateStudentRegNo(regNo)) {
      errors.push({ row: rowNum, message: `Invalid registration number format: "${regNo}". Expected pattern: {S|F}{YY}{B|R|N}ARIN{degree}{M|E|W}{6-digits}` })
      return
    }

    valid.push({ registration_no: regNo, section_name: sectionName })
  })

  return { valid, errors }
}

/**
 * Parses courses CSV rows.
 * Expected columns: course_code, name, credit_hours, contact_hours_minutes
 * @param {Array<Object>} rows
 * @returns {{ valid: Array, errors: Array<{row: number, message: string}> }}
 */
export function parseCoursesCSV(rows) {
  const valid = []
  const errors = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const code = (row.course_code ?? '').trim()
    const name = (row.name ?? '').trim()
    const creditHours = Number(row.credit_hours)
    const contactHoursMinutes = Number(row.contact_hours_minutes)

    if (!code) { errors.push({ row: rowNum, message: 'Missing course_code.' }); return }
    if (!name) { errors.push({ row: rowNum, message: 'Missing name.' }); return }
    if (!row.credit_hours || isNaN(creditHours) || creditHours <= 0) {
      errors.push({ row: rowNum, message: 'credit_hours must be a positive number.' }); return
    }
    if (!row.contact_hours_minutes || isNaN(contactHoursMinutes) || contactHoursMinutes <= 0) {
      errors.push({ row: rowNum, message: 'contact_hours_minutes must be a positive number.' }); return
    }
    if (contactHoursMinutes % 15 !== 0) {
      errors.push({ row: rowNum, message: `contact_hours_minutes (${contactHoursMinutes}) must be a multiple of 15.` }); return
    }
    try {
      derivePerSlotDuration(contactHoursMinutes)
    } catch {
      errors.push({ row: rowNum, message: `Derived per-slot duration (${contactHoursMinutes / 2} min) is not in {30, 45, 60, 75, 90}.` }); return
    }

    valid.push({ code, name, credit_hours: creditHours, contact_hours_minutes: contactHoursMinutes })
  })

  return { valid, errors }
}

/**
 * Parses rooms CSV rows.
 * Expected columns: name, capacity
 * @param {Array<Object>} rows
 * @returns {{ valid: Array, errors: Array<{row: number, message: string}> }}
 */
export function parseRoomsCSV(rows) {
  const valid = []
  const errors = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const name = (row.name ?? '').trim()
    const capacity = Number(row.capacity)

    if (!name) { errors.push({ row: rowNum, message: 'Missing name.' }); return }
    if (!row.capacity || isNaN(capacity) || capacity <= 0 || !Number.isInteger(capacity)) {
      errors.push({ row: rowNum, message: 'capacity must be a positive integer.' }); return
    }

    valid.push({ name, capacity })
  })

  return { valid, errors }
}

/**
 * Parses scheduling CSV rows.
 * Expected columns: course_code, section_code, teacher_code
 * @param {Array<Object>} rows
 * @returns {{ valid: Array, errors: Array<{row: number, message: string}> }}
 */
export function parseSchedulingCSV(rows) {
  const valid = []
  const errors = []

  rows.forEach((row, i) => {
    const rowNum = i + 2
    const courseCode = (row.course_code ?? '').trim()
    const sectionCode = (row.section_code ?? '').trim()
    const teacherCode = (row.teacher_code ?? '').trim()

    if (!courseCode) { errors.push({ row: rowNum, message: 'Missing course_code.' }); return }
    if (!sectionCode) { errors.push({ row: rowNum, message: 'Missing section_code.' }); return }
    if (!teacherCode) { errors.push({ row: rowNum, message: 'Missing teacher_code.' }); return }

    valid.push({ course_code: courseCode, section_code: sectionCode, teacher_code: teacherCode })
  })

  return { valid, errors }
}
