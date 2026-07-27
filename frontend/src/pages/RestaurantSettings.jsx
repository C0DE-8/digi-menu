import { useEffect, useState } from 'react'
import api from '../api/client'

function RestaurantSettings() {
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/dashboard').then((response) => setForm(response.data.restaurant))
  }, [])

  if (!form) return <main className="page-shell">Loading settings...</main>

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const { data } = await api.put('/restaurant', form)
    setForm(data)
    setSaved(true)
  }

  return (
    <main className="page-shell">
      <p className="eyebrow">Restaurant profile</p>
      <h1>Settings</h1>
      <form className="settings-form" onSubmit={submit}>
        {['name', 'description', 'phone', 'whatsapp', 'email', 'address', 'google_maps_url', 'delivery_info', 'logo_url', 'cover_url'].map((field) => (
          <label key={field}>
            <span>{field.replaceAll('_', ' ')}</span>
            <input value={form[field] || ''} onChange={(event) => update(field, event.target.value)} />
          </label>
        ))}
        <button className="primary-button" type="submit">
          Save settings
        </button>
        {saved ? <p className="success-text">Saved</p> : null}
      </form>
    </main>
  )
}

export default RestaurantSettings
