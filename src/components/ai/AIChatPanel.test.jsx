import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AIChatPanel from './AIChatPanel'

// jsdom doesn't implement scrollIntoView — mock it globally
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock useAIScheduler
vi.mock('../../hooks/useAIScheduler', () => ({
  useAIScheduler: vi.fn(),
}))

import { useAIScheduler } from '../../hooks/useAIScheduler'

const defaultSchedulerReturn = {
  messages: [],
  proposals: null,
  sending: false,
  error: null,
  sendMessage: vi.fn(),
  approveProposals: vi.fn(),
  rejectProposals: vi.fn(),
  isConfigured: true,
}

describe('AIChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows disabled banner when isConfigured is false (missing env vars)', () => {
    useAIScheduler.mockReturnValue({ ...defaultSchedulerReturn, isConfigured: false })
    render(<AIChatPanel timetable={null} slots={[]} assignments={[]} />)
    expect(screen.getByText(/AI Assistant is disabled/i)).toBeInTheDocument()
    expect(screen.getByText(/VITE_LLM_API_KEY/)).toBeInTheDocument()
  })

  it('does not show disabled banner when isConfigured is true', () => {
    useAIScheduler.mockReturnValue({ ...defaultSchedulerReturn, isConfigured: true })
    render(<AIChatPanel timetable={null} slots={[]} assignments={[]} />)
    expect(screen.queryByText(/AI Assistant is disabled/i)).not.toBeInTheDocument()
  })

  it('shows connected indicator when isConfigured is true', () => {
    useAIScheduler.mockReturnValue({ ...defaultSchedulerReturn, isConfigured: true })
    render(<AIChatPanel timetable={null} slots={[]} assignments={[]} />)
    expect(screen.getByLabelText('AI connected')).toBeInTheDocument()
  })

  it('disables textarea and send button when not configured', () => {
    useAIScheduler.mockReturnValue({ ...defaultSchedulerReturn, isConfigured: false })
    render(<AIChatPanel timetable={null} slots={[]} assignments={[]} />)
    const textarea = screen.getByRole('textbox', { name: /AI chat input/i })
    expect(textarea).toBeDisabled()
  })

  it('renders the AI Scheduling Assistant header', () => {
    useAIScheduler.mockReturnValue({ ...defaultSchedulerReturn, isConfigured: true })
    render(<AIChatPanel timetable={null} slots={[]} assignments={[]} />)
    expect(screen.getByText('AI Scheduling Assistant')).toBeInTheDocument()
  })

  it('shows collapse button', () => {
    useAIScheduler.mockReturnValue({ ...defaultSchedulerReturn, isConfigured: true })
    render(<AIChatPanel timetable={null} slots={[]} assignments={[]} />)
    expect(screen.getByRole('button', { name: /Collapse AI chat panel/i })).toBeInTheDocument()
  })
})
