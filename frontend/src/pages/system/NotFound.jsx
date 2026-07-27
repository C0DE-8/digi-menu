import { Link } from 'react-router-dom'
import { FiArrowLeft, FiSearch } from 'react-icons/fi'

function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-panel">
        <div className="not-found-icon">
          <FiSearch aria-hidden="true" />
        </div>
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <div className="hero-actions">
          <Link className="primary-button" to="/">
            <FiArrowLeft aria-hidden="true" /> Back home
          </Link>
          <Link className="secondary-button" to="/menu/8am-light-kitchen">
            View demo menu
          </Link>
        </div>
      </section>
    </main>
  )
}

export default NotFound
