import {Link, useLocation, useNavigate} from 'react-router-dom'
import {LogOut, Menu, Droplet, ChartArea} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import {useAuth} from '@/utils/auth'
import '@/css/components/nav.css'

export function Nav() {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const navRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const {user, logout} = useAuth()

  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  /* ==========================================================================
  LIFECYCLE METHODS START
  ============================================================================= */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) setScrolled(true)
      else setScrolled(false)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (navRef.current) {
        const navHeight = navRef.current.offsetHeight
        document.documentElement.style.setProperty(
          '--nav-height',
          `${navHeight}px`
        )
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  /* ==========================================================================
  FUNCTIONS START
  ============================================================================= */
  /**
   * Toggles nav open/closed state
   */
  function toggleNav() {
    setIsOpen(!isOpen)
  }

  /**
   * Closes the nav
   */
  function closeNav() {
    setIsOpen(false)
  }

  /**
   * Returns 'active' class if current path matches href
   * @param {string} href - Path to check
   * @returns {string} 'active' or empty string
   */
  function isActive(href) {
    return location.pathname === href ? 'active' : ''
  }

  /**
   * Handles logout button click
   * @param {Event} e - Click event
   */
  async function handleLogout(e) {
    e.preventDefault()
    await logout()
    navigate('/')
  }

  /* ==========================================================================
  VIEW START
  ============================================================================= */
  return (
    <div id="yVaOJu">
      <div
        ref={navRef}
        className={`mobile-nav ${scrolled ? 'background-reveal' : ''}`}
      >
        <button
          className="hamburger-btn"
          onClick={toggleNav}
          aria-label="Toggle navigation"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Overlay - Blurs background when nav is open */}
      <div
        className={`overlay ${isOpen ? 'active' : ''}`}
        onClick={closeNav}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="user-profile">
          <Link
            to="/profile"
            className="link"
          >
            <img
              className="avatar"
              src={user?.profilePicture || '/default-avatar.svg'}
              alt="avatar"
              onError={e => {
                e.target.src = '/default-avatar.svg'
              }}
            />
          </Link>

          <h4 className="user-name">{user?.fullName}</h4>
          <p className="user-email">{user?.email}</p>
        </div>

        <div className="nav-container">
          <nav className="navigation">
            <Link
              to="/dashboard"
              className={`nav-item link ${isActive('/dashboard')}`}
              onClick={closeNav}
            >
              <ChartArea />
              <span className="nav-text">Dashboard</span>
            </Link>

            <Link
              to="/bpreading"
              className={`nav-item link ${isActive('/bpreading')}`}
              onClick={closeNav}
            >
              <Droplet />
              <span className="nav-text">Pressure Readings</span>
            </Link>

            <a
              href="#"
              className="nav-item link"
              onClick={handleLogout}
              data-cy="logout-button"
            >
              <LogOut />
              <span className="nav-text">Logout</span>
            </a>
          </nav>
        </div>

        <div className="version-info">
          <span>v0.1.0</span>
        </div>
      </aside>
    </div>
  )
}
