import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiBarChart2, FiMapPin, FiSearch, FiSmartphone } from 'react-icons/fi'
import api from '../../api/client'
import { resolveAssetUrl } from '../../api/assets'
import StatCard from '../../components/StatCard'

const fallbackRestaurants = [
  {
    name: '8am Light Kitchen',
    slug: '8am-light-kitchen',
    plan: 'professional',
    cover_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
    description: 'Fresh Nigerian meals, grills, drinks, and quick lunch plates for busy teams and families.',
    address: 'Lekki Phase 1, Lagos',
    category_count: 4,
    item_count: 8,
  },
  {
    name: 'Lola Cafe',
    slug: 'lola-cafe',
    plan: 'professional',
    cover_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    description: 'Cafe plates, fresh pastries, espresso drinks, and easy brunch for casual meetings.',
    address: 'Victoria Island, Lagos',
    category_count: 4,
    item_count: 8,
  },
  {
    name: 'Suya Street Grill',
    slug: 'suya-street-grill',
    plan: 'starter',
    cover_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80',
    description: 'Open-flame suya, grilled fish, sharable sides, and cold drinks.',
    address: 'Ikeja, Lagos',
    category_count: 4,
    item_count: 8,
  },
  {
    name: 'Bistro Mainland',
    slug: 'bistro-mainland',
    plan: 'professional',
    cover_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
    description: 'Modern Nigerian bistro with rice bowls, soups, grills, and family platters.',
    address: 'Yaba, Lagos',
    category_count: 4,
    item_count: 8,
  },
  {
    name: 'Ocean Pearl Seafood',
    slug: 'ocean-pearl-seafood',
    plan: 'enterprise',
    cover_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80',
    description: 'Seafood bowls, pepper soup, grilled fish, and coastal platters.',
    address: 'Lekki Phase 1, Lagos',
    category_count: 4,
    item_count: 8,
  },
  {
    name: 'Green Bowl Lagos',
    slug: 'green-bowl-lagos',
    plan: 'starter',
    cover_url: 'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=900&q=80',
    description: 'Healthy bowls, smoothies, wraps, and vegetarian-friendly daily specials.',
    address: 'Lekki Phase 1, Lagos',
    category_count: 4,
    item_count: 8,
  },
  {
    name: 'Mama Ada Kitchen',
    slug: 'mama-ada-kitchen',
    plan: 'professional',
    cover_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    description: 'Homestyle soups, swallow, rice dishes, and party trays for families.',
    address: 'Ikeja, Lagos',
    category_count: 4,
    item_count: 8,
  },
]

function Home() {
  const [restaurants, setRestaurants] = useState(fallbackRestaurants)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      setLoading(true)
      api
        .get('/public/restaurants', { params: query.trim() ? { search: query.trim() } : undefined })
        .then((response) => {
          if (active) {
            setRestaurants(response.data.restaurants || [])
            setUsingFallback(false)
          }
        })
        .catch(() => {
          if (active) {
            setRestaurants(fallbackRestaurants)
            setUsingFallback(true)
          }
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [query])

  const filteredRestaurants = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!usingFallback || !value) return restaurants
    return restaurants.filter((restaurant) =>
      [restaurant.name, restaurant.description, restaurant.address].some((field) => String(field || '').toLowerCase().includes(value)),
    )
  }, [query, restaurants, usingFallback])

  return (
    <main>
      <section className="hero-section">
        <div className="hero-media" aria-hidden="true"></div>
        <div className="hero-copy">
          <p className="eyebrow">Restaurant directory and digital menus</p>
          <h1>Digi Menu</h1>
          <p>
            Find restaurants on the platform, open their live menus, and let each business manage meals, QR codes, analytics,
            and subscription-ready operations from one system.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#restaurants">
              Browse restaurants <FiArrowRight aria-hidden="true" />
            </a>
            <Link className="secondary-button" to="/login">Restaurant login</Link>
          </div>
        </div>
      </section>

      <section className="band" id="restaurants">
        <div className="section-heading">
          <p className="eyebrow">Live restaurant menus</p>
          <h2>Search restaurants already on Digi Menu</h2>
        </div>
        <div className="restaurant-search">
          <FiSearch aria-hidden="true" />
          <input
            aria-label="Search restaurants"
            placeholder="Search by restaurant, food, or location"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="restaurant-grid">
          {filteredRestaurants.map((restaurant) => (
            <Link className="restaurant-card" key={restaurant.slug} to={`/menu/${restaurant.slug}`}>
              <img src={resolveAssetUrl(restaurant.cover_url)} alt="" />
              <div>
                <div className="restaurant-card-title">
                  <h3>{restaurant.name}</h3>
                  <span>{restaurant.plan}</span>
                </div>
                <p>{restaurant.description}</p>
                <small>
                  <FiMapPin aria-hidden="true" /> {restaurant.address}
                </small>
                <strong>{Number(restaurant.item_count || 0)} menu items</strong>
              </div>
            </Link>
          ))}
        </div>
        {!filteredRestaurants.length && !loading ? <p className="empty-state">No restaurants match that search yet.</p> : null}
        {loading ? <p className="directory-note">Loading the latest restaurant list...</p> : null}
      </section>

      <section className="band platform-band">
        <div className="section-heading">
          <p className="eyebrow">Platform tools</p>
          <h2>Built for restaurants that update menus often</h2>
        </div>
        <div className="feature-grid">
          <StatCard icon={<FiSmartphone />} label="Customer menus" value="QR ready" tone="green" />
          <StatCard icon={<FiSearch />} label="Discovery" value="Searchable" tone="blue" />
          <StatCard icon={<FiBarChart2 />} label="Analytics" value="Live events" tone="orange" />
        </div>
      </section>
    </main>
  )
}

export default Home
