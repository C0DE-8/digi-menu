import { FiClock } from 'react-icons/fi'
import { resolveAssetUrl } from '../api/assets'

function formatNaira(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0)
}

function formatPrepTime(value) {
  const text = String(value || '').trim()
  if (!text) return 'Ready soon'
  if (/\bmin\b/i.test(text)) return text
  return `${text} min`
}

function availabilityLabel(value) {
  return {
    out_of_stock: 'Out of stock',
    seasonal: 'Seasonal',
    coming_soon: 'Coming soon',
  }[value]
}

function MenuItemCard({ item, onAddToCart, onView }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'

  return (
    <article className="menu-item-card" onClick={() => onView?.(item)}>
      <img
        src={resolveAssetUrl(item.image_url) || fallbackImage}
        alt={item.name}
        onError={(event) => {
          event.currentTarget.src = fallbackImage
        }}
      />
      <div>
        <div className="item-title-row">
          <h3>{item.name}</h3>
          <strong>{formatNaira(item.price)}</strong>
        </div>
        <p>{item.description}</p>
        <div className="badges">
          {item.is_popular ? <span>Popular</span> : null}
          {item.is_new ? <span>New</span> : null}
          {item.is_spicy ? <span>Spicy</span> : null}
          {item.is_halal ? <span>Halal</span> : null}
          {availabilityLabel(item.availability) ? <span>{availabilityLabel(item.availability)}</span> : null}
        </div>
        <small>
          <FiClock aria-hidden="true" /> {formatPrepTime(item.prep_time)}
        </small>
        {onAddToCart ? (
          <button
            className="secondary-button full item-cart-button"
            type="button"
            disabled={!['available', 'seasonal'].includes(item.availability || 'available')}
            onClick={(event) => {
              event.stopPropagation()
              onAddToCart(item)
            }}
          >
            Add to cart
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default MenuItemCard
