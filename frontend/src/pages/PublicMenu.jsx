import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FiMapPin, FiPhone, FiSearch, FiShare2 } from 'react-icons/fi'
import api from '../api/client'
import MenuItemCard from '../components/MenuItemCard'

function PublicMenu() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    api.get(`/public/menu/${slug}`).then((response) => setData(response.data))
  }, [slug])

  const items = useMemo(() => {
    if (!data) return []
    return data.items.filter((item) => {
      const matchesCategory = category === 'all' || item.category_id === Number(category)
      const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase())
      return matchesCategory && matchesQuery
    })
  }, [data, query, category])

  async function track(item) {
    await api.post(`/public/menu/${slug}/events`, { event_type: 'item_view', menu_item_id: item.id, category_id: item.category_id })
  }

  if (!data) return <main className="page-shell">Loading public menu...</main>

  return (
    <main className="public-menu">
      <section className="menu-hero" style={{ backgroundImage: `url(${data.restaurant.cover_url})` }}>
        <div>
          <img src={data.restaurant.logo_url} alt={`${data.restaurant.name} logo`} />
          <p className="eyebrow">Digital menu</p>
          <h1>{data.restaurant.name}</h1>
          <p>{data.restaurant.description}</p>
          <div className="menu-actions">
            <a href={`tel:${data.restaurant.phone}`}><FiPhone /> Call</a>
            <a href={`https://wa.me/${String(data.restaurant.whatsapp).replace(/\D/g, '')}`}><FiShare2 /> WhatsApp</a>
            <a href={data.restaurant.google_maps_url}><FiMapPin /> Directions</a>
          </div>
        </div>
      </section>
      <section className="menu-browser">
        <div className="search-row">
          <FiSearch />
          <input placeholder="Search meals, drinks, categories" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="category-tabs">
          <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>All</button>
          {data.categories.map((item) => (
            <button className={category === String(item.id) ? 'active' : ''} key={item.id} onClick={() => setCategory(String(item.id))}>
              {item.name}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {items.map((item) => (
            <MenuItemCard item={item} key={item.id} onView={track} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default PublicMenu
