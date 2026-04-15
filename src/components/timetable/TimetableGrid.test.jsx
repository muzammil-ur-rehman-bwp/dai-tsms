import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TimetableGrid from './TimetableGrid'

describe('TimetableGrid', () => {
  it('renders time axis from 08:00 to 19:45 (every hour label visible)', () => {
    render(<TimetableGrid />)
    // Hour labels are shown every 4 rows (every 60 min)
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()
    expect(screen.getByText('16:00')).toBeInTheDocument()
    expect(screen.getByText('19:00')).toBeInTheDocument()
  })

  it('shows only enabled days as column headers', () => {
    render(<TimetableGrid enabledDays={['monday', 'wednesday']} />)
    expect(screen.getByText('monday')).toBeInTheDocument()
    expect(screen.getByText('wednesday')).toBeInTheDocument()
    expect(screen.queryByText('tuesday')).not.toBeInTheDocument()
    expect(screen.queryByText('thursday')).not.toBeInTheDocument()
  })

  it('renders all four standard days by default', () => {
    render(<TimetableGrid />)
    expect(screen.getByText('monday')).toBeInTheDocument()
    expect(screen.getByText('tuesday')).toBeInTheDocument()
    expect(screen.getByText('wednesday')).toBeInTheDocument()
    expect(screen.getByText('thursday')).toBeInTheDocument()
  })

  it('renders slot cells for occupied slots', () => {
    const slots = [
      {
        id: 'slot-1',
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '10:00',
        course_id: 'c1',
        teacher_id: 't1',
        room_id: 'r1',
        section_id: 's1',
      },
    ]
    const courses = { c1: { name: 'Intro to AI', code: 'AI101' } }
    const teachers = { t1: { name: 'Dr. Smith' } }
    const rooms = { r1: { name: 'Room 101' } }

    render(
      <TimetableGrid
        slots={slots}
        courses={courses}
        teachers={teachers}
        rooms={rooms}
        enabledDays={['monday', 'tuesday', 'wednesday', 'thursday']}
      />
    )

    expect(screen.getByText('Intro to AI')).toBeInTheDocument()
  })

  it('renders empty clickable cells with aria-labels', () => {
    render(<TimetableGrid enabledDays={['monday']} />)
    const emptyCell = screen.getByRole('button', { name: /Empty cell: monday at 08:00/i })
    expect(emptyCell).toBeInTheDocument()
  })
})
