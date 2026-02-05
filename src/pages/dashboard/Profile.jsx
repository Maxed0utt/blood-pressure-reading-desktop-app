import Modal from '@/components/Modal'
import ModalButton from '@/components/ModalButton'
import PasswordField from '@/components/PasswordField'
import {useTheme} from '@/contexts/ThemeContext'
import AppLayout from '@/layouts/AppLayout'
import {useAuth} from '@/utils/auth'
import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {LogOut} from 'lucide-react'
import '@/css/pages/dashboard/profile.css'

export default function Profile() {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const {user, updateUser, deleteAccount, logout} = useAuth()
  const {theme, switchTheme} = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [state, setState] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
    profilePicture: user?.profilePicture || '',
    deleteAccountPassword: '',
    error: '',
    success: '',
    processing: false
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

  async function handleUpdateProfile(e) {
    e.preventDefault()
    updateState('error', '')
    updateState('success', '')
    updateState('processing', true)

    try {
      await updateUser({
        fullName: state.fullName,
        email: state.email,
        profilePicture: state.profilePicture || null
      })
      updateState('success', 'Profile updated successfully!')
    } catch (error) {
      updateState('error', error.toString())
    } finally {
      updateState('processing', false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    updateState('error', '')
    updateState('success', '')

    if (state.password !== state.confirmPassword) {
      return updateState('error', 'Passwords do not match')
    }

    updateState('processing', true)

    try {
      await updateUser({
        currentPassword: state.currentPassword,
        password: state.password
      })
      updateState('success', 'Password updated successfully!')
      updateState('currentPassword', '')
      updateState('password', '')
      updateState('confirmPassword', '')
    } catch (error) {
      updateState('error', error.toString())
    } finally {
      updateState('processing', false)
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault()

    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return
    }

    updateState('processing', true)

    try {
      await deleteAccount(state.deleteAccountPassword)
      navigate('/')
    } catch (error) {
      updateState('error', error.toString())
      updateState('processing', false)
    }
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  return (
    <AppLayout>
      <div>
        <section>
          <header className="profile-header">
            <h1>My Profile</h1>
            <div className="header-actions">
              <button
                onClick={switchTheme}
                className="contrast"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                onClick={handleLogout}
                className="outline"
                data-cy="logout-button"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <div className="info-section">
            <div className="text-section">
              <p>{user?.fullName}</p>
              <p>{user?.email}</p>
            </div>

            <div className="action-section">
              <ModalButton modalId="update-profile">Edit Profile</ModalButton>
            </div>
          </div>

          <hr />
        </section>

        <section>
          <header>
            <h2>Change Password</h2>
          </header>

          <div className="info-section">
            <div className="text-section">
              <p>********</p>
              <p>********</p>
            </div>

            <div className="action-section">
              <ModalButton modalId="change-password-modal">
                Change Password
              </ModalButton>
            </div>
          </div>

          <hr />
        </section>

        <section>
          <header className="info-section">
            <h2>Delete Account</h2>
            <div className="action-section">
              <ModalButton
                modalId="delete-account-modal"
                className="danger"
              >
                Delete Account
              </ModalButton>
            </div>
          </header>
        </section>
      </div>

      <Modal
        modalId="update-profile"
        title="Update Profile"
        confirmtext="Update"
        confirmaction={e => handleUpdateProfile(e)}
      >
        <div>
          <label
            htmlFor="profile-picture"
            className="profile-picture-upload"
          >
            <div className="profile-picture-container">
              <img
                src={
                  state.profilePicture
                    ? state.profilePicture
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
                }
                alt="Profile"
                className="profile-picture-preview"
                onError={e => {
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
                }}
              />
              <div className="profile-picture-overlay">
                <span className="plus-icon">+</span>
                <span className="upload-text">Upload Photo</span>
              </div>
            </div>
            <input
              id="profile-picture"
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={e => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = e => {
                    if (e.target.result !== state.profilePicture) {
                      updateState('profilePicture', e.target.result)
                    }
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
          </label>
        </div>

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
            required
            value={state.email}
            onChange={e => updateState('email', e.target.value)}
          />
        </div>

        {state.success ? <div className="success">{state.success}</div> : null}

        {state.error ? <div className="error">{state.error}</div> : null}
      </Modal>

      <Modal
        modalId="change-password-modal"
        title="Change Password"
        confirmtext="Update"
        confirmaction={e => handleChangePassword(e)}
      >
        <p>
          Ensure your account is using a long, random password to stay secure.
        </p>

        <PasswordField
          id="current-password-field"
          autocomplete="current-password"
          label="Current password"
          defaultValue={state.currentPassword}
          onPasswordChange={password =>
            updateState('currentPassword', password)
          }
          error=""
        />

        <PasswordField
          id="new-password-field"
          autocomplete="new-password"
          label="New password"
          defaultValue={state.password}
          onPasswordChange={password => updateState('password', password)}
          error=""
        />

        <PasswordField
          id="confirm-password-field"
          label="Confirm password"
          autocomplete="new-password"
          defaultValue={state.confirmPassword}
          onPasswordChange={password =>
            updateState('confirmPassword', password)
          }
          error=""
        />

        {state.error ? <div className="error">{state.error}</div> : null}
      </Modal>

      <Modal
        modalId="delete-account-modal"
        title="Delete Account"
        confirmtext="Delete Account"
        isDeleteModal={true}
        confirmaction={e => handleDeleteAccount(e)}
      >
        <p>
          Once your account is deleted, all of its resources and data will be
          permanently deleted. Before deleting your account, please download any
          data or information that you wish to retain.
        </p>

        <PasswordField
          id="enter-password-field"
          label="Enter password"
          autocomplete="current-password"
          onPasswordChange={password =>
            updateState('deleteAccountPassword', password)
          }
        />

        {state.error ? <div className="error">{state.error}</div> : null}
      </Modal>
    </AppLayout>
  )
}
