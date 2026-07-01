// Wraps occurrences of `query` (case-insensitive) in a highlighted <mark>.
// Uses amber accent colours, which the dark theme leaves untouched, so the
// match stays high-contrast in both light and dark mode.
export function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const lower = text.toLowerCase()
  const parts: Array<{ text: string; match: boolean }> = []
  let i = 0
  while (i < text.length) {
    const idx = lower.indexOf(query, i)
    if (idx === -1) {
      parts.push({ text: text.slice(i), match: false })
      break
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), match: false })
    parts.push({ text: text.slice(idx, idx + query.length), match: true })
    i = idx + query.length
  }
  return (
    <>
      {parts.map((p, n) =>
        p.match ? (
          <mark key={n} className="rounded bg-amber-300 px-0.5 text-amber-950">
            {p.text}
          </mark>
        ) : (
          <span key={n}>{p.text}</span>
        ),
      )}
    </>
  )
}
