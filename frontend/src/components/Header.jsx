import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiGrid, FiLogOut } from 'react-icons/fi'
import { clearSession, getStoredUser } from '../api/client'

function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const user = getStoredUser()

  const links = user
    ? user.role === 'super_admin'
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
          { to: '/menu/8am-light-kitchen', label: 'Public menu' },
        ]
    : [
        { to: '/', label: 'Home' },
        { to: '/#restaurants', label: 'Restaurants' },
      ]

  function logout() {
    clearSession()
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
        {user ? (
          <button className="text-button" type="button" onClick={logout}>
            <FiLogOut aria-hidden="true" /> Logout
          </button>
        ) : (
          <NavLink className="nav-cta" to="/login" onClick={() => setOpen(false)}>
            Login
          </NavLink>
        )}
      </nav>
    </header>
  )
}

export default Header
