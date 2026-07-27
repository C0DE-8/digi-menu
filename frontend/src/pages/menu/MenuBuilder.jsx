import { useEffect, useMemo, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import api from '../../api/client'
import MenuItemCard from '../../components/MenuItemCard'

function MenuBuilder() {
  const [data, setData] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    api.get('/dashboard').then((response) => setData(response.data))
  }

  async function addCategory(event) {
    event.preventDefault()
    await api.post('/categories', { name: categoryName })
    setCategoryName('')
    refresh()
  }

  async function addItem(event) {
    event.preventDefault()
    await api.post('/items', {
      category_id: data.categories[0]?.id,
      name: itemName,
      price,
      description: 'New menu item added from Digi Menu.',
      availability: 'available',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
      prep_time: '20 min',
      is_new: true,
    })
    setItemName('')
    setPrice('')
    refresh()
  }

  const grouped = useMemo(() => {
    if (!data) return []
    return data.categories.map((category) => ({
      ...category,
      items: data.items.filter((item) => item.category_id === category.id),
    }))
  }, [data])

  if (!data) return <main className="page-shell">Loading menu builder...</main>

  return (
    <main className="page-shell">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Menu management</p>
          <h1>Categories and items</h1>
        </div>
      </div>
      <section className="form-grid">
        <form className="panel" onSubmit={addCategory}>
          <h2>Add category</h2>
          <input placeholder="Soups" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required />
          <button className="primary-button" type="submit">
            <FiPlus /> Add category
          </button>
        </form>
        <form className="panel" onSubmit={addItem}>
          <h2>Add item</h2>
          <input placeholder="Food name" value={itemName} onChange={(event) => setItemName(event.target.value)} required />
          <input placeholder="Price in naira" value={price} onChange={(event) => setPrice(event.target.value)} required />
          <button className="primary-button" type="submit">
            <FiPlus /> Add item
          </button>
        </form>
      </section>
      {grouped.map((category) => (
        <section className="menu-section" key={category.id}>
          <h2>{category.name}</h2>
          <div className="menu-grid">
            {category.items.map((item) => (
              <MenuItemCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}

export default MenuBuilder
