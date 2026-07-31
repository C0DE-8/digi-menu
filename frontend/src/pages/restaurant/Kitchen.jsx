import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiRefreshCw } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'

function Kitchen() {
  const [orders, setOrders] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const response = await api.get('/orders')
    setOrders(response.data.orders || [])
  }

  async function updateStatus(order, status) {
    const response = await api.patch(`/orders/${order.id}/status`, { status })
    setOrders((current) => current.map((item) => item.id === order.id ? response.data.order : item))
  }

  const activeOrders = useMemo(
    () => (orders || []).filter((order) => !['completed', 'cancelled'].includes(order.status)),
    [orders],
  )

  if (!orders) return <SkeletonPage />

  return (
    <main className="page-shell kitchen-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Kitchen</p>
          <h1>Active tickets</h1>
        </div>
        <button className="secondary-button" type="button" onClick={loadOrders}><FiRefreshCw /> Refresh</button>
      </div>
      <section className="kitchen-grid">
        {activeOrders.map((order) => (
          <article className="panel kitchen-ticket" key={order.id}>
            <div className="order-card-head">
              <div>
                <p className="eyebrow">{order.order_number}</p>
                <h2>{order.customer_name}</h2>
              </div>
              <strong className={`status-pill ${order.status}`}>{order.status}</strong>
            </div>
            <div className="table-list">
              {(order.items || []).map((item) => (
                <div key={item.id}>
                  <span>{item.quantity}x {item.name}</span>
                  <strong>{item.notes || ''}</strong>
                </div>
              ))}
            </div>
            <div className="item-admin-actions">
              <button className="secondary-button" type="button" onClick={() => updateStatus(order, 'preparing')}>Preparing</button>
              <button className="primary-button" type="button" onClick={() => updateStatus(order, 'ready')}><FiCheckCircle /> Ready</button>
            </div>
          </article>
        ))}
      </section>
      {!activeOrders.length ? <p className="empty-state">No active kitchen tickets.</p> : null}
    </main>
  )
}

export default Kitchen
