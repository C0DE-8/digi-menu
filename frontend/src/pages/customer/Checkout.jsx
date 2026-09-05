import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowRight, FiLoader, FiMapPin, FiMessageCircle, FiShoppingBag, FiTruck } from 'react-icons/fi'
import api, { getStoredUser } from '../../api/client'

function Checkout() {
  const { slug } = useParams()
  const [cart, setCart] = useState(() => readCart(slug))
  const [restaurant, setRestaurant] = useState(null)
  const [fulfillmentType, setFulfillmentType] = useState('pickup')
  const [customer, setCustomer] = useState(() => {
    const user = getStoredUser()
    return {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      delivery_address: '',
    }
  })
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => setCart(readCart(slug)), 0)
    api.get(`/public/restaurants/${slug}`).then((response) => setRestaurant(response.data.restaurant)).catch(() => setRestaurant(null))
    return () => window.clearTimeout(timeout)
  }, [slug])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0), [cart])
  const deliveryFee = fulfillmentType === 'delivery' ? 1000 : 0
  const total = subtotal + deliveryFee

  function updateCustomer(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post(`/public/restaurants/${slug}/orders`, {
        fulfillment_type: fulfillmentType,
        delivery_fee: deliveryFee,
        customer,
        notes,
        items: cart,
      })
      setCreatedOrder(response.data.order)
      localStorage.removeItem(cartKey(slug))
      window.dispatchEvent(new Event('raviMenuCartChanged'))
    } catch (orderError) {
      setError(orderError.response?.data?.error || 'Could not create this order.')
    } finally {
      setLoading(false)
    }
  }

  if (createdOrder) {
    return (
      <main className="page-shell checkout-page">
        <section className="panel checkout-success">
          <p className="eyebrow">Order created</p>
          <h1>{createdOrder.order_number}</h1>
          <p>Your order has been sent into Ravi Menu. Confirm your order and arrange payment with the restaurant on WhatsApp.</p>
          <div className="hero-actions">
            <a className="primary-button" href={createdOrder.whatsapp_url} target="_blank" rel="noreferrer">
              <FiMessageCircle /> Confirm on WhatsApp
            </a>
            <Link className="secondary-button" to={`/menu/${slug}`}>Back to menu</Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell checkout-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>{restaurant?.name || 'Your order'}</h1>
        </div>
        <Link className="secondary-button" to={`/menu/${slug}`}>Back to menu</Link>
      </div>

      <form className="checkout-layout" onSubmit={submit}>
        <section className="panel checkout-form-panel">
          <h2>Customer details</h2>
          <div className="segmented-control">
            <button className={fulfillmentType === 'pickup' ? 'active' : ''} type="button" onClick={() => setFulfillmentType('pickup')}>
              <FiShoppingBag /> Pickup
            </button>
            <button className={fulfillmentType === 'delivery' ? 'active' : ''} type="button" onClick={() => setFulfillmentType('delivery')}>
              <FiTruck /> Delivery
            </button>
          </div>
          <label>
            <span>Name</span>
            <input value={customer.name} onChange={(event) => updateCustomer('name', event.target.value)} required />
          </label>
          <label>
            <span>Phone</span>
            <input value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} />
          </label>
          {fulfillmentType === 'delivery' ? (
            <label>
              <span>Delivery address</span>
              <textarea value={customer.delivery_address} onChange={(event) => updateCustomer('delivery_address', event.target.value)} required />
            </label>
          ) : (
            <p className="delivery-note"><FiMapPin /> Pickup from {restaurant?.address || 'the restaurant location'}.</p>
          )}
          <label>
            <span>Order notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button full" type="submit" disabled={!cart.length || loading}>
            {loading ? <FiLoader className="spin" /> : null}
            Place order <FiArrowRight />
          </button>
        </section>

        <aside className="panel order-summary-panel">
          <h2>Order summary</h2>
          {cart.length ? cart.map((item) => (
            <div className="summary-line" key={item.menu_item_id}>
              <span>{item.quantity}x {item.name}</span>
              <strong>₦{(Number(item.price || 0) * item.quantity).toLocaleString()}</strong>
            </div>
          )) : <p className="muted-line">Your cart is empty.</p>}
          <div className="summary-line">
            <span>Subtotal</span>
            <strong>₦{subtotal.toLocaleString()}</strong>
          </div>
          <div className="summary-line">
            <span>Delivery</span>
            <strong>₦{deliveryFee.toLocaleString()}</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>₦{total.toLocaleString()}</strong>
          </div>
          <p className="muted-line">Pay directly to the restaurant. Confirm your order and delivery details on WhatsApp.</p>
        </aside>
      </form>
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

export default Checkout
