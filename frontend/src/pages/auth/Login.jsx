import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiLoader, FiLock, FiMail } from 'react-icons/fi'
import api, { clearSession, setSession } from '../../api/client'

function Login({ adminLock = false }) {
  const [email, setEmail] = useState(adminLock ? 'admin@admin.com' : '8amlight@gmail.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const adminRoles = new Set(['admin', 'super_admin'])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const isAdminUser = adminRoles.has(data.user.role)
      if (adminLock && !isAdminUser) {
        clearSession()
        setError('This access point is only for platform admins.')
        return
      }
      if (!adminLock && isAdminUser) {
        clearSession()
        setError('Invalid email or password')
        return
      }
      setSession(data)
      navigate(data.user.role === 'super_admin' ? '/super-admin' : data.user.role === 'admin' ? '/admin' : data.user.role === 'customer' ? '/#restaurants' : '/dashboard')
    } catch (err) {
      setError(adminLock ? 'Admin login failed' : err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">{adminLock ? 'Restricted access' : 'Account access'}</p>
        <h1>{adminLock ? 'Admin lock' : 'Sign in to Digi Menu'}</h1>
        <label>
          <span>Email</span>
          <div className="input-wrap">
            <FiMail aria-hidden="true" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </div>
        </label>
        <label>
          <span>Password</span>
          <div className="input-wrap">
            <FiLock aria-hidden="true" />
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </div>
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button full" type="submit" disabled={loading}>
          {loading ? <FiLoader className="spin" /> : null}
          {loading ? 'Signing in...' : 'Login'}
        </button>
        {!adminLock ? (
          <>
            <Link className="secondary-button full" to="/register">
              Register restaurant
            </Link>
            <Link className="secondary-button full" to="/store/sign-up">
              Create customer account
            </Link>
          </>
        ) : null}
        <div className="demo-accounts">
          {adminLock ? (
            <>
              <button type="button" onClick={() => setEmail('admin@admin.com')}>
                Admin access
              </button>
              <button type="button" onClick={() => setEmail('superadmin@admin.com')}>
                Super admin access
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEmail('8amlight@gmail.com')}>
                Restaurant account
              </button>
              <button type="button" onClick={() => setEmail('manager@digimenu.com')}>
                Manager account
              </button>
              <button type="button" onClick={() => setEmail('customer@digimenu.com')}>
                Customer account
              </button>
            </>
          )}
        </div>
      </form>
    </main>
  )
}

export default Login
