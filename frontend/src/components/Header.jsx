import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiLogOut, FiShoppingBag } from 'react-icons/fi'
import { clearSession, getStoredRestaurant, getStoredUser } from '../api/client'
import logo from '../assets/logo.png'

function Header() {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
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
        <img className="brand-logo" src={logo} alt="Ravi Menu" />
      </Link>
      <button className="icon-button mobile-only" type="button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
        {open ? <FiX /> : <FiMenu />}
      </button>
      <nav className={open ? 'nav open' : 'nav'}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
        <button className="cart-nav-button" type="button" aria-label="Cart" aria-expanded={cartOpen} onClick={() => setCartOpen(!cartOpen)}>
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
      {cartOpen ? <aside className="cart-popover" aria-label="Your baskets"><h2>Your baskets</h2>{readCarts().length ? readCarts().map(({ slug, count }) => <Link key={slug} to={`/checkout/${slug}`} onClick={() => { setCartOpen(false); setOpen(false) }}><span>{slug.replaceAll("-", " ")}</span><strong>{count} items →</strong></Link>) : <p>Your basket is waiting for something delicious. Explore a restaurant menu to get started.</p>}<button className="text-button" onClick={() => setCartOpen(false)}>Close</button></aside> : null}
    </header>
  )
}

function readCarts() {
  return Object.keys(localStorage).filter((key) => key.startsWith("raviMenuCart:")).flatMap((key) => {
    try { const items = JSON.parse(localStorage.getItem(key)); const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0); return count > 0 ? [{ slug: key.slice("raviMenuCart:".length), count }] : [] } catch { return [] }
  })
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
