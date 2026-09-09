'use client'

import { useEffect } from 'react'

export default function AskError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Ask page crashed:', error)
  }, [error])

  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--color-neutral-50)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
          ⚠
        </div>
        <h2 className="text-base font-semibold text-red-900">Something went wrong</h2>
        <p className="mt-1.5 text-sm text-red-700">
          The Ask Your Data page hit an unexpected error. This has been logged.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
