import {invoke} from '@tauri-apps/api/core'

// Token management
const TOKEN_KEY = 'bp_session_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = token => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const api = {
  /* ==========================================================================
  AUTH
  ============================================================================= */
  login: async (email, password) => {
    const result = await invoke('login', {email, password})
    if (result.token) setToken(result.token)
    return result
  },

  signup: async (email, fullName, password) => {
    const result = await invoke('signup', {email, fullName, password})
    if (result.token) setToken(result.token)
    return result
  },

  logout: async () => {
    const token = getToken()
    if (token) {
      await invoke('logout', {token})
      clearToken()
    }
    return true
  },

  /* ==========================================================================
  USER
  ============================================================================= */
  getUser: async () => {
    const token = getToken()
    if (!token) return null
    return invoke('get_user', {token})
  },

  updateProfile: async data => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('update_profile', {token, ...data})
  },

  deleteAccount: async password => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    const result = await invoke('delete_account', {token, password})
    if (result) clearToken()
    return result
  },

  /* ==========================================================================
  BP Readings
  ============================================================================= */
  listReadings: async () => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('list_readings', {token})
  },

  createReading: async data => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('create_reading', {
      token,
      topNumber: data.topNumber,
      bottomNumber: data.bottomNumber,
      heartRate: data.heartRate,
      createdAt: data.createdAt || null
    })
  },

  updateReading: async (id, data) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('update_reading', {
      token,
      id,
      topNumber: data.topNumber,
      bottomNumber: data.bottomNumber,
      heartRate: data.heartRate,
      createdAt: data.createdAt
    })
  },

  deleteReading: async id => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('delete_reading', {token, id})
  },

  exportReadings: async () => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('export_readings', {token})
  },

  importReadings: async csvData => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('import_readings', {token, csvData})
  },

  /* ==========================================================================
  DASHBOARD
  ============================================================================= */
  getDashboard: async () => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')
    return invoke('get_dashboard', {token})
  }
}
