import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UserSettingsForm from './UserSettingsForm'

describe('UserSettingsForm', () => {
  it('submits valid data, logs to console, and shows success message', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<UserSettingsForm />)

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
    await user.click(screen.getByLabelText(/enable notifications/i))

    const saveButton = screen.getByRole('button', { name: /save/i })
    await waitFor(() => expect(saveButton).toBeEnabled())
    await user.click(saveButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        notificationsEnabled: true,
      })
    })
    expect(
      screen.getByText(/your settings were saved successfully/i),
    ).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('shows an error when full name is empty', async () => {
    const user = userEvent.setup()

    render(<UserSettingsForm />)

    await user.click(screen.getByLabelText(/full name/i))
    await user.tab()

    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('shows an error when email format is invalid', async () => {
    const user = userEvent.setup()

    render(<UserSettingsForm />)

    await user.type(screen.getByLabelText(/full name/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email')
    await user.tab()

    expect(
      await screen.findByText('Please enter a valid email address'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })
})
