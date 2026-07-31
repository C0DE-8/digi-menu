import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowRight, FiClock, FiMapPin, FiPhone, FiShoppingBag } from 'react-icons/fi'
import api from '../../api/client'
import { resolveAssetUrl } from '../../api/assets'
import MenuItemCard from '../../components/MenuItemCard'
import SkeletonPage from '../../components/SkeletonPage'

function RestaurantDetail() {
  const { slug } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    api
      .get(`/public/restaurants/${slug}`)
      .then((response) => {
        if (active) setData(response.data)
      })
      .catch(() => {
        if (active) setData(null)
      })

    return () => {
      active = false
    }
  }, [slug])

  if (!data) return <SkeletonPage />

  const { restaurant } = data

  return (
    <main className="restaurant-detail-page">
      <section className="restaurant-detail-hero" style={{ backgroundImage: `url(${resolveAssetUrl(restaurant.cover_url)})` }}>
        <div>
          <img src={resolveAssetUrl(restaurant.logo_url)} alt={`${restaurant.name} logo`} />
          <span className={restaurant.is_open ? 'status-pill approved' : 'status-pill rejected'}>
            {restaurant.is_open ? 'Open now' : 'Closed'}
          </span>
          <h1>{restaurant.name}</h1>
          <p>{restaurant.description}</p>
          <div className="detail-meta-row">
            <span><FiMapPin /> {restaurant.service_area || restaurant.address}</span>
            <span><FiClock /> {restaurant.estimated_delivery_minutes || 35} min</span>
            <span><FiShoppingBag /> {data.stats.itemCount || 0} items</span>
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to={`/menu/${restaurant.slug}`}>
              Open menu <FiArrowRight />
            </Link>
            <a className="secondary-button" href={`tel:${restaurant.phone}`}>
              <FiPhone /> Call
            </a>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <div className="market-heading">
          <div>
            <p className="eyebrow">Popular picks</p>
            <h2>Start from the customer favourites</h2>
          </div>
          <Link className="secondary-button" to={`/menu/${restaurant.slug}`}>View full menu</Link>
        </div>
        <div className="menu-grid">
          {data.popularItems.map((item) => (
            <MenuItemCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default RestaurantDetail
