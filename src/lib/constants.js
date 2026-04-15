// Scheduling window
export const SCHEDULING_WINDOW_START = '08:00'
export const SCHEDULING_WINDOW_END = '20:00'

// Grid granularity
export const SLOT_INTERVAL_MINUTES = 15

// Supported slot durations (minutes)
export const SUPPORTED_DURATIONS = [30, 45, 60, 75, 90]

// Days of the week
export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

// Standard days (always enabled)
export const STANDARD_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday']

// Extended days (optionally enabled per timetable)
export const EXTENDED_DAYS = ['friday', 'saturday', 'sunday']

// Custom sort orders
export const DISCIPLINE_SORT_ORDER = {
  BSARIN: 1,
  BSADARIN: 2,
  MSARIN: 3,
  PHARIN: 4,
}

export const PROGRAM_SORT_ORDER = {
  M: 1,
  E: 2,
  W: 3,
}

export const CAMPUS_SORT_ORDER = {
  B: 1,
  R: 2,
  N: 3,
}

export const SEMESTER_CODE_SORT_ORDER = {
  S: 1,
  F: 2,
}
