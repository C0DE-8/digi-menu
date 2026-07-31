import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiLoader, FiLock, FiMail } from 'react-icons/fi'
import api, { setSession } from '../../api/client'

function Login() {
  const [email, setEmail] = useState('8amlight@gmail.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      setSession(data)
      navigate(data.user.role === 'super_admin' ? '/super-admin' : data.user.role === 'admin' ? '/admin' : data.user.role === 'customer' ? '/#restaurants' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Demo access</p>
        <h1>Sign in to Digi Menu</h1>
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
        <Link className="secondary-button full" to="/register">
          Register restaurant
        </Link>
        <Link className="secondary-button full" to="/store/sign-up">
          Create customer account
        </Link>
        <div className="demo-accounts">
          <button type="button" onClick={() => setEmail('admin@admin.com')}>
            Admin: admin@admin.com / 123456
          </button>
          <button type="button" onClick={() => setEmail('8amlight@gmail.com')}>
            User: 8amlight@gmail.com / 123456
          </button>
          <button type="button" onClick={() => setEmail('manager@digimenu.com')}>
            Manager: manager@digimenu.com / 123456
          </button>
          <button type="button" onClick={() => setEmail('customer@digimenu.com')}>
            Customer: customer@digimenu.com / 123456
          </button>
        </div>
      </form>
    </main>
  )
}

export default Login
