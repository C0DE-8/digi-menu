import { useEffect, useState } from 'react'
import { FiClock, FiMapPin, FiMonitor, FiMousePointer, FiNavigation, FiTrendingUp } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'
import StatCard from '../../components/StatCard'

function Analytics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/dashboard').then((response) => setData(response.data))
  }, [])

  if (!data) return <SkeletonPage />

  return (
    <main className="page-shell">
      <p className="eyebrow">Customer insights</p>
      <h1>Analytics</h1>
      <div className="feature-grid">
        <StatCard icon={<FiTrendingUp />} label="Monthly visitors" value={data.analytics.monthlyVisitors} tone="green" />
        <StatCard icon={<FiMousePointer />} label="QR scans" value={data.analytics.qrScans} tone="orange" />
        <StatCard icon={<FiMonitor />} label="Devices tracked" value={data.analytics.deviceTypes?.length || 0} tone="blue" />
        <StatCard icon={<FiNavigation />} label="Link clicks" value={data.analytics.linkClicks || 0} />
        <StatCard icon={<FiClock />} label="Avg. session" value={data.analytics.averageSession || '0s'} tone="green" />
        <StatCard icon={<FiMapPin />} label="Locations" value={data.analytics.locations?.length || 0} tone="blue" />
      </div>
      <section className="dashboard-grid">
        <article className="panel">
          <h2>Event activity</h2>
          <div className="table-list">
            {data.analytics.eventCounts.map((event) => (
              <div key={event.event_type}>
                <span>{event.event_type.replaceAll('_', ' ')}</span>
                <strong>{event.count}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h2>Device type</h2>
          <div className="table-list">
            {(data.analytics.deviceTypes || []).map((device) => (
              <div key={device.device_type || 'unknown'}>
                <span>{device.device_type || 'Unknown'}</span>
                <strong>{device.count}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h2>Most viewed categories</h2>
          <div className="table-list">
            {(data.analytics.viewedCategories || []).map((category) => (
              <div key={category.name}>
                <span>{category.name}</span>
                <strong>{category.views} views</strong>
              </div>
            ))}
            {data.analytics.viewedCategories?.length ? null : (
              <div>
                <span>No category views yet</span>
                <strong>0</strong>
              </div>
            )}
          </div>
        </article>
        <article className="panel wide">
          <h2>Customer locations</h2>
          <div className="table-list">
            {(data.analytics.locations || []).map((location) => (
              <div key={location.location}>
                <span>{location.location}</span>
                <strong>{location.count} visits</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

export default Analytics
