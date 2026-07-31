import { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiDollarSign, FiShield, FiUsers, FiXCircle } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'
import StatCard from '../../components/StatCard'

function AdminDashboard() {
  const [data, setData] = useState(null)
  const [notes, setNotes] = useState({})
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    api.get('/admin/overview').then((response) => setData(response.data))
  }

  async function updateRestaurantStatus(restaurant, status) {
    setUpdatingId(restaurant.id)
    await api.patch(`/admin/restaurants/${restaurant.id}/status`, {
      status,
      approval_note: notes[restaurant.id] || (status === 'approved' ? 'Approved for public menu launch.' : 'Please update your profile and menu details before approval.'),
    })
    setUpdatingId(null)
    refresh()
  }

  if (!data) return <SkeletonPage />

  return (
    <main className="page-shell">
      <p className="eyebrow">Admin dashboard</p>
      <h1>Platform operations</h1>
      <div className="feature-grid">
        <StatCard icon={<FiUsers />} label="Restaurants" value={data.stats.restaurants} tone="green" />
        <StatCard icon={<FiShield />} label="Active restaurants" value={data.stats.activeRestaurants} tone="blue" />
        <StatCard icon={<FiAlertCircle />} label="Pending approvals" value={data.stats.pendingRestaurants || 0} />
        <StatCard icon={<FiAlertCircle />} label="Expired subscriptions" value={data.stats.expiredSubscriptions || 0} tone="orange" />
        <StatCard icon={<FiDollarSign />} label="Revenue" value={`₦${Number(data.stats.revenue).toLocaleString()}`} tone="orange" />
      </div>
      <section className="panel">
        <h2>Restaurant approvals</h2>
        <div className="table-list">
          {data.restaurants.map((restaurant) => (
            <div className="approval-row" key={restaurant.id}>
              <span>
                <strong>{restaurant.name}</strong>
                <small>{restaurant.email} · {restaurant.business_type || 'restaurant'}</small>
              </span>
              <label>
                <span>Review note</span>
                <input
                  value={notes[restaurant.id] ?? restaurant.approval_note ?? ''}
                  onChange={(event) => setNotes((current) => ({ ...current, [restaurant.id]: event.target.value }))}
                />
              </label>
              <strong className={`status-pill ${restaurant.status}`}>{restaurant.status}</strong>
              <div className="approval-actions">
                <button className="secondary-button" type="button" disabled={updatingId === restaurant.id} onClick={() => updateRestaurantStatus(restaurant, 'approved')}>
                  <FiCheckCircle /> Approve
                </button>
                <button className="secondary-button" type="button" disabled={updatingId === restaurant.id} onClick={() => updateRestaurantStatus(restaurant, 'rejected')}>
                  <FiXCircle /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Users</h2>
        <div className="table-list">
          {data.users.map((user) => (
            <div key={user.id}>
              <span>{user.email}</span>
              <strong>{user.role}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard
