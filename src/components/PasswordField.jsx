import {useEffect, useState, useMemo} from 'react'
import '@/css/components/passwordfield.css'

export default function PasswordField({
  autocomplete,
  label,
  id,
  defaultValue,
  onPasswordChange,
  error
}) {
  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [state, setState] = useState({
    isPasswordVisible: false,
    password: '',
    error: ''
  })

  /* ==========================================================================
  LIFECYCLE METHODS START
  ============================================================================= */
  useEffect(() => {
    if (defaultValue) {
      updateState('password', defaultValue)
      onPasswordChange(defaultValue)
    }
  }, [defaultValue])

  useEffect(() => {
    updateState('error', error)
  }, [error])

  useEffect(() => {
    onPasswordChange(state.password)
  }, [state.password])

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  /**
   * Updates state with given key-value pair
   * @param {string} key - State key to update
   * @param {any} value - New value for the key
   */
  function updateState(key, value) {
    setState(prevState => ({
      ...prevState,
      [key]: value
    }))
  }

  /**
   * Checks if password contains special characters
   * @returns {boolean} True if password contains special chars
   */
  const containsSpecialChars = useMemo(() => {
    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/
    return specialChars.test(state.password)
  }, [state.password])

  /**
   * Checks if password meets minimum length requirement
   * @returns {boolean} True if password is at least 8 characters
   */
  const passwordIsValid = useMemo(() => {
    return state.password?.length >= 8
  }, [state.password])

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  return (
    <>
      <div className="sVWe0Z">
        <label htmlFor={id}>{label}</label>
        <div
          role="group"
          className="group"
        >
          <input
            id={id}
            type={state.isPasswordVisible ? 'text' : 'password'}
            placeholder="********"
            autoComplete={autocomplete}
            value={state.password}
            aria-invalid={state.error !== '' || undefined}
            required
            onChange={e => updateState('password', e.target.value)}
          />
          <button
            type="button"
            onClick={() =>
              updateState('isPasswordVisible', !state.isPasswordVisible)
            }
          >
            {state.isPasswordVisible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="bi bi-eye-slash"
                viewBox="0 0 16 16"
              >
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
                <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="bi bi-eye"
                viewBox="0 0 16 16"
              >
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
              </svg>
            )}
          </button>
        </div>

        {state.error && <small>{state.error}</small>}
      </div>
    </>
  )
}
