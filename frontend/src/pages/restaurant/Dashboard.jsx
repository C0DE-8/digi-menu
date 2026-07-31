import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiActivity, FiCheckCircle, FiClock, FiEye, FiGrid, FiImage, FiList, FiMousePointer, FiPieChart, FiSettings } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'
import StatCard from '../../components/StatCard'

function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/dashboard').then((response) => setData(response.data))
  }, [])

  if (!data) return <SkeletonPage />

  const checklist = [
    { label: 'Complete restaurant profile', done: Boolean(data.restaurant.description && data.restaurant.phone && data.restaurant.address), to: '/settings', icon: <FiSettings /> },
    { label: 'Upload logo and cover', done: Boolean(data.restaurant.logo_url && data.restaurant.cover_url), to: '/settings', icon: <FiImage /> },
    { label: 'Add categories', done: data.categories.length > 0, to: '/menu-builder', icon: <FiList /> },
    { label: 'Add first menu items', done: data.items.length > 0, to: '/menu-builder', icon: <FiGrid /> },
    { label: 'Generate QR code', done: Boolean(data.qrCode?.image_data_url), to: '/qr-code', icon: <FiGrid /> },
  ]
  const completedCount = checklist.filter((item) => item.done).length

  return (
    <main className="page-shell">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Restaurant portal</p>
          <h1>{data.restaurant.name}</h1>
        </div>
        {data.restaurant.status === 'approved' ? (
          <a className="secondary-button" href={`/menu/${data.restaurant.slug}`}>
            Open public menu
          </a>
        ) : (
          <span className="status-pill pending">Public menu unlocks after approval</span>
        )}
      </div>
      {data.restaurant.status !== 'approved' ? (
        <section className={`approval-banner ${data.restaurant.status}`}>
          <div>
            <p className="eyebrow">{data.restaurant.status === 'rejected' ? 'Action needed' : 'Approval pending'}</p>
            <h2>{data.restaurant.status === 'rejected' ? 'Your restaurant needs changes before approval.' : 'Your restaurant is under admin review.'}</h2>
            <p>{data.restaurant.approval_note || 'Complete your onboarding checklist while the admin reviews your restaurant.'}</p>
          </div>
          <FiClock aria-hidden="true" />
        </section>
      ) : null}
      <section className="panel onboarding-panel">
        <div className="form-heading-row">
          <div>
            <p className="eyebrow">Onboarding checklist</p>
            <h2>{completedCount} of {checklist.length} completed</h2>
          </div>
          {completedCount === checklist.length ? <span className="status-pill approved">Ready</span> : <span className="status-pill pending">In progress</span>}
        </div>
        <div className="onboarding-list">
          {checklist.map((item) => (
            <Link className={item.done ? 'onboarding-item done' : 'onboarding-item'} key={item.label} to={item.to}>
              {item.done ? <FiCheckCircle /> : item.icon}
              <span>{item.label}</span>
              <strong>{item.done ? 'Done' : 'Open'}</strong>
            </Link>
          ))}
        </div>
      </section>
      <div className="feature-grid">
        <StatCard icon={<FiEye />} label="Today visitors" value={data.analytics.todayVisitors} tone="green" />
        <StatCard icon={<FiActivity />} label="Weekly visitors" value={data.analytics.weeklyVisitors} tone="blue" />
        <StatCard icon={<FiMousePointer />} label="QR scans" value={data.analytics.qrScans} tone="orange" />
        <StatCard icon={<FiPieChart />} label="Profile complete" value={`${data.profileCompleteness?.percent || 0}%`} />
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
          <p>Menu limit: {data.items.length} / {data.planLimits?.menuItems || 'Unlimited'}</p>
          <p>Next invoice: {data.invoices[0]?.invoice_number || 'Invoice will appear after approval'}</p>
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
