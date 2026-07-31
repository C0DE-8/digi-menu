import { Navigate } from 'react-router-dom'
import { getStoredUser } from '../api/client'

function ProtectedRoute({ children, adminOnly = false, restaurantOnly = false, superAdminOnly = false }) {
  const user = getStoredUser()
  if (!user) return <Navigate to="/login" replace />
  if (superAdminOnly && user.role !== 'super_admin') return <Navigate to={['admin', 'super_admin'].includes(user.role) ? '/admin' : '/dashboard'} replace />
  if (restaurantOnly && user.role === 'super_admin') return <Navigate to="/super-admin" replace />
  if (restaurantOnly && user.role === 'customer') return <Navigate to="/" replace />
  if (adminOnly && !['admin', 'super_admin'].includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default ProtectedRoute
