import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiMapPin,
  FiMinus,
  FiSearch,
  FiShoppingBag,
  FiSmartphone,
  FiStar,
  FiTruck,
  FiX,
} from 'react-icons/fi'
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
    service_area: 'Lekki',
    is_open: 1,
    estimated_delivery_minutes: 25,
    cuisine_tags: ['Rice', 'Grills', 'Drinks'],
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
    service_area: 'Victoria Island',
    is_open: 1,
    estimated_delivery_minutes: 30,
    cuisine_tags: ['Cafe', 'Breakfast', 'Pastries'],
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
    service_area: 'Ikeja',
    is_open: 1,
    estimated_delivery_minutes: 35,
    cuisine_tags: ['Grills', 'Suya'],
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
    service_area: 'Yaba',
    is_open: 1,
    estimated_delivery_minutes: 40,
    cuisine_tags: ['Rice', 'Grills'],
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
    service_area: 'Lekki',
    is_open: 0,
    estimated_delivery_minutes: 25,
    cuisine_tags: ['Seafood', 'Grills'],
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
    service_area: 'Lekki',
    is_open: 1,
    estimated_delivery_minutes: 25,
    cuisine_tags: ['Healthy', 'Salad'],
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
    service_area: 'Ikeja',
    is_open: 1,
    estimated_delivery_minutes: 35,
    cuisine_tags: ['Rice', 'Soups'],
    category_count: 4,
    item_count: 8,
  },
]

const cuisineFilters = ['Rice', 'Breakfast', 'Grills', 'Cafe', 'Seafood', 'Healthy', 'Pastries']
const areaFilters = ['All areas', 'Lekki', 'Victoria Island', 'Ikeja', 'Yaba']

const heroHeadlines = ['You don see menu?', 'Find food fast.', 'Scan. Browse. Chow.', 'Your next meal is close.']

const cartPreviewItems = [
  { name: 'Smoky Party Jollof', restaurant: '8am Light Kitchen', price: 6800, quantity: 1 },
  { name: 'Iced Caramel Latte', restaurant: 'Lola Cafe', price: 4200, quantity: 2 },
]

function Home() {
  const [restaurants, setRestaurants] = useState(fallbackRestaurants)
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('All areas')
  const [cuisine, setCuisine] = useState('')
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const [cookieVisible, setCookieVisible] = useState(() => !localStorage.getItem('digiMenuCookieConsent'))
  const [headlineIndex, setHeadlineIndex] = useState(0)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const interval = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % heroHeadlines.length)
    }, 5200)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(() => {
      setLoading(true)
      api
        .get('/public/restaurants', {
          params: {
            ...(query.trim() ? { search: query.trim() } : {}),
            ...(area !== 'All areas' ? { area } : {}),
            ...(cuisine ? { cuisine } : {}),
          },
        })
        .then((response) => {
          if (active) {
            setRestaurants(mergeRestaurants(response.data.restaurants || [], { query, area, cuisine }))
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
  }, [area, cuisine, query])

  const filteredRestaurants = useMemo(() => {
    if (!usingFallback) return restaurants
    return restaurants.filter((restaurant) => matchesRestaurantFilters(restaurant, { query, area, cuisine }))
  }, [area, cuisine, query, restaurants, usingFallback])

  const featuredRestaurants = filteredRestaurants.slice(0, 6)
  const cartTotal = cartPreviewItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  function acceptCookies() {
    localStorage.setItem('digiMenuCookieConsent', 'accepted')
    setCookieVisible(false)
  }

  function rejectCookies() {
    localStorage.setItem('digiMenuCookieConsent', 'rejected')
    setCookieVisible(false)
  }

  return (
    <main className="landing-page">
      <section className="food-hero">
        <div className="food-hero-copy">
          <p className="eyebrow">Food discovery and digital menus</p>
          <h1 className="animated-headline" aria-live="polite">
            <span key={heroHeadlines[headlineIndex]}>{heroHeadlines[headlineIndex]}</span>
          </h1>
          <p>
            Browse restaurants, discover meals, preview your basket, and open live menus from food businesses already using
            Digi Menu.
          </p>
          <div className="location-search">
            <FiMapPin aria-hidden="true" />
            <input placeholder="Enter your area or search meals" value={query} onChange={(event) => setQuery(event.target.value)} />
            <a href="#restaurants">
              Find food <FiArrowRight aria-hidden="true" />
            </a>
          </div>
          <div className="cuisine-strip" aria-label="Popular searches">
            {cuisineFilters.map((filter) => (
              <button className={cuisine === filter ? 'active' : ''} key={filter} type="button" onClick={() => setCuisine(cuisine === filter ? '' : filter)}>
                {filter}
              </button>
            ))}
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to="/store/sign-up">Create customer account</Link>
            <Link className="primary-button" to="/register">Start selling</Link>
            <a className="secondary-button" href="#restaurants">Explore restaurants</a>
          </div>
        </div>
        <div className="food-hero-board" aria-label="Featured meals and cart preview">
          <article className="meal-showcase main-meal">
            <img src="https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80" alt="Featured Nigerian meal" />
            <div>
              <span><FiStar /> Popular today</span>
              <h2>Jollof, grills, cafe plates and more</h2>
              <p>Customer ordering is coming next. For now, carts help shape the flow.</p>
            </div>
          </article>
          <article className="mini-meal top">
            <img src="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80" alt="Brunch plate" />
            <strong>Brunch</strong>
          </article>
          <article className="mini-meal bottom">
            <img src="https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=400&q=80" alt="Grilled skewers" />
            <strong>Grills</strong>
          </article>
          <article className="floating-cart">
            <div className="cart-title-row">
              <span><FiShoppingBag /> Cart preview</span>
              <strong>Coming soon</strong>
            </div>
            {cartPreviewItems.map((item) => (
              <div className="cart-preview-row" key={item.name}>
                <button type="button" aria-label="Decrease quantity"><FiMinus /></button>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.restaurant}</small>
                </div>
                <span>{item.quantity}x</span>
              </div>
            ))}
            <div className="cart-total-row">
              <span>Total</span>
              <strong>₦{cartTotal.toLocaleString()}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="landing-band quick-actions">
        <article>
          <FiSearch />
          <h2>Search meals</h2>
          <p>Find restaurants by name, food, or location.</p>
        </article>
        <article>
          <FiShoppingBag />
          <h2>Build a cart</h2>
          <p>Cart UI is ready for the ordering phase.</p>
        </article>
        <article>
          <FiTruck />
          <h2>Pickup or delivery</h2>
          <p>Delivery flow is planned for the next product stage.</p>
        </article>
      </section>

      <section className="landing-band restaurant-market" id="restaurants">
        <div className="market-heading">
          <div>
            <p className="eyebrow">Restaurants near the platform</p>
            <h2>Order-ready menus, built for discovery</h2>
            <div className="area-filter-row" aria-label="Filter by area">
              {areaFilters.map((item) => (
                <button className={area === item ? 'active' : ''} key={item} type="button" onClick={() => setArea(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="restaurant-search compact-search">
            <FiSearch aria-hidden="true" />
            <input
              aria-label="Search restaurants"
              placeholder="Search restaurant, food, or location"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="restaurant-grid">
          {featuredRestaurants.map((restaurant) => (
            <Link className="restaurant-card" key={restaurant.slug} to={`/restaurants/${restaurant.slug}`}>
              <img src={resolveAssetUrl(restaurant.cover_url)} alt="" />
              <div>
                <div className="restaurant-card-title">
                  <h3>{restaurant.name}</h3>
                  <span className={restaurant.is_open ? 'open-status' : 'closed-status'}>{restaurant.is_open ? 'Open' : 'Closed'}</span>
                </div>
                <p>{restaurant.description}</p>
                <small>
                  <FiMapPin aria-hidden="true" /> {restaurant.service_area || restaurant.address} · {restaurant.estimated_delivery_minutes || 35} min
                </small>
                <div className="restaurant-meta-row">
                  <strong>{Number(restaurant.item_count || 0)} menu items</strong>
                  <span><FiShoppingBag /> Add later</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {!filteredRestaurants.length && !loading ? <p className="empty-state">No restaurants match that search yet.</p> : null}
        {loading ? <p className="directory-note">Loading the latest restaurant list...</p> : null}
      </section>

      <section className="landing-band seller-band">
        <div>
          <p className="eyebrow">Join our growing network</p>
          <h2>Own a restaurant, cafe, bakery, lounge, or cloud kitchen?</h2>
          <p>Create a digital menu, upload food photos, print QR codes, and get ready for ordering.</p>
        </div>
        <Link className="primary-button" to="/register">
          Start selling <FiArrowRight />
        </Link>
      </section>

      <section className="landing-band platform-band">
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
      {cookieVisible ? (
        <aside className="cookie-banner" aria-label="Cookie notice">
          <button className="icon-button" type="button" onClick={rejectCookies} aria-label="Reject cookies and close notice">
            <FiX />
          </button>
          <div>
            <span><FiCheck /> Cookies</span>
            <p>We use cookies to keep sessions working and understand how restaurants and customers use Digi Menu.</p>
          </div>
          <div className="cookie-actions">
            <button className="secondary-button" type="button" onClick={rejectCookies}>Reject</button>
            <button className="primary-button" type="button" onClick={acceptCookies}>Accept</button>
          </div>
        </aside>
      ) : null}
    </main>
  )
}

function mergeRestaurants(liveRestaurants, filters) {
  const visibleFallbacks = fallbackRestaurants.filter((restaurant) => matchesRestaurantFilters(restaurant, filters))
  const bySlug = new Map(visibleFallbacks.map((restaurant) => [restaurant.slug, restaurant]))

  for (const restaurant of liveRestaurants) {
    bySlug.set(restaurant.slug, restaurant)
  }

  return [...bySlug.values()].sort((first, second) => first.name.localeCompare(second.name))
}

function matchesRestaurantFilters(restaurant, { query, area, cuisine }) {
  const value = query.trim().toLowerCase()
  const matchesQuery = !value || [restaurant.name, restaurant.description, restaurant.address].some((field) => String(field || '').toLowerCase().includes(value))
  const matchesArea = area === 'All areas' || String(restaurant.service_area || restaurant.address || '').toLowerCase().includes(area.toLowerCase())
  const tags = restaurant.cuisine_tags || []
  const matchesCuisine = !cuisine || tags.some((tag) => String(tag).toLowerCase().includes(cuisine.toLowerCase()))
  return matchesQuery && matchesArea && matchesCuisine
}

export default Home
