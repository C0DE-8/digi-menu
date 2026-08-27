import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiGrid, FiLogOut, FiShoppingBag } from 'react-icons/fi'
import { clearSession, getStoredRestaurant, getStoredUser } from '../api/client'

function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const [session, setSessionState] = useState(() => readSession())
  const [cartCount, setCartCount] = useState(() => readCartCount())
  const { user, restaurant } = session

  useEffect(() => {
    function refreshSession() {
      setSessionState(readSession())
    }
    function refreshCart() {
      setCartCount(readCartCount())
    }

    window.addEventListener('raviMenuSessionChanged', refreshSession)
    window.addEventListener('raviMenuCartChanged', refreshCart)
    window.addEventListener('storage', refreshSession)
    window.addEventListener('storage', refreshCart)
    return () => {
      window.removeEventListener('raviMenuSessionChanged', refreshSession)
      window.removeEventListener('raviMenuCartChanged', refreshCart)
      window.removeEventListener('storage', refreshSession)
      window.removeEventListener('storage', refreshCart)
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
      : user.role === 'admin'
      ? [{ to: '/admin', label: 'Admin' }]
      : [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/menu-builder', label: 'Menu' },
          { to: '/orders', label: 'Orders' },
          { to: '/kitchen', label: 'Kitchen' },
          { to: '/analytics', label: 'Analytics' },
          { to: '/qr-code', label: 'QR' },
          { to: '/subscriptions', label: 'Billing' },
          { to: '/settings', label: 'Settings' },
          ...(restaurant?.slug ? [{ to: `/menu/${restaurant.slug}`, label: 'Public menu' }] : []),
        ]
    : [
        { to: '/', label: 'Home' },
        { to: '/#restaurants', label: 'Restaurants' },
        { to: '/store/sign-up', label: 'Customer sign up' },
        { to: '/register', label: 'Start selling' },
      ]

  function logout() {
    const logoutPath = ['admin', 'super_admin'].includes(user?.role) ? '/admin-lock' : '/login'
    clearSession()
    setSessionState({ user: null, restaurant: null })
    setOpen(false)
    navigate(logoutPath)
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/">
        <FiGrid aria-hidden="true" />
        <span>Ravi Menu</span>
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
        <button className="cart-nav-button" type="button" aria-label="Cart">
          <FiShoppingBag aria-hidden="true" />
          <span>{cartCount}</span>
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

function readCartCount() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith('raviMenuCart:'))
    .reduce((sum, key) => {
      try {
        const items = JSON.parse(localStorage.getItem(key) || '[]')
        return sum + items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0)
      } catch {
        return sum
      }
    }, 0)
}

function readSession() {
  return {
    user: getStoredUser(),
    restaurant: getStoredRestaurant(),
  }
}

export default Header
