import { useEffect, useState } from 'react'
import { FiDollarSign, FiSave, FiShield, FiUploadCloud, FiUsers } from 'react-icons/fi'
import api from '../../api/client'
import SkeletonPage from '../../components/SkeletonPage'
import StatCard from '../../components/StatCard'

function SuperAdminDashboard() {
  const [data, setData] = useState(null)
  const [uploadProvider, setUploadProvider] = useState('cloudinary')
  const [cloudinary, setCloudinary] = useState({ cloudName: '', apiKey: '', apiSecret: '', folder: 'ravi-menu/menu-items' })
  const [saving, setSaving] = useState(false)
  const [savingCloudinary, setSavingCloudinary] = useState(false)
  const [message, setMessage] = useState('')
  const [cloudinaryMessage, setCloudinaryMessage] = useState('')

  useEffect(() => {
    api.get('/admin/overview').then((response) => {
      setData(response.data)
      setUploadProvider(response.data.settings?.uploadProvider || 'cloudinary')
      setCloudinary(response.data.settings?.cloudinary || { cloudName: '', apiKey: '', apiSecret: '', folder: 'ravi-menu/menu-items' })
    })
  }, [])

  async function saveUploadProvider(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const response = await api.put('/admin/settings/upload-provider', { upload_provider: uploadProvider })
      setData((current) => ({ ...current, settings: response.data }))
      setCloudinary(response.data.cloudinary || cloudinary)
      setMessage('Upload provider updated.')
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not update upload provider.')
    } finally {
      setSaving(false)
    }
  }

  async function saveCloudinary(event) {
    event.preventDefault()
    setSavingCloudinary(true)
    setCloudinaryMessage('')
    try {
      const response = await api.put('/admin/settings/cloudinary', {
        cloud_name: cloudinary.cloudName,
        api_key: cloudinary.apiKey,
        api_secret: cloudinary.apiSecret,
        folder: cloudinary.folder,
      })
      setData((current) => ({ ...current, settings: response.data }))
      setCloudinary(response.data.cloudinary || cloudinary)
      setCloudinaryMessage('Cloudinary settings updated.')
    } catch (error) {
      setCloudinaryMessage(error.response?.data?.error || 'Could not update Cloudinary settings.')
    } finally {
      setSavingCloudinary(false)
    }
  }

  function updateCloudinary(field, value) {
    setCloudinary((current) => ({ ...current, [field]: value }))
  }

  if (!data) return <SkeletonPage />

  return (
    <main className="page-shell">
      <p className="eyebrow">Super admin</p>
      <h1>System dashboard</h1>
      <div className="feature-grid">
        <StatCard icon={<FiUsers />} label="Restaurants" value={data.stats.restaurants} tone="green" />
        <StatCard icon={<FiShield />} label="Active restaurants" value={data.stats.activeRestaurants} tone="blue" />
        <StatCard icon={<FiDollarSign />} label="Revenue" value={`₦${Number(data.stats.revenue).toLocaleString()}`} tone="orange" />
        <StatCard icon={<FiUploadCloud />} label="Upload provider" value={data.settings?.uploadProvider || 'cloudinary'} tone="blue" />
      </div>

      <section className="panel">
        <h2>System upload type</h2>
        <form className="settings-form" onSubmit={saveUploadProvider}>
          <label>
            <span>Provider</span>
            <select value={uploadProvider} onChange={(event) => setUploadProvider(event.target.value)}>
              {(data.settings?.uploadProviders || ['cloudinary', 'local']).map((provider) => (
                <option key={provider} value={provider}>
                  {provider === 'cloudinary' ? 'Cloudinary' : 'Local uploads folder'}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : 'Save upload type'}
          </button>
          {message ? <p className={message.includes('updated') ? 'success-text' : 'error-text'}>{message}</p> : null}
        </form>
      </section>

      <section className="panel">
        <h2>Cloudinary credentials</h2>
        <form className="settings-form" onSubmit={saveCloudinary}>
          <label>
            <span>Cloud name</span>
            <input value={cloudinary.cloudName} onChange={(event) => updateCloudinary('cloudName', event.target.value)} />
          </label>
          <label>
            <span>API key</span>
            <input value={cloudinary.apiKey} onChange={(event) => updateCloudinary('apiKey', event.target.value)} />
          </label>
          <label>
            <span>API secret</span>
            <input value={cloudinary.apiSecret} onChange={(event) => updateCloudinary('apiSecret', event.target.value)} />
          </label>
          <label>
            <span>Folder</span>
            <input value={cloudinary.folder} onChange={(event) => updateCloudinary('folder', event.target.value)} />
          </label>
          <button className="primary-button" type="submit" disabled={savingCloudinary}>
            <FiSave /> {savingCloudinary ? 'Saving...' : 'Save Cloudinary'}
          </button>
          {cloudinaryMessage ? (
            <p className={cloudinaryMessage.includes('updated') ? 'success-text' : 'error-text'}>{cloudinaryMessage}</p>
          ) : null}
        </form>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <h2>Restaurants</h2>
          <div className="table-list">
            {data.restaurants.map((restaurant) => (
              <div key={restaurant.id}>
                <span>{restaurant.name}</span>
                <strong>{restaurant.status}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Users</h2>
          <div className="table-list">
            {data.users.map((user) => (
              <div key={user.id}>
                <span>{user.email}</span>
                <strong>{user.role}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default SuperAdminDashboard
