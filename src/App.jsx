import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
import {AuthProvider, useAuth} from '@/utils/auth'

// Pages
import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'
import Dashboard from '@/pages/dashboard/Dashboard'
import Profile from '@/pages/dashboard/Profile'
import BPReadingList from '@/pages/bpreading/List'
import BPReadingConfig from '@/pages/bpreading/Config'

// Protected route wrapper
function ProtectedRoute({children}) {
  const {user, loading} = useAuth()
  if (loading) return <div>Loading...</div>
  if (!user)
    return (
      <Navigate
        to="/"
        replace
      />
    )
  return children
}

// Public route wrapper (redirects to dashboard if already logged in)
function PublicRoute({children}) {
  const {user, loading} = useAuth()
  if (loading) return <div>Loading...</div>
  if (user)
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bpreading"
        element={
          <ProtectedRoute>
            <BPReadingList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bpreading/new"
        element={
          <ProtectedRoute>
            <BPReadingConfig />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bpreading/:id/edit"
        element={
          <ProtectedRoute>
            <BPReadingConfig />
          </ProtectedRoute>
        }
      />

      {/* Catch all redirect */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
