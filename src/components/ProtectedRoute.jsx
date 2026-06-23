import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { FullScreen, Spinner } from './ui'

export default function ProtectedRoute({ children, allow }) {
  const { session, role, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <FullScreen><Spinner /></FullScreen>
  if (!session) return <Navigate to="/login" replace state={{ from: loc }} />
  if (allow && !allow.includes(role)) return <Navigate to="/" replace />
  return children
}
