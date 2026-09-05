import { useEffect, useState } from 'react'
import { FiCheckCircle, FiClock, FiRefreshCw, FiTruck } from 'react-icons/fi'
import api from '../../api/client'
import LoadError from '../../components/LoadError'
import SkeletonPage from '../../components/SkeletonPage'

const statusFlow = ['pending', 'accepted', 'preparing', 'ready', 'completed']

function Orders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try { const response = await api.get('/orders'); setOrders(response.data.orders || []) } catch { setError(true) }
  }

  async function updateStatus(order, status) {
    setUpdatingId(order.id)
    try {
      const response = await api.patch(`/orders/${order.id}/status`, { status })
      setOrders((current) => current.map((item) => item.id === order.id ? response.data.order : item))
    } catch { setError(true) } finally {
      setUpdatingId(null)
    }
  }

  if (error) return <LoadError />
  if (!orders) return <SkeletonPage />

  return (
    <main className="page-shell">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Orders</p>
          <h1>Restaurant orders</h1>
        </div>
        <button className="secondary-button" type="button" onClick={loadOrders}><FiRefreshCw /> Refresh</button>
      </div>
      <section className="order-list">
        {orders.map((order) => (
          <article className="panel order-card" key={order.id}>
            <div className="order-card-head">
              <div>
                <p className="eyebrow">{order.order_number}</p>
                <h2>{order.customer_name}</h2>
                <span><FiClock /> {new Date(order.created_at).toLocaleString()}</span>
              </div>
              <strong className={`status-pill ${order.status}`}>{order.status}</strong>
            </div>
            <div className="order-meta-grid">
              <span><FiTruck /> {order.fulfillment_type}</span>
              <span>{order.customer_phone}</span>
              <span>₦{Number(order.total || 0).toLocaleString()}</span>
            </div>
            {order.delivery_address ? <p className="muted-line">{order.delivery_address}</p> : null}
            <div className="table-list">
              {(order.items || []).map((item) => (
                <div key={item.id}>
                  <span>{item.quantity}x {item.name}</span>
                  <strong>₦{Number(item.line_total || 0).toLocaleString()}</strong>
                </div>
              ))}
            </div>
            <div className="item-admin-actions">
              {statusFlow.map((status) => (
                <button
                  className={order.status === status ? 'primary-button' : 'secondary-button'}
                  disabled={updatingId === order.id || order.status === status}
                  key={status}
                  type="button"
                  onClick={() => updateStatus(order, status)}
                >
                  {status === 'completed' ? <FiCheckCircle /> : null}
                  {status}
                </button>
              ))}
              <button className="secondary-button" disabled={updatingId === order.id} type="button" onClick={() => updateStatus(order, 'cancelled')}>
                Cancel
              </button>
            </div>
          </article>
        ))}
      </section>
      {!orders.length ? <p className="empty-state">No orders yet.</p> : null}
    </main>
  )
}

export default Orders
