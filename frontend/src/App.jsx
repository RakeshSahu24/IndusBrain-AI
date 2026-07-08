import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Chat from './pages/Chat'
import DocumentViewer from './pages/DocumentViewer'
import AdminDashboard from './pages/AdminDashboard'
import About from './pages/About'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function AdminLayout({ children }) {
  return (
    <ProtectedRoute adminOnly>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public routes - no layout */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />

      {/* Protected routes with sidebar layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedLayout>
            <Upload />
          </ProtectedLayout>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedLayout>
            <Chat />
          </ProtectedLayout>
        }
      />
      <Route
        path="/view/:id"
        element={
          <ProtectedLayout>
            <DocumentViewer />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/about"
        element={
          <ProtectedLayout>
            <About />
          </ProtectedLayout>
        }
      />
    </Routes>
  )
}
