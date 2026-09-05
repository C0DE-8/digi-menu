import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

export default function Footer() {
  return <footer className="footer"><div><Link to="/"><img className="footer-logo" src={logo} alt="Ravi Menu" /></Link><p>Good food is closer than you think.</p></div><nav aria-label="Footer navigation"><Link to="/#restaurants">Find food</Link><Link to="/register">For restaurants</Link><Link to="/login">Sign in</Link></nav><small>© {new Date().getFullYear()} Ravi Menu</small></footer>
}
