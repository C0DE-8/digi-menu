import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiMapPin, FiMinus, FiPhone, FiPlus, FiSearch, FiShare2, FiShoppingBag, FiTrash2, FiX } from 'react-icons/fi'
import api from '../../api/client'
import { resolveAssetUrl } from '../../api/assets'
import MenuItemCard from '../../components/MenuItemCard'
import SkeletonPage from '../../components/SkeletonPage'
import { getMenuFallback } from '../../data/demoMenu'

function PublicMenu() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [cart, setCart] = useState(() => readCart(slug))

  useEffect(() => {
    let active = true

    api
      .get(`/public/menu/${slug}`)
      .then((response) => {
        if (active) {
          setData(response.data)
          setUsingFallback(false)
        }
      })
      .catch(() => {
        const fallback = getMenuFallback(slug)
        if (active && fallback) {
          setData(fallback)
          setUsingFallback(true)
        } else if (active) {
          setData(null)
          setUsingFallback(false)
        }
      })

    return () => {
      active = false
    }
  }, [slug])

  useEffect(() => {
    const timeout = window.setTimeout(() => setCart(readCart(slug)), 0)
    return () => window.clearTimeout(timeout)
  }, [slug])

  useEffect(() => {
    localStorage.setItem(cartKey(slug), JSON.stringify(cart))
    window.dispatchEvent(new Event('raviMenuCartChanged'))
  }, [cart, slug])

  const items = useMemo(() => {
    if (!data) return []
    return data.items.filter((item) => {
      const matchesCategory = category === 'all' || item.category_id === Number(category)
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase())
      return matchesCategory && matchesQuery
    })
  }, [data, query, category])

  async function track(item) {
    setSelectedItem(item)
    if (usingFallback) return
    await api.post(`/public/menu/${slug}/events`, { event_type: 'item_view', menu_item_id: item.id, category_id: item.category_id }).catch(() => {})
  }

  function addToCart(item) {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.menu_item_id === item.id)
      if (existing) {
        return current.map((cartItem) => cartItem.menu_item_id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem)
      }
      return [
        ...current,
        {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image_url: item.image_url,
        },
      ]
    })
  }

  function updateCartItem(menuItemId, quantity) {
    setCart((current) => current.flatMap((item) => {
      if (item.menu_item_id !== menuItemId) return [item]
      if (quantity <= 0) return []
      return [{ ...item, quantity }]
    }))
  }

  if (!data) return <SkeletonPage variant="menu" />

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0)
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main className="public-menu">
      <section className="menu-hero" style={{ backgroundImage: `url(${resolveAssetUrl(data.restaurant.cover_url)})` }}>
        <div>
          <img src={resolveAssetUrl(data.restaurant.logo_url)} alt={`${data.restaurant.name} logo`} />
          <p className="eyebrow">Digital menu</p>
          <h1>{data.restaurant.name}</h1>
          <p>{data.restaurant.description}</p>
          <div className="menu-actions">
            <a href={`tel:${data.restaurant.phone}`}><FiPhone /> Call</a>
            <a href={`https://wa.me/${String(data.restaurant.whatsapp).replace(/\D/g, '')}`}><FiShare2 /> WhatsApp</a>
            <a href={data.restaurant.google_maps_url}><FiMapPin /> Directions</a>
          </div>
        </div>
      </section>
      <section className="menu-browser">
        {usingFallback ? <p className="fallback-note">Showing the saved demo menu while live data reconnects.</p> : null}
        <div className="search-row">
          <FiSearch />
          <input placeholder="Search meals, drinks, categories" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="category-tabs">
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>All</button>
          {data.categories.map((item) => (
            <button className={category === String(item.id) ? 'active' : ''} key={item.id} onClick={() => setCategory(String(item.id))}>
              {item.name}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {items.map((item) => (
            <MenuItemCard item={item} key={item.id} onAddToCart={addToCart} onView={track} />
          ))}
        </div>
      </section>
      <aside className="menu-cart-panel" aria-label="Cart">
        <div className="cart-title-row">
          <span><FiShoppingBag /> Cart</span>
          <strong>{cartQuantity} item{cartQuantity === 1 ? '' : 's'}</strong>
        </div>
        {cart.length ? (
          <>
            <div className="cart-line-list">
              {cart.map((item) => (
                <div className="cart-line-item" key={item.menu_item_id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>₦{Number(item.price || 0).toLocaleString()}</small>
                  </div>
                  <div className="quantity-stepper">
                    <button type="button" onClick={() => updateCartItem(item.menu_item_id, item.quantity - 1)} aria-label={`Remove one ${item.name}`}>
                      {item.quantity === 1 ? <FiTrash2 /> : <FiMinus />}
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => updateCartItem(item.menu_item_id, item.quantity + 1)} aria-label={`Add one ${item.name}`}>
                      <FiPlus />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-total-row">
              <span>Total</span>
              <strong>₦{cartTotal.toLocaleString()}</strong>
            </div>
            <Link className="primary-button full" to={`/checkout/${data.restaurant.slug}`}>Checkout</Link>
          </>
        ) : (
          <p className="muted-line">Add meals from the menu to start an order.</p>
        )}
      </aside>
      {selectedItem ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedItem(null)}>
          <article className="item-detail-modal" role="dialog" aria-modal="true" aria-label={selectedItem.name} onClick={(event) => event.stopPropagation()}>
            <button className="icon-button modal-close" type="button" onClick={() => setSelectedItem(null)} aria-label="Close item details">
              <FiX />
            </button>
            <img src={resolveAssetUrl(selectedItem.image_url)} alt={selectedItem.name} />
            <div>
              <p className="eyebrow">Menu item</p>
              <h2>{selectedItem.name}</h2>
              <p>{selectedItem.description}</p>
              <div className="badges">
                {selectedItem.availability ? <span>{selectedItem.availability.replaceAll('_', ' ')}</span> : null}
                {selectedItem.is_popular ? <span>Popular</span> : null}
                {selectedItem.is_new ? <span>New</span> : null}
                {selectedItem.is_spicy ? <span>Spicy</span> : null}
              </div>
              {selectedItem.ingredients ? <p><strong>Ingredients:</strong> {selectedItem.ingredients}</p> : null}
              {selectedItem.calories ? <p><strong>Calories:</strong> {selectedItem.calories}</p> : null}
            </div>
          </article>
        </div>
      ) : null}
    </main>
  )
}

function cartKey(slug) {
  return `raviMenuCart:${slug}`
}

function readCart(slug) {
  try {
    const saved = localStorage.getItem(cartKey(slug))
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export default PublicMenu
