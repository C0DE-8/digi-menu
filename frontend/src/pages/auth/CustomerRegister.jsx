import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiLoader, FiMapPin, FiPhone, FiShoppingBag, FiUser } from 'react-icons/fi'
import api, { setSession } from '../../api/client'

const preferences = ['Rice', 'Grills', 'Cafe', 'Breakfast', 'Seafood', 'Healthy']

function CustomerRegister() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    delivery_address: '',
    city: 'Lagos',
    preferences: ['Rice'],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function togglePreference(value) {
    setForm((current) => ({
      ...current,
      preferences: current.preferences.includes(value)
        ? current.preferences.filter((item) => item !== value)
        : [...current.preferences, value],
    }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/customers/register', {
        ...form,
        name: `${form.first_name} ${form.last_name}`.trim(),
      })
      setSession(response.data)
      navigate('/#restaurants')
    } catch (registerError) {
      setError(registerError.response?.data?.error || 'Could not create your customer account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="customer-register-page">
      <section className="customer-register-hero">
        <div>
          <p className="eyebrow">Customer account</p>
          <h1>Find food faster on Ravi Menu.</h1>
          <p>Discover local favourites, build your basket, and order directly from the restaurants you love.</p>
          <div className="customer-benefits">
            <span><FiShoppingBag /> Your next favourite meal</span>
            <span><FiMapPin /> Delivery area</span>
            <span><FiPhone /> Faster ordering</span>
          </div>
        </div>
      </section>

      <form className="customer-register-form" onSubmit={submit}>
        <div className="form-heading-row">
          <div>
            <p className="eyebrow">Sign up</p>
            <h2>Create customer account</h2>
          </div>
          <Link className="text-button" to="/login">Have an account?</Link>
        </div>
        <label>
          <span>First name</span>
          <div className="input-wrap">
            <FiUser />
            <input value={form.first_name} onChange={(event) => update('first_name', event.target.value)} required />
          </div>
        </label>
        <label>
          <span>Last name</span>
          <div className="input-wrap">
            <FiUser />
            <input value={form.last_name} onChange={(event) => update('last_name', event.target.value)} required />
          </div>
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
        </label>
        <label>
          <span>Password · at least 10 characters</span>
          <input type="password" minLength={10} autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} required />
        </label>
        <label>
          <span>Phone</span>
          <input value={form.phone} onChange={(event) => update('phone', event.target.value)} required />
        </label>
        <label>
          <span>Delivery address</span>
          <textarea value={form.delivery_address} onChange={(event) => update('delivery_address', event.target.value)} />
        </label>
        <label>
          <span>City</span>
          <input value={form.city} onChange={(event) => update('city', event.target.value)} />
        </label>
        <div className="preference-picker">
          <span>Food interests</span>
          <div>
            {preferences.map((item) => (
              <button className={form.preferences.includes(item) ? 'active' : ''} key={item} type="button" onClick={() => togglePreference(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-button full" type="submit" disabled={loading}>
          {loading ? <FiLoader className="spin" /> : null}
          {loading ? 'Creating account...' : 'Create account'} <FiArrowRight />
        </button>
      </form>
    </main>
  )
}

export default CustomerRegister
