import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const { deleteSelect, push, refresh } = vi.hoisted(() => ({
  deleteSelect: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ delete: () => ({ eq: () => ({ select: deleteSelect }) }) }),
  },
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }))

import DeleteDatasetButton from './DeleteDatasetButton'

function setup() {
  render(<DeleteDatasetButton datasetId="abc" datasetName="Q3 Sales" rowCount={1250} />)
}

describe('DeleteDatasetButton', () => {
  beforeEach(() => {
    deleteSelect.mockReset()
    push.mockReset()
    refresh.mockReset()
  })

  it('only shows a Delete button until the user asks to delete', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Delete dataset' })).toBeTruthy()
    expect(screen.queryByText(/cannot be undone/)).toBeNull()
  })

  it('asks for confirmation, naming the dataset and its row count', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete dataset' }))
    expect(screen.getByText(/Delete “Q3 Sales”\?/)).toBeTruthy()
    expect(screen.getByText(/1,250 rows/)).toBeTruthy()
    expect(deleteSelect).not.toHaveBeenCalled()
  })

  it('does nothing if the user cancels', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete dataset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Delete dataset' })).toBeTruthy()
    expect(deleteSelect).not.toHaveBeenCalled()
  })

  it('deletes and returns to the dataset list once confirmed', async () => {
    deleteSelect.mockResolvedValue({ data: [{ id: 'abc' }], error: null })
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete dataset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete it' }))
    await waitFor(() => expect(push).toHaveBeenCalledWith('/datasets'))
    expect(refresh).toHaveBeenCalled()
  })

  it('shows an error and stays put if the database refuses', async () => {
    deleteSelect.mockResolvedValue({ data: null, error: { message: 'permission denied' } })
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete dataset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete it' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/permission denied/))
    expect(push).not.toHaveBeenCalled()
  })

  it('treats a delete that removed nothing as a failure', async () => {
    deleteSelect.mockResolvedValue({ data: [], error: null })
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Delete dataset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete it' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/could not be deleted/))
    expect(push).not.toHaveBeenCalled()
  })
})
