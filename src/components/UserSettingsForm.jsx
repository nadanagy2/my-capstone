import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import './UserSettingsForm.css'

const userSettingsSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  notificationsEnabled: z.boolean(),
})

export default function UserSettingsForm() {
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    resolver: zodResolver(userSettingsSchema),
    mode: 'all',
    defaultValues: {
      fullName: '',
      email: '',
      notificationsEnabled: false,
    },
  })

  const onSubmit = async (data) => {
    setSubmitSuccess(false)
    console.log(data)
    setSubmitSuccess(true)
  }

  const fullNameErrorId = 'user-settings-full-name-error'
  const emailErrorId = 'user-settings-email-error'

  return (
    <form
      className="user-settings-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <h2 className="user-settings-form__title">User settings</h2>

      {submitSuccess ? (
        <p className="user-settings-form__success" role="status">
          Your settings were saved successfully.
        </p>
      ) : null}

      <div className="user-settings-form__field">
        <label htmlFor="user-settings-full-name">Full name</label>
        <input
          id="user-settings-full-name"
          type="text"
          autoComplete="name"
          aria-invalid={errors.fullName ? 'true' : 'false'}
          aria-describedby={
            errors.fullName ? fullNameErrorId : undefined
          }
          {...register('fullName')}
        />
        {errors.fullName ? (
          <p
            id={fullNameErrorId}
            className="user-settings-form__error"
            role="alert"
          >
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="user-settings-form__field">
        <label htmlFor="user-settings-email">Email</label>
        <input
          id="user-settings-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? emailErrorId : undefined}
          {...register('email')}
        />
        {errors.email ? (
          <p
            id={emailErrorId}
            className="user-settings-form__error"
            role="alert"
          >
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="user-settings-form__field user-settings-form__field--checkbox">
        <input
          id="user-settings-notifications"
          type="checkbox"
          {...register('notificationsEnabled')}
        />
        <label htmlFor="user-settings-notifications">
          Enable notifications
        </label>
      </div>

      <button
        type="submit"
        className="user-settings-form__submit"
        disabled={!isValid || isSubmitting}
      >
        Save
      </button>
    </form>
  )
}
