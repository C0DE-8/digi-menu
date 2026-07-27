import { useEffect, useState } from 'react'
import { FiActivity, FiEye, FiGrid, FiMousePointer } from 'react-icons/fi'
import api from '../../api/client'
import StatCard from '../../components/StatCard'

function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/dashboard').then((response) => setData(response.data))
  }, [])

  if (!data) return <main className="page-shell">Loading dashboard...</main>

  return (
    <main className="page-shell">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Restaurant portal</p>
          <h1>{data.restaurant.name}</h1>
        </div>
        <a className="secondary-button" href={`/menu/${data.restaurant.slug}`}>
          Open public menu
        </a>
      </div>
      <div className="feature-grid">
        <StatCard icon={<FiEye />} label="Today visitors" value={data.analytics.todayVisitors} tone="green" />
        <StatCard icon={<FiActivity />} label="Weekly visitors" value={data.analytics.weeklyVisitors} tone="blue" />
        <StatCard icon={<FiMousePointer />} label="QR scans" value={data.analytics.qrScans} tone="orange" />
        <StatCard icon={<FiGrid />} label="Menu items" value={data.items.length} />
      </div>
      <section className="dashboard-grid">
        <article className="panel">
          <h2>QR menu link</h2>
          {data.qrCode?.image_data_url ? <img className="qr-image" src={data.qrCode.image_data_url} alt="Restaurant QR code" /> : null}
          <p>{data.qrCode?.menu_url}</p>
        </article>
        <article className="panel">
          <h2>Subscription</h2>
          <p className="big-line">{data.subscription?.plan_name || data.restaurant.plan}</p>
          <p>Status: {data.subscription?.status || 'trial'}</p>
          <p>Next invoice: {data.invoices[0]?.invoice_number || 'No invoice yet'}</p>
        </article>
        <article className="panel wide">
          <h2>Popular foods</h2>
          <div className="table-list">
            {data.analytics.popularItems.map((item) => (
              <div key={item.name}>
                <span>{item.name}</span>
                <strong>{item.views} views</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

export default Dashboard
