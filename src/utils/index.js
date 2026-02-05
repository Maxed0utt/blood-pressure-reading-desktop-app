/**
 * Determines the width of the scrollbar on the current page.
 *
 * @returns {number} The width of the scrollbar in pixels.
 *                   Returns 0 if there is no scrollbar or if executing in a server-side environment.
 */
export function getScrollBarWidth() {
  const isSSR = typeof window === 'undefined'
  if (isSSR) return 0
  const hasScrollbar = document.body.scrollHeight > screen.height
  if (hasScrollbar) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    return scrollbarWidth
  }
  return 0
}

/**
 * Formats a date for display
 * @param {number|string} date - Date value to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

/**
 * Formats a timestamp to datetime-local input format
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted datetime string for input
 */
export function formatDateForInput(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
