export default function SettingsPage() {
  return (
    <div className="min-h-full bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-[var(--color-neutral-900)]">Settings</h1>
        <div className="bg-[var(--color-neutral-0)] p-4 rounded" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <label className="block mb-2 text-sm font-medium text-[var(--color-neutral-700)]">Workspace name</label>
          <input className="w-full border rounded px-3 py-2 mb-4" placeholder="My Workspace" />

          <label className="block mb-2 text-sm font-medium text-[var(--color-neutral-700)]">Notification email</label>
          <input className="w-full border rounded px-3 py-2" placeholder="manager@example.com" />
        </div>
      </div>
    </div>
  )
}
