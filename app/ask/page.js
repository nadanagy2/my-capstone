export default function AskPage() {
  return (
    <div className="min-h-full bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-[var(--color-neutral-900)]">Ask Your Data</h1>
        <div className="bg-[var(--color-neutral-0)] p-4 rounded" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <label htmlFor="ask-input" className="block text-sm font-medium text-[var(--color-neutral-700)] sr-only">
            Ask
          </label>
          <input
            id="ask-input"
            className="w-full border rounded px-3 py-2 mb-3"
            type="text"
            placeholder="Type your question..."
            aria-label="Ask your data"
            disabled
          />
          <button className="px-4 py-2 rounded bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]" disabled>
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}
