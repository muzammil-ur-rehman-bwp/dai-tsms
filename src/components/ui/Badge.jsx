const variantClasses = {
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-700',
  admin: 'bg-blue-100 text-blue-800',
  teacher: 'bg-purple-100 text-purple-800',
  student: 'bg-green-100 text-green-800',
  system: 'bg-gray-100 text-gray-600',
}

export default function Badge({ variant = 'active', children }) {
  const cls = variantClasses[variant] ?? variantClasses.active
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  )
}
