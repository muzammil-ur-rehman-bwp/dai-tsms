import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import LoadingSkeleton from '../../components/ui/LoadingSkeleton'

const STATS = [
  { label: 'Sections', table: 'sections', filter: { is_active: true } },
  { label: 'Teachers', table: 'teachers', filter: { is_active: true } },
  { label: 'Students', table: 'students', filter: { is_active: true } },
  { label: 'Rooms', table: 'rooms', filter: { is_active: true } },
]

function StatCard({ label, value, loading }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-16 rounded bg-gray-200 animate-pulse" />
      ) : (
        <p className="mt-1 text-3xl font-bold text-primary">{value ?? '—'}</p>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({})
  const [activeTimetable, setActiveTimetable] = useState(null)
  const [pendingSwaps, setPendingSwaps] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const results = await Promise.all(
        STATS.map(({ table, filter }) =>
          supabase.from(table).select('id', { count: 'exact', head: true }).match(filter)
        )
      )
      const s = {}
      STATS.forEach(({ label }, i) => { s[label] = results[i].count ?? 0 })
      setStats(s)

      // Active timetable
      try {
        const { data: tt } = await supabase
          .from('timetables')
          .select('id, name, status, academic_period_id')
          .limit(1)
        setActiveTimetable(tt && tt.length > 0 ? tt[0] : null)
      } catch (err) {
        console.error('[AdminDashboard] Error fetching timetable:', err)
        setActiveTimetable(null)
      }

      // Pending swap requests
      const { count: swapCount } = await supabase
        .from('swap_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPendingSwaps(swapCount ?? 0)

      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map(({ label }) => (
          <StatCard key={label} label={label} value={stats[label]} loading={loading} />
        ))}
      </div>

      {/* Active timetable + swap requests */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Timetable</p>
          {loading ? (
            <div className="mt-2 h-6 w-48 rounded bg-gray-200 animate-pulse" />
          ) : activeTimetable ? (
            <div className="mt-1">
              <p className="text-sm font-semibold text-gray-900">{activeTimetable.name}</p>
              <p className="text-xs text-gray-500 capitalize">{activeTimetable.status}</p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-400">No active timetable</p>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Swap Requests</p>
          {loading ? (
            <div className="mt-2 h-8 w-12 rounded bg-gray-200 animate-pulse" />
          ) : (
            <div className="mt-1 flex items-end justify-between">
              <p className="text-3xl font-bold text-warning">{pendingSwaps}</p>
              <Link
                to="/admin/swaps"
                aria-label="View all swap requests"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
