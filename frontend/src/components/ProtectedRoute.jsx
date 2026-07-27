import { Navigate } from 'react-router-dom'
import { getStoredUser } from '../api/client'

function ProtectedRoute({ children, adminOnly = false }) {
  const user = getStoredUser()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !['admin', 'super_admin'].includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default ProtectedRoute
