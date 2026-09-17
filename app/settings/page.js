'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'ask-your-data:settings'

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setWorkspaceName(parsed.workspaceName || '')
        setNotificationEmail(parsed.notificationEmail || '')
      }
    } catch {
      // If localStorage is unavailable or the stored value is corrupt,
      // just fall back to the empty defaults rather than crashing.
    }
  }, [])

  function handleSave(event) {
    event.preventDefault()
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ workspaceName, notificationEmail })
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // localStorage can fail (private browsing, storage full, etc.) —
      // fail silently rather than crashing; the form data isn't lost from
      // the user's perspective within this session.
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4 text-[var(--color-neutral-900)]">Settings</h1>
        <form
          onSubmit={handleSave}
          className="bg-[var(--color-neutral-0)] p-4 rounded"
          style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <label htmlFor="workspace-name" className="block mb-2 text-sm font-medium text-[var(--color-neutral-700)]">
            Workspace name
          </label>
          <input
            id="workspace-name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="My Workspace"
          />

          <label htmlFor="notification-email" className="block mb-2 text-sm font-medium text-[var(--color-neutral-700)]">
            Notification email
          </label>
          <input
            id="notification-email"
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="manager@example.com"
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-brand-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-brand-500)] transition"
            >
              Save changes
            </button>
            {saved && (
              <span className="text-sm text-green-600" role="status">
                Saved
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}