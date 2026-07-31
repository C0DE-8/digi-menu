import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiGrid, FiLogOut, FiShoppingBag } from 'react-icons/fi'
import { clearSession, getStoredRestaurant, getStoredUser } from '../api/client'

function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [session, setSessionState] = useState(() => readSession())
  const { user, restaurant } = session

  useEffect(() => {
    function refreshSession() {
      setSessionState(readSession())
    }

    window.addEventListener('digiMenuSessionChanged', refreshSession)
    window.addEventListener('storage', refreshSession)
    return () => {
      window.removeEventListener('digiMenuSessionChanged', refreshSession)
      window.removeEventListener('storage', refreshSession)
    }
  }, [])

  const links = user
    ? user.role === 'customer'
      ? [
          { to: '/', label: 'Home' },
          { to: '/#restaurants', label: 'Restaurants' },
        ]
      : user.role === 'super_admin'
      ? [
          { to: '/super-admin', label: 'Super admin' },
          { to: '/admin', label: 'Admin view' },
        ]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/menu-builder', label: 'Menu' },
          { to: '/analytics', label: 'Analytics' },
          { to: '/qr-code', label: 'QR' },
          { to: '/subscriptions', label: 'Billing' },
          { to: '/settings', label: 'Settings' },
          ...(user.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
          ...(restaurant?.slug ? [{ to: `/menu/${restaurant.slug}`, label: 'Public menu' }] : []),
        ]
    : [
        { to: '/', label: 'Home' },
        { to: '/#restaurants', label: 'Restaurants' },
        { to: '/store/sign-up', label: 'Customer sign up' },
        { to: '/register', label: 'Start selling' },
      ]

  function logout() {
    clearSession()
    setSessionState({ user: null, restaurant: null })
    setOpen(false)
    navigate('/login')
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <FiGrid aria-hidden="true" />
        <span>Digi Menu</span>
      </Link>
      <button className="icon-button mobile-only" type="button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        {open ? <FiX /> : <FiMenu />}
      </button>
      <nav className={open ? 'nav open' : 'nav'}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
        <button className="cart-nav-button" type="button" aria-label="Cart coming soon" title="Cart coming soon">
          <FiShoppingBag aria-hidden="true" />
          <span>0</span>
        </button>
        {user ? (
          <div className="account-nav">
            <span>{user.name || user.email}</span>
            <button className="text-button" type="button" onClick={logout}>
              <FiLogOut aria-hidden="true" /> Logout
            </button>
          </div>
        ) : (
          <NavLink className="nav-cta" to="/login" onClick={() => setOpen(false)}>
            Login
          </NavLink>
        )}
      </nav>
    </header>
  )
}

function readSession() {
  return {
    user: getStoredUser(),
    restaurant: getStoredRestaurant(),
  }
}

export default Header
