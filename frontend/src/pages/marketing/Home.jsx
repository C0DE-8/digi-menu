import { Link } from 'react-router-dom'
import { FiArrowRight, FiBarChart2, FiCreditCard, FiSmartphone } from 'react-icons/fi'
import StatCard from '../../components/StatCard'

function Home() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-media" aria-hidden="true"></div>
        <div className="hero-copy">
          <p className="eyebrow">Restaurant digital menu platform</p>
          <h1>Digi Menu</h1>
          <p>
            Launch a polished restaurant menu, QR code, and management dashboard for food businesses that need fast updates,
            customer-ready browsing, and subscription-ready operations.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/login">
              Open dashboard <FiArrowRight aria-hidden="true" />
            </Link>
            <Link className="secondary-button" to="/menu/8am-light-kitchen">
              View demo menu
            </Link>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="section-heading">
          <p className="eyebrow">Built from the PRD</p>
          <h2>Restaurant operations, starting with the digital menu</h2>
        </div>
        <div className="feature-grid">
          <StatCard icon={<FiSmartphone />} label="Customer menu" value="Responsive" tone="green" />
          <StatCard icon={<FiBarChart2 />} label="Analytics" value="Live events" tone="blue" />
          <StatCard icon={<FiCreditCard />} label="Subscription" value="Plans + invoices" tone="orange" />
        </div>
      </section>
    </main>
  )
}

export default Home
