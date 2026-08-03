import { useId, useState } from 'react'
import './SettingsForm.css'

const defaultSettings = {
  displayName: '',
  email: '',
  bio: '',
  emailDigest: true,
  productUpdates: false,
  theme: 'system',
  profilePublic: true,
}

function SettingsForm() {
  const formId = useId()
  const [settings, setSettings] = useState(defaultSettings)
  const [savedSnapshot, setSavedSnapshot] = useState(defaultSettings)
  const [status, setStatus] = useState(null)

  const isDirty =
    JSON.stringify(settings) !== JSON.stringify(savedSnapshot)

  function updateField(name, value) {
    setSettings((prev) => ({ ...prev, [name]: value }))
    setStatus(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSavedSnapshot(settings)
    setStatus('saved')
  }

  function handleReset() {
    setSettings(savedSnapshot)
    setStatus(null)
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h1>Settings</h1>
        <p>Manage your profile and how the app behaves for you.</p>
      </header>

      <form
        className="settings-form"
        onSubmit={handleSubmit}
        aria-describedby={status ? `${formId}-status` : undefined}
      >
        <fieldset className="settings-section">
          <legend className="settings-section__title">Profile</legend>
          <p className="settings-section__hint">
            This information may be shown on your public profile.
          </p>

          <div className="settings-field">
            <label htmlFor={`${formId}-displayName`}>Display name</label>
            <input
              id={`${formId}-displayName`}
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="Alex Rivera"
              value={settings.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
            />
          </div>

          <div className="settings-field">
            <label htmlFor={`${formId}-email`}>Email</label>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={settings.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </div>

          <div className="settings-field">
            <label htmlFor={`${formId}-bio`}>Bio</label>
            <textarea
              id={`${formId}-bio`}
              name="bio"
              rows={4}
              placeholder="A short line about you"
              value={settings.bio}
              onChange={(e) => updateField('bio', e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="settings-section">
          <legend className="settings-section__title">Notifications</legend>

          <label className="settings-toggle">
            <input
              type="checkbox"
              name="emailDigest"
              checked={settings.emailDigest}
              onChange={(e) => updateField('emailDigest', e.target.checked)}
            />
            <span className="settings-toggle__copy">
              <span className="settings-toggle__label">Weekly email digest</span>
              <span className="settings-toggle__desc">
                Summary of activity and highlights from the past week.
              </span>
            </span>
          </label>

          <label className="settings-toggle">
            <input
              type="checkbox"
              name="productUpdates"
              checked={settings.productUpdates}
              onChange={(e) => updateField('productUpdates', e.target.checked)}
            />
            <span className="settings-toggle__copy">
              <span className="settings-toggle__label">Product updates</span>
              <span className="settings-toggle__desc">
                New features, tips, and occasional surveys.
              </span>
            </span>
          </label>
        </fieldset>

        <fieldset className="settings-section">
          <legend className="settings-section__title">Appearance</legend>

          <div className="settings-field">
            <label htmlFor={`${formId}-theme`}>Theme</label>
            <select
              id={`${formId}-theme`}
              name="theme"
              value={settings.theme}
              onChange={(e) => updateField('theme', e.target.value)}
            >
              <option value="system">System default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </fieldset>

        <fieldset className="settings-section">
          <legend className="settings-section__title">Privacy</legend>

          <label className="settings-toggle">
            <input
              type="checkbox"
              name="profilePublic"
              checked={settings.profilePublic}
              onChange={(e) => updateField('profilePublic', e.target.checked)}
            />
            <span className="settings-toggle__copy">
              <span className="settings-toggle__label">Public profile</span>
              <span className="settings-toggle__desc">
                Allow others to find your profile by display name.
              </span>
            </span>
          </label>
        </fieldset>

        <div className="settings-form__actions">
          {status === 'saved' && (
            <p
              id={`${formId}-status`}
              className="settings-form__status"
              role="status"
            >
              Changes saved.
            </p>
          )}
          <div className="settings-form__buttons">
            <button
              type="button"
              className="settings-btn settings-btn--secondary"
              onClick={handleReset}
              disabled={!isDirty}
            >
              Discard changes
            </button>
            <button
              type="submit"
              className="settings-btn settings-btn--primary"
              disabled={!isDirty}
            >
              Save settings
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SettingsForm
