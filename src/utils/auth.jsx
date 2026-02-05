import {createContext, useContext, useState, useEffect} from 'react'
import {api, getToken, clearToken} from './api'

const AuthContext = createContext({})

export function AuthProvider({children}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const token = getToken()
      if (token) {
        const user = await api.getUser()
        setUser(user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      clearToken()
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const result = await api.login(email, password)
    setUser(result.user)
    return result
  }

  async function signup(email, fullName, password) {
    const result = await api.signup(email, fullName, password)
    setUser(result.user)
    return result
  }

  async function logout() {
    await api.logout()
    setUser(null)
  }

  async function updateUser(data) {
    const updatedUser = await api.updateProfile(data)
    setUser(updatedUser)
    return updatedUser
  }

  async function deleteAccount(password) {
    await api.deleteAccount(password)
    setUser(null)
  }

  async function refreshUser() {
    const user = await api.getUser()
    setUser(user)
    return user
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    deleteAccount,
    refreshUser,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
