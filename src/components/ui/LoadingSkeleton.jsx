export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-md bg-gray-200 animate-pulse" />
      ))}
    </div>
  )
}
