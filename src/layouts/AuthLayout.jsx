import {Link, useLocation} from 'react-router-dom'
import {useState, useEffect, useRef} from 'react'
import {ThemeProvider, useTheme} from '@/contexts/ThemeContext'
import '@/css/layouts/authlayout.css'

function AuthLayoutContent({children}) {
  /* ==========================================================================
  ATTRIBUTES START
  ============================================================================= */
  const {theme, switchTheme} = useTheme()
  const navRef = useRef(null)
  const location = useLocation()

  /* ==========================================================================
  STATE START
  ============================================================================= */
  const [scrolled, setScrolled] = useState(false)

  /* ==========================================================================
  LIFECYCLE METHODS START
  ============================================================================= */
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) setScrolled(true)
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
  VIEW START
  ============================================================================= */
  return (
    <>
      <div
        id="lDUHFs"
        ref={navRef}
        className={scrolled ? 'background-reveal' : ''}
      >
        <header>
          <nav>
            <ul>
              <li>
                <strong>
                  <Link
                    to="/"
                    id="app-name"
                  >
                    BPReading
                  </Link>
                </strong>
              </li>
            </ul>
            <ul>
              <li>
                <button
                  onClick={switchTheme}
                  className="theme-button contrast"
                  aria-label="Toggle theme"
                  data-theme-toggle
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="outline"
                  role="button"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </nav>
        </header>
      </div>

      <main style={{paddingTop: 'var(--nav-height)'}}>{children}</main>
      <footer>
        <small>
          &copy; {new Date().getFullYear()} BPReading. All rights reserved.
        </small>
      </footer>
    </>
  )
}

export default function AuthLayout({children}) {
  return (
    <ThemeProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </ThemeProvider>
  )
}
