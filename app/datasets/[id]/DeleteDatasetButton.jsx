'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// A two-step delete: the first click only asks for confirmation, so a dataset
// cannot be removed by accident. Deleting the dataset also deletes its rows,
// because the database is set up to cascade the delete.
export default function DeleteDatasetButton({ datasetId, datasetName, rowCount }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const triggerRef = useRef(null)
  const cancelRef = useRef(null)
  const hasOpened = useRef(false)

  // Move focus to the safe choice (Cancel) when the question appears, and back
  // to the Delete button if the user cancels.
  useEffect(() => {
    if (confirming) {
      hasOpened.current = true
      cancelRef.current?.focus()
    } else if (hasOpened.current) {
      triggerRef.current?.focus()
    }
  }, [confirming])

  function cancel() {
    setConfirming(false)
    setError(null)
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)

    try {
      const { data, error: deleteError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', datasetId)
        .select('id')

      if (deleteError) throw deleteError
      if (!data || data.length === 0) {
        throw new Error('This dataset could not be deleted. Please refresh the page and try again.')
      }

      router.push('/datasets')
      router.refresh()
    } catch (err) {
      setError(err.message || 'Something went wrong. Nothing was deleted.')
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
      >
        Delete dataset
      </button>
    )
  }

  return (
    <div role="group" aria-labelledby="delete-title" aria-describedby="delete-description">
      <p id="delete-title" className="text-sm font-semibold text-[var(--color-neutral-900)]">
        Delete “{datasetName}”?
      </p>
      <p id="delete-description" className="mt-1 text-sm text-[var(--color-neutral-700)]">
        This permanently deletes the dataset and{' '}
        {typeof rowCount === 'number' ? `its ${rowCount.toLocaleString()} rows` : 'all of its rows'}.
        This cannot be undone.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          ref={cancelRef}
          type="button"
          onClick={cancel}
          disabled={deleting}
          className="rounded-lg border border-[var(--color-neutral-200)] px-4 py-2 text-sm font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)] transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 transition disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Yes, delete it'}
        </button>
      </div>
    </div>
  )
}
