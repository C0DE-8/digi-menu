import logo from '../assets/logo.png'

function Footer() {
  return (
    <footer className="footer">
      <span>
        <img className="footer-logo" src={logo} alt="Ravi Menu" />
      </span>
      <span>Digital menus, QR links, analytics, and restaurant operations.</span>
    </footer>
  )
}

export default Footer
