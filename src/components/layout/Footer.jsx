export function Footer({ light = false }) {
  const year = new Date().getFullYear()
  const base = light
    ? 'border-white/10'
    : 'border-surface-border'
  const strongText = light ? 'text-white' : 'text-ink'
  const mutedText = light ? 'text-white/60' : 'text-ink-muted'

  return (
    <footer className={`w-full border-t px-4 py-2.5 text-center text-[11px] leading-relaxed ${base}`}>
      <span className={`${strongText} font-semibold`}>
        Powered by Prof. Dr. Najia Saher (Chairperson) &nbsp;·&nbsp; Developed by Mr. Muzammil Ur Rehman (Lecturer)
      </span>
      <br />
      <span className={mutedText}>
        &copy; {year} Department of Artificial Intelligence, Faculty of Computing, The Islamia University of Bahawalpur.
      </span>
    </footer>
  )
}
