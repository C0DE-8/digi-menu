function SkeletonPage({ variant = 'dashboard' }) {
  if (variant === 'menu') {
    return (
      <main className="public-menu">
        <section className="menu-hero skeleton-hero">
          <div>
            <div className="skeleton skeleton-logo"></div>
            <div className="skeleton skeleton-line short"></div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-line wide"></div>
            <div className="skeleton-actions">
              <div className="skeleton skeleton-button"></div>
              <div className="skeleton skeleton-button"></div>
              <div className="skeleton skeleton-button"></div>
            </div>
          </div>
        </section>
        <section className="menu-browser">
          <div className="skeleton skeleton-search"></div>
          <div className="skeleton-tabs">
            <div className="skeleton skeleton-pill"></div>
            <div className="skeleton skeleton-pill"></div>
            <div className="skeleton skeleton-pill"></div>
          </div>
          <SkeletonCards />
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <div className="page-title-row">
        <div className="skeleton-heading">
          <div className="skeleton skeleton-line short"></div>
          <div className="skeleton skeleton-title"></div>
        </div>
        <div className="skeleton skeleton-button"></div>
      </div>
      <div className="feature-grid">
        {[0, 1, 2, 3].map((item) => (
          <article className="stat-card skeleton-card" key={item}>
            <div className="skeleton skeleton-icon"></div>
            <div className="skeleton skeleton-line"></div>
            <div className="skeleton skeleton-value"></div>
          </article>
        ))}
      </div>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="skeleton skeleton-subtitle"></div>
          <div className="skeleton skeleton-block"></div>
        </article>
        <article className="panel">
          <div className="skeleton skeleton-subtitle"></div>
          <div className="skeleton skeleton-block"></div>
        </article>
        <article className="panel wide">
          <div className="skeleton skeleton-subtitle"></div>
          <div className="skeleton skeleton-row"></div>
          <div className="skeleton skeleton-row"></div>
          <div className="skeleton skeleton-row"></div>
        </article>
      </section>
    </main>
  )
}

function SkeletonCards() {
  return (
    <div className="menu-grid">
      {[0, 1, 2, 3].map((item) => (
        <article className="menu-item-card skeleton-card" key={item}>
          <div className="skeleton skeleton-image"></div>
          <div>
            <div className="skeleton skeleton-subtitle"></div>
            <div className="skeleton skeleton-line wide"></div>
            <div className="skeleton skeleton-line"></div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default SkeletonPage
