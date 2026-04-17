export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-surface-border px-4 sm:px-6 py-4 text-center text-sm text-ink-muted">
      <p>&copy; {currentYear} DAI-TSMS. All rights reserved.</p>
    </footer>
  )
}
