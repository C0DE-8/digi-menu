import { useEffect, useState } from 'react'
import { FiCheckCircle, FiCreditCard, FiFileText } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'
import StatCard from '../../components/StatCard'

function formatNaira(value) {
  if (value === null || value === undefined) return 'Custom'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
}

function Subscriptions() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/dashboard').then((response) => setData(response.data))
  }, [])

  if (!data) return <SkeletonPage />

  return (
    <main className="page-shell">
      <p className="eyebrow">Subscription module</p>
      <h1>Plans and invoices</h1>
      <div className="feature-grid">
        <StatCard icon={<FiCreditCard />} label="Current plan" value={data.subscription?.plan_name || data.restaurant.plan} tone="green" />
        <StatCard icon={<FiCheckCircle />} label="Status" value={data.subscription?.status || 'trial'} tone="blue" />
        <StatCard icon={<FiFileText />} label="Invoices" value={data.invoices.length} tone="orange" />
        <StatCard icon={<FiCreditCard />} label="Monthly price" value={formatNaira(data.subscription?.monthly_price)} />
      </div>
      <section className="dashboard-grid">
        <article className="panel">
          <h2>Plan features</h2>
          <div className="table-list">
            {(data.subscription?.features || []).map((feature) => (
              <div key={feature}>
                <span>{feature}</span>
                <strong>Included</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h2>Payment history</h2>
          <div className="table-list">
            {data.invoices.map((invoice) => (
              <div key={invoice.id}>
                <span>{invoice.invoice_number}</span>
                <strong>{formatNaira(invoice.amount)}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

export default Subscriptions
