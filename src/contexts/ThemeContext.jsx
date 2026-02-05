import {createContext, useContext, useEffect, useState} from 'react'
import {
  getCurrentTheme,
  setTheme as setThemeUtil,
  toggleTheme as toggleThemeUtil,
  THEMES
} from '@/utils/themeUtils'

const ThemeContext = createContext({})
const useTheme = () => useContext(ThemeContext)

const ThemeProvider = ({children, ...props}) => {
  const isSSR = typeof window === 'undefined'

  // Initialize theme from universal utils
  const [theme, setTheme] = useState(() => {
    if (isSSR) return 'light'
    return getCurrentTheme()
  })

  const [selectedTheme, setSelectedTheme] = useState(() => {
    if (isSSR) return null
    return localStorage.getItem('theme')
  })

  const switchTheme = () => {
    if (isSSR) return

    const newTheme = toggleThemeUtil()
    setTheme(newTheme)
    setSelectedTheme(newTheme)

    // Dispatch custom event for other parts of the app
    window.dispatchEvent(
      new CustomEvent('themeChanged', {
        detail: {theme: newTheme}
      })
    )
  }

  // Update theme when system preference changes (only if no saved preference)
  useEffect(() => {
    if (isSSR) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (!selectedTheme) {
        const currentTheme = getCurrentTheme()
        setTheme(currentTheme)
        setThemeUtil(currentTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [selectedTheme, isSSR])

  // Apply theme using universal utils
  useEffect(() => {
    if (isSSR) return

    setThemeUtil(theme)
  }, [theme, isSSR])

  // Listen for theme changes from other parts of the app
  useEffect(() => {
    if (isSSR) return

    const handleThemeChange = event => {
      const newTheme = event.detail.theme
      setTheme(newTheme)
      setSelectedTheme(newTheme)
    }

    window.addEventListener('themeChanged', handleThemeChange)
    return () => window.removeEventListener('themeChanged', handleThemeChange)
  }, [isSSR])

  // Initialize theme on mount
  useEffect(() => {
    if (isSSR) return

    const currentTheme = getCurrentTheme()
    setTheme(currentTheme)
    setThemeUtil(currentTheme)
  }, [isSSR])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        switchTheme,
        ...props
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export {ThemeProvider, useTheme}
