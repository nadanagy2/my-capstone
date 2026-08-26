export default function AskPage() {
  return (
    <div className="min-h-full bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">Ask Your Data</h1>
        <div className="bg-white p-4 rounded shadow">
          <label htmlFor="ask-input" className="block text-sm font-medium text-gray-700 sr-only">
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
          <button className="px-4 py-2 rounded bg-gray-200 text-gray-600" disabled>
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}
