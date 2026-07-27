import { useEffect, useState } from 'react'
import { FiDollarSign, FiSave, FiShield, FiUploadCloud, FiUsers } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'
import StatCard from '../../components/StatCard'

function AdminDashboard() {
  const [data, setData] = useState(null)
  const [uploadProvider, setUploadProvider] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState('')

  useEffect(() => {
    api.get('/admin/overview').then((response) => {
      setData(response.data)
      setUploadProvider(response.data.settings?.uploadProvider || 'cloudinary')
    })
  }, [])

  async function saveUploadProvider(event) {
    event.preventDefault()
    setSavingSettings(true)
    setSettingsMessage('')
    try {
      const response = await api.put('/admin/settings/upload-provider', { upload_provider: uploadProvider })
      setData((current) => ({ ...current, settings: response.data }))
      setSettingsMessage('Upload provider updated.')
    } catch (error) {
      setSettingsMessage(error.response?.data?.error || 'Could not update upload provider.')
    } finally {
      setSavingSettings(false)
    }
  }

  if (!data) return <SkeletonPage />

  return (
    <main className="page-shell">
      <p className="eyebrow">Admin dashboard</p>
      <h1>Platform operations</h1>
      <div className="feature-grid">
        <StatCard icon={<FiUsers />} label="Restaurants" value={data.stats.restaurants} tone="green" />
        <StatCard icon={<FiShield />} label="Active restaurants" value={data.stats.activeRestaurants} tone="blue" />
        <StatCard icon={<FiDollarSign />} label="Revenue" value={`₦${Number(data.stats.revenue).toLocaleString()}`} tone="orange" />
        <StatCard icon={<FiUploadCloud />} label="Uploads" value={data.settings?.uploadProvider || 'cloudinary'} tone="blue" />
      </div>
      {data.settings?.canManageSystem ? (
        <section className="panel">
          <h2>System uploads</h2>
          <form className="settings-form" onSubmit={saveUploadProvider}>
            <label>
              <span>Upload provider</span>
              <select value={uploadProvider} onChange={(event) => setUploadProvider(event.target.value)}>
                {(data.settings.uploadProviders || ['cloudinary', 'local']).map((provider) => (
                  <option key={provider} value={provider}>
                    {provider === 'cloudinary' ? 'Cloudinary' : 'Local uploads folder'}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit" disabled={savingSettings}>
              <FiSave /> {savingSettings ? 'Saving...' : 'Save upload type'}
            </button>
            {settingsMessage ? <p className={settingsMessage.includes('updated') ? 'success-text' : 'error-text'}>{settingsMessage}</p> : null}
          </form>
        </section>
      ) : null}
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
