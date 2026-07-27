import { useEffect, useState } from 'react'
import { FiDollarSign, FiShield, FiUsers } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'
import StatCard from '../../components/StatCard'

function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/admin/overview').then((response) => setData(response.data))
  }, [])

  if (!data) return <SkeletonPage />

  return (
    <main className="page-shell">
      <p className="eyebrow">Admin dashboard</p>
      <h1>Platform operations</h1>
      <div className="feature-grid">
        <StatCard icon={<FiUsers />} label="Restaurants" value={data.stats.restaurants} tone="green" />
        <StatCard icon={<FiShield />} label="Active restaurants" value={data.stats.activeRestaurants} tone="blue" />
        <StatCard icon={<FiDollarSign />} label="Revenue" value={`₦${Number(data.stats.revenue).toLocaleString()}`} tone="orange" />
      </div>
      <section className="panel">
        <h2>Restaurant approvals</h2>
        <div className="table-list">
          {data.restaurants.map((restaurant) => (
            <div key={restaurant.id}>
              <span>{restaurant.name}</span>
              <strong>{restaurant.status}</strong>
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
