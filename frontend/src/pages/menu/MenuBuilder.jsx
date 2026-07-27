import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiPlus, FiUpload } from 'react-icons/fi'
import api from '../../api/client'
import MenuItemCard from '../../components/MenuItemCard'
import SkeletonPage from '../../components/SkeletonPage'

function MenuBuilder() {
  const [data, setData] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(() => {
    api.get('/dashboard').then((response) => {
      setData(response.data)
      setCategoryId((current) => current || (response.data.categories[0]?.id ? String(response.data.categories[0].id) : ''))
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  async function addCategory(event) {
    event.preventDefault()
    await api.post('/categories', { name: categoryName })
    setCategoryName('')
    refresh()
  }

  async function addItem(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      let imageUrl = ''
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        const uploadResponse = await api.post('/uploads/menu-items', formData)
        imageUrl = uploadResponse.data.image_url
      }

      await api.post('/items', {
        category_id: categoryId || data.categories[0]?.id,
        name: itemName,
        price,
        description: description || 'New menu item added from Digi Menu.',
        availability: 'available',
        image_url: imageUrl,
        prep_time: prepTime || '20 min',
        is_new: true,
      })
      setItemName('')
      setDescription('')
      setPrice('')
      setPrepTime('')
      setImageFile(null)
      setImagePreview('')
      refresh()
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Could not save this menu item.')
    } finally {
      setSaving(false)
    }
  }

  function selectImage(event) {
    const file = event.target.files?.[0]
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file || null)
    setImagePreview(file ? URL.createObjectURL(file) : '')
  }

  const grouped = useMemo(() => {
    if (!data) return []
    return data.categories.map((category) => ({
      ...category,
      items: data.items.filter((item) => item.category_id === category.id),
    }))
  }, [data])

  if (!data) return <SkeletonPage />

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
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input placeholder="Food name" value={itemName} onChange={(event) => setItemName(event.target.value)} required />
          <textarea placeholder="Short description" value={description} onChange={(event) => setDescription(event.target.value)} />
          <input placeholder="Price in naira" value={price} onChange={(event) => setPrice(event.target.value)} required />
          <input placeholder="Prep time, e.g. 20 min" value={prepTime} onChange={(event) => setPrepTime(event.target.value)} />
          <label className="file-picker">
            <span><FiUpload /> Upload item image</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectImage} />
          </label>
          {imagePreview ? <img className="image-preview" src={imagePreview} alt="Selected menu item preview" /> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={saving || !data.categories.length}>
            <FiPlus /> {saving ? 'Saving item...' : 'Add item'}
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
