import { useEffect, useState } from 'react'
import { FiImage, FiLoader, FiSave, FiToggleLeft, FiToggleRight, FiUpload } from 'react-icons/fi'
import api, { updateStoredRestaurant } from '../../api/client'
import { resolveAssetUrl } from '../../api/assets'
import SkeletonPage from '../../components/SkeletonPage'

function RestaurantSettings() {
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/dashboard').then((response) => setForm(toSettingsForm(response.data.restaurant)))
  }, [])

  if (!form) return <SkeletonPage />

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const { data } = await api.put('/restaurant', toRestaurantPayload(form))
      setForm(toSettingsForm(data))
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
      const saveResponse = await api.put('/restaurant', toRestaurantPayload(updatedForm))
      setForm(toSettingsForm(saveResponse.data))
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

        {['name', 'business_type', 'description', 'phone', 'whatsapp', 'email', 'address', 'google_maps_url', 'delivery_info'].map((field) => (
          <label key={field}>
            <span>{field.replaceAll('_', ' ')}</span>
            <input value={form[field] || ''} onChange={(event) => update(field, event.target.value)} />
          </label>
        ))}
        <label>
          <span>Service area</span>
          <input placeholder="Lekki, Victoria Island, Ikeja..." value={form.service_area || ''} onChange={(event) => update('service_area', event.target.value)} />
        </label>
        <label>
          <span>Estimated delivery minutes</span>
          <input
            min="5"
            type="number"
            value={form.estimated_delivery_minutes || 35}
            onChange={(event) => update('estimated_delivery_minutes', event.target.value)}
          />
        </label>
        <label className="wide">
          <span>Cuisine tags</span>
          <input
            placeholder="Rice, Grills, Breakfast"
            value={form.cuisine_tags_text || ''}
            onChange={(event) => update('cuisine_tags_text', event.target.value)}
          />
        </label>
        <div className="setting-toggle wide">
          <div>
            <span>Restaurant status</span>
            <strong>{Number(form.is_open) ? 'Open for discovery' : 'Closed for now'}</strong>
          </div>
          <button className="secondary-button" type="button" onClick={() => update('is_open', Number(form.is_open) ? 0 : 1)}>
            {Number(form.is_open) ? <FiToggleRight /> : <FiToggleLeft />}
            {Number(form.is_open) ? 'Set closed' : 'Set open'}
          </button>
        </div>
        <label>
          <span>Opening hours</span>
          <textarea value={form.opening_hours_text || ''} onChange={(event) => update('opening_hours_text', event.target.value)} />
        </label>
        <label>
          <span>Instagram URL</span>
          <input value={form.instagram_url || ''} onChange={(event) => update('instagram_url', event.target.value)} />
        </label>
        <label>
          <span>X URL</span>
          <input value={form.x_url || ''} onChange={(event) => update('x_url', event.target.value)} />
        </label>
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

function toSettingsForm(restaurant) {
  const openingHours = restaurant.opening_hours && typeof restaurant.opening_hours === 'object' ? restaurant.opening_hours : {}
  const socialLinks = restaurant.social_links && typeof restaurant.social_links === 'object' ? restaurant.social_links : {}
  return {
    ...restaurant,
    opening_hours_text: Object.entries(openingHours).map(([day, hours]) => `${day}: ${hours}`).join('\n'),
    instagram_url: socialLinks.instagram || '',
    x_url: socialLinks.x || '',
    cuisine_tags_text: Array.isArray(restaurant.cuisine_tags) ? restaurant.cuisine_tags.join(', ') : '',
    is_open: Number(restaurant.is_open ?? 1),
    estimated_delivery_minutes: restaurant.estimated_delivery_minutes || 35,
  }
}

function toRestaurantPayload(form) {
  const opening_hours = {}
  for (const line of String(form.opening_hours_text || '').split('\n')) {
    const [day, ...hours] = line.split(':')
    if (day?.trim() && hours.join(':').trim()) opening_hours[day.trim().toLowerCase()] = hours.join(':').trim()
  }
  return {
    ...form,
    is_open: Number(form.is_open) ? 1 : 0,
    estimated_delivery_minutes: Number(form.estimated_delivery_minutes) || 35,
    cuisine_tags: String(form.cuisine_tags_text || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    opening_hours,
    social_links: {
      instagram: form.instagram_url || '',
      x: form.x_url || '',
    },
  }
}

export default RestaurantSettings
