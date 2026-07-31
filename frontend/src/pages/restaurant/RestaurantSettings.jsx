import { useEffect, useState } from 'react'
import { FiImage, FiLoader, FiSave, FiUpload } from 'react-icons/fi'
import api, { updateStoredRestaurant } from '../../api/client'
import { resolveAssetUrl } from '../../api/assets'
import SkeletonPage from '../../components/SkeletonPage'

function RestaurantSettings() {
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard').then((response) => setForm(response.data.restaurant))
  }, [])

  if (!form) return <SkeletonPage />

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const { data } = await api.put('/restaurant', form)
      setForm(data)
      updateStoredRestaurant(data)
      setSaved(true)
    } catch (saveError) {
      setError(saveError.response?.data?.error || 'Could not save restaurant settings.')
    }
  }

  async function uploadAsset(type, file) {
    if (!file) return
    setUploading(type)
    setError('')
    setSaved(false)
    try {
      const body = new FormData()
      body.append('image', file)
      const response = await api.post(`/uploads/restaurant-assets/${type}`, body)
      const updatedForm = { ...form, [`${type}_url`]: response.data.image_url }
      const saveResponse = await api.put('/restaurant', updatedForm)
      setForm(saveResponse.data)
      updateStoredRestaurant(saveResponse.data)
      setSaved(true)
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || `Could not upload restaurant ${type}.`)
    } finally {
      setUploading('')
    }
  }

  return (
    <main className="page-shell">
      <p className="eyebrow">Restaurant profile</p>
      <h1>Settings</h1>
      <form className="settings-form" onSubmit={submit}>
        <div className="asset-upload-card">
          <div>
            <p className="eyebrow">Logo</p>
            <h2>Restaurant logo</h2>
          </div>
          {form.logo_url ? <img className="logo-preview" src={resolveAssetUrl(form.logo_url)} alt={`${form.name} logo preview`} /> : <div className="empty-image"><FiImage /></div>}
          <label className="file-picker compact">
            <span>{uploading === 'logo' ? <FiLoader className="spin" /> : <FiUpload />} {uploading === 'logo' ? 'Uploading logo...' : 'Upload logo'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={uploading === 'logo'}
              onChange={(event) => uploadAsset('logo', event.target.files?.[0])}
            />
          </label>
        </div>

        <div className="asset-upload-card">
          <div>
            <p className="eyebrow">Cover</p>
            <h2>Menu cover</h2>
          </div>
          {form.cover_url ? <img className="cover-preview" src={resolveAssetUrl(form.cover_url)} alt={`${form.name} cover preview`} /> : <div className="empty-image wide-preview"><FiImage /></div>}
          <label className="file-picker compact">
            <span>{uploading === 'cover' ? <FiLoader className="spin" /> : <FiUpload />} {uploading === 'cover' ? 'Uploading cover...' : 'Upload cover'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={uploading === 'cover'}
              onChange={(event) => uploadAsset('cover', event.target.files?.[0])}
            />
          </label>
        </div>

        {['name', 'description', 'phone', 'whatsapp', 'email', 'address', 'google_maps_url', 'delivery_info'].map((field) => (
          <label key={field}>
            <span>{field.replaceAll('_', ' ')}</span>
            <input value={form[field] || ''} onChange={(event) => update(field, event.target.value)} />
          </label>
        ))}
        <label>
          <span>logo url</span>
          <input value={form.logo_url || ''} onChange={(event) => update('logo_url', event.target.value)} />
        </label>
        <label>
          <span>cover url</span>
          <input value={form.cover_url || ''} onChange={(event) => update('cover_url', event.target.value)} />
        </label>
        {error ? <p className="error-text wide">{error}</p> : null}
        <button className="primary-button" type="submit">
          <FiSave /> Save settings
        </button>
        {saved ? <p className="success-text">Saved</p> : null}
      </form>
    </main>
  )
}

export default RestaurantSettings
