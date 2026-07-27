import { useLocation } from 'react-router-dom'

function PageTransitionLoader() {
  const location = useLocation()

  return (
    <div className="page-loader" role="status" aria-live="polite" aria-label="Loading page" key={location.pathname}>
      <div className="page-loader-card">
        <div className="loader-mark">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <strong>Digi Menu</strong>
      </div>
    </div>
  )
}

export default PageTransitionLoader
