import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiBriefcase, FiCoffee, FiHome, FiLoader, FiMapPin, FiShoppingBag, FiTruck } from 'react-icons/fi'
import api, { setSession } from '../../api/client'

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant', icon: <FiBriefcase /> },
  { value: 'cafe', label: 'Cafe', icon: <FiCoffee /> },
  { value: 'cloud_kitchen', label: 'Cloud kitchen', icon: <FiHome /> },
  { value: 'food_truck', label: 'Food truck', icon: <FiTruck /> },
  { value: 'bakery', label: 'Bakery', icon: <FiShoppingBag /> },
  { value: 'bar_lounge', label: 'Bar or lounge', icon: <FiMapPin /> },
]

function Register() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    business_type: 'restaurant',
    owner_name: '',
    email: '',
    password: '',
    restaurant_name: '',
    phone: '',
    whatsapp: '',
    address: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/register', form)
      setSession(response.data)
      navigate('/dashboard')
    } catch (registerError) {
      setError(registerError.response?.data?.error || 'Could not create this restaurant account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="vendor-register-page">
      <section className="vendor-register-shell">
        <header className="register-topbar">
          <Link className="brand" to="/">Digi Menu</Link>
          <Link className="text-button" to="/login">Have an account? Log in</Link>
        </header>

        <form className="vendor-register-card" onSubmit={submit}>
          {step === 1 ? (
            <>
              <p className="eyebrow">Vendor onboarding</p>
              <h1>What type of business do you run?</h1>
              <div className="business-type-grid">
                {businessTypes.map((type) => (
                  <button
                    className={form.business_type === type.value ? 'business-type active' : 'business-type'}
                    key={type.value}
                    type="button"
                    onClick={() => update('business_type', type.value)}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
              <button className="primary-button full" type="button" onClick={() => setStep(2)}>
                Continue <FiArrowRight />
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">Restaurant details</p>
              <h1>Create your account</h1>
              <div className="form-grid compact-grid">
                <label>
                  <span>Owner name</span>
                  <input value={form.owner_name} onChange={(event) => update('owner_name', event.target.value)} required />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
                </label>
                <label>
                  <span>Password</span>
                  <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} minLength={6} required />
                </label>
                <label>
                  <span>Restaurant name</span>
                  <input value={form.restaurant_name} onChange={(event) => update('restaurant_name', event.target.value)} required />
                </label>
                <label>
                  <span>Phone</span>
                  <input value={form.phone} onChange={(event) => update('phone', event.target.value)} required />
                </label>
                <label>
                  <span>WhatsApp</span>
                  <input value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} />
                </label>
                <label className="wide">
                  <span>Address</span>
                  <input value={form.address} onChange={(event) => update('address', event.target.value)} required />
                </label>
                <label className="wide">
                  <span>Description</span>
                  <textarea value={form.description} onChange={(event) => update('description', event.target.value)} />
                </label>
              </div>
              {error ? <p className="error-text">{error}</p> : null}
              <div className="hero-actions">
                <button className="secondary-button" type="button" onClick={() => setStep(1)}>Back</button>
                <button className="primary-button" type="submit" disabled={loading}>
                  {loading ? <FiLoader className="spin" /> : null}
                  {loading ? 'Creating account...' : 'Submit for approval'}
                </button>
              </div>
            </>
          )}
        </form>
      </section>
    </main>
  )
}

export default Register
