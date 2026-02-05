/**
 * Universal theme utility functions for consistent theme management across all layouts
 */

// Theme constants
export const THEME_STORAGE_KEY = 'theme'
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}

/**
 * Get the current theme from localStorage or system preference
 * @returns {string} The current theme ('light' or 'dark')
 */
export function getCurrentTheme() {
  // First check localStorage
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
    return savedTheme
  }

  // Fall back to system preference
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return THEMES.DARK
  }

  return THEMES.LIGHT
}

/**
 * Set the theme on the HTML element and in localStorage
 * @param {string} theme - The theme to set ('light' or 'dark')
 */
export function setTheme(theme) {
  if (!Object.values(THEMES).includes(theme)) {
    console.warn(`Invalid theme: ${theme}. Using light theme.`)
    theme = THEMES.LIGHT
  }

  // Set on HTML element
  document.documentElement.setAttribute('data-theme', theme)

  // Save to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

/**
 * Toggle between light and dark themes
 * @returns {string} The new theme
 */
export function toggleTheme() {
  const currentTheme = getCurrentTheme()
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
  setTheme(newTheme)
  return newTheme
}

/**
 * Initialize theme immediately (call before DOM loads to prevent flash)
 * This should be called in a script tag in the head
 */
export function initializeThemeImmediately() {
  const theme = getCurrentTheme()
  setTheme(theme)
}

/**
 * Initialize theme system after DOM loads
 * Sets up event listeners and updates UI elements
 */
export function initializeThemeSystem() {
  const theme = getCurrentTheme()
  setTheme(theme)

  // Update theme toggle buttons
  const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]')
  themeToggleButtons.forEach(button => {
    updateThemeToggleButton(button, theme)
  })

  // Listen for system theme changes
  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => {
        // Only update if user hasn't set a preference
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
        if (!savedTheme) {
          const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT
          setTheme(newTheme)
          themeToggleButtons.forEach(button => {
            updateThemeToggleButton(button, newTheme)
          })
        }
      })
  }
}

/**
 * Update theme toggle button appearance
 * @param {HTMLElement} button - The button element
 * @param {string} theme - Current theme
 */
export function updateThemeToggleButton(button, theme) {
  if (button) {
    button.textContent = theme === THEMES.LIGHT ? '🌙' : '☀️'
    button.setAttribute(
      'aria-label',
      `Switch to ${theme === THEMES.LIGHT ? 'dark' : 'light'} theme`
    )
  }
}

/**
 * Create a theme toggle function for use in onclick handlers
 * @param {HTMLElement} button - The button element (optional)
 * @returns {Function} Theme toggle function
 */
export function createThemeToggleHandler(button = null) {
  return function () {
    const newTheme = toggleTheme()

    // Update all theme toggle buttons
    const allButtons = document.querySelectorAll('[data-theme-toggle]')
    allButtons.forEach(btn => {
      updateThemeToggleButton(btn, newTheme)
    })

    // Update specific button if provided
    if (button) {
      updateThemeToggleButton(button, newTheme)
    }

    // Dispatch custom event for other parts of the app
    window.dispatchEvent(
      new CustomEvent('themeChanged', {
        detail: {theme: newTheme}
      })
    )
  }
}
