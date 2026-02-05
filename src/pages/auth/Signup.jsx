import PasswordField from '@/components/PasswordField'
import AuthLayout from '@/layouts/AuthLayout'
import {Link, useNavigate} from 'react-router-dom'
import {useMemo, useState} from 'react'
import {useAuth} from '@/utils/auth'
import '@/css/pages/auth/auth.css'

export default function Signup() {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const navigate = useNavigate()
  const {signup} = useAuth()

  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [state, setState] = useState({
    fullName: '',
    email: '',
    verifyEmail: '',
    password: '',
    verifyPassword: '',
    errorEmail: '',
    errorPassword: '',
    error: '',
    processing: false
  })

  /* ==========================================================================
  LIFECYCLE METHODS START
  ============================================================================= */
  const containsSpecialChars = useMemo(() => {
    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/
    return specialChars.test(state.password)
  }, [state.password])

  const passwordIsValid = useMemo(() => {
    return state.password?.length >= 8
  })

  const disableSignupButton = useMemo(() => {
    if (!passwordIsValid) return true
    if (!containsSpecialChars) return true
    if (state.processing) return true
    return false
  })

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  function updateState(key, value) {
    setState(prevState => ({
      ...prevState,
      [key]: value
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    updateState('errorEmail', '')
    updateState('errorPassword', '')
    updateState('error', '')

    if (state.verifyPassword !== state.password) {
      return updateState('errorPassword', 'Your passwords do not match')
    }
    if (state.verifyEmail !== state.email) {
      return updateState('errorEmail', 'Your emails do not match')
    }

    updateState('processing', true)

    try {
      await signup(state.email, state.fullName, state.password)
      navigate('/dashboard')
    } catch (error) {
      updateState('error', error.toString())
    } finally {
      updateState('processing', false)
    }
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  return (
    <AuthLayout>
      <div className="auth">
        <div className="container">
          <h1>Create an account</h1>
          <div>
            <p>
              Let's get started! Becoming a member is free and only takes a few
              minutes.
            </p>
            <hr />

            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  type="text"
                  placeholder="Max Power"
                  autoComplete="name"
                  autoFocus
                  required
                  value={state.fullName}
                  onChange={e => updateState('fullName', e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="email-address">Email address</label>
                <input
                  id="email-address"
                  type="email"
                  placeholder="max-power@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(state.errorEmail !== '') || undefined}
                  required
                  value={state.email}
                  onChange={e => updateState('email', e.target.value)}
                />
                {state.errorEmail ? <small>{state.errorEmail}</small> : null}
              </div>

              <div>
                <label htmlFor="verify-email-address">
                  Verify email address
                </label>
                <input
                  id="verify-email-address"
                  type="email"
                  placeholder="max-power@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(state.errorEmail !== '') || undefined}
                  required
                  value={state.verifyEmail}
                  onChange={e => updateState('verifyEmail', e.target.value)}
                />
                {state.errorEmail ? <small>{state.errorEmail}</small> : null}
              </div>

              <PasswordField
                id="password"
                label="Password"
                autocomplete="new-password"
                defaultValue={state.password}
                onPasswordChange={password => updateState('password', password)}
                error={state.errorPassword}
              />

              <PasswordField
                id="confirm-password"
                label="Confirm password"
                autocomplete="new-password"
                defaultValue={state.verifyPassword}
                onPasswordChange={password =>
                  updateState('verifyPassword', password)
                }
                error={state.errorPassword}
              />

              {state.error ? <div className="error">{state.error}</div> : null}

              <button
                type="submit"
                aria-busy={Boolean(state.processing)}
                disabled={disableSignupButton}
              >
                Create account
              </button>
            </form>

            <p className="center-text">
              Have an account? <Link to="/">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
