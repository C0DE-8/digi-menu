import { FiClock } from 'react-icons/fi'

function formatNaira(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value || 0)
}

function MenuItemCard({ item, onView }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80'

  return (
    <article className="menu-item-card" onClick={() => onView?.(item)}>
      <img
        src={item.image_url || fallbackImage}
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
        </div>
        <small>
          <FiClock aria-hidden="true" /> {item.prep_time || 'Ready soon'}
        </small>
      </div>
    </article>
  )
}

export default MenuItemCard
