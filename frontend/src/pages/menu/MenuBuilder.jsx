import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiEdit2, FiEye, FiEyeOff, FiPlus, FiSave, FiUpload, FiX } from 'react-icons/fi'
import api from '../../api/client'
import { resolveAssetUrl } from '../../api/assets'
import MenuItemCard from '../../components/MenuItemCard'
import SkeletonPage from '../../components/SkeletonPage'

function prepTimeToMinutes(value) {
  return String(value || '20').replace(/\s*min(?:ute)?s?\s*$/i, '').trim() || '20'
}

function minutesToPrepTime(value) {
  const minutes = prepTimeToMinutes(value)
  return `${minutes} min`
}

const availabilityOptions = [
  { value: 'available', label: 'Available' },
  { value: 'out_of_stock', label: 'Out of stock' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'coming_soon', label: 'Coming soon' },
  { value: 'hidden', label: 'Hidden' },
]

function MenuBuilder() {
  const [data, setData] = useState(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [prepTime, setPrepTime] = useState('20')
  const [availability, setAvailability] = useState('available')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState(null)
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
    setError('')
    try {
      await api.post('/categories', { name: categoryName })
      setCategoryName('')
      refresh()
    } catch (categoryError) {
      setError(categoryError.response?.data?.error || 'Could not add this category.')
    }
  }

  async function saveItem(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      let imageUrl = editingItem?.image_url || ''
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)
        const uploadResponse = await api.post('/uploads/menu-items', formData)
        imageUrl = uploadResponse.data.image_url
      }

      const payload = {
        category_id: categoryId || data.categories[0]?.id,
        name: itemName,
        price,
        description: description || 'New menu item added from Ravi Menu.',
        availability,
        image_url: imageUrl,
        prep_time: minutesToPrepTime(prepTime),
        is_new: editingItem ? editingItem.is_new : true,
        is_popular: editingItem?.is_popular,
        is_spicy: editingItem?.is_spicy,
        is_vegetarian: editingItem?.is_vegetarian,
        is_vegan: editingItem?.is_vegan,
        is_halal: editingItem?.is_halal,
        is_gluten_free: editingItem?.is_gluten_free,
        ingredients: editingItem?.ingredients || '',
        calories: editingItem?.calories || null,
        sort_order: editingItem?.sort_order || 0,
      }

      if (editingItem) await api.put(`/items/${editingItem.id}`, payload)
      else await api.post('/items', payload)

      resetItemForm()
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

  function editItem(item) {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setEditingItem(item)
    setCategoryId(String(item.category_id))
    setItemName(item.name || '')
    setDescription(item.description || '')
    setPrice(String(item.price || ''))
    setPrepTime(prepTimeToMinutes(item.prep_time))
    setAvailability(item.availability || 'available')
    setImageFile(null)
    setImagePreview(item.image_url ? resolveAssetUrl(item.image_url) : '')
    setError('')
  }

  function resetItemForm() {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setEditingItem(null)
    setItemName('')
    setDescription('')
    setPrice('')
    setPrepTime('20')
    setAvailability('available')
    setImageFile(null)
    setImagePreview('')
    setError('')
  }

  async function toggleAvailability(item) {
    setUpdatingItemId(item.id)
    setError('')
    try {
      await api.patch(`/items/${item.id}/availability`, { availability: item.availability === 'hidden' ? 'available' : 'hidden' })
      refresh()
    } catch (toggleError) {
      setError(toggleError.response?.data?.message || 'Could not update this menu item.')
    } finally {
      setUpdatingItemId(null)
    }
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
          <p className="muted-line">
            Plan usage: {data.items.length} / {data.planLimits?.menuItems || 'Unlimited'} items · {data.categories.length} / {data.planLimits?.categories || 'Unlimited'} categories
          </p>
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
        <form className="panel" onSubmit={saveItem}>
          <div className="form-heading-row">
            <h2>{editingItem ? 'Edit item' : 'Add item'}</h2>
            {editingItem ? (
              <button className="text-button" type="button" onClick={resetItemForm}>
                <FiX /> Cancel
              </button>
            ) : null}
          </div>
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
          <label>
            <span>Availability</span>
            <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
              {availabilityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Preparation time</span>
            <div className="suffix-input">
              <input placeholder="20" value={prepTime} onChange={(event) => setPrepTime(event.target.value)} inputMode="numeric" />
              <span>min</span>
            </div>
          </label>
          <label className="file-picker">
            <span><FiUpload /> {editingItem ? 'Replace item image' : 'Upload item image'}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectImage} />
          </label>
          {imagePreview ? <img className="image-preview" src={imagePreview} alt="Selected menu item preview" /> : null}
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={saving || !data.categories.length}>
            {editingItem ? <FiSave /> : <FiPlus />} {saving ? 'Saving item...' : editingItem ? 'Save changes' : 'Add item'}
          </button>
        </form>
      </section>
      {grouped.map((category) => (
        <section className="menu-section" key={category.id}>
          <h2>{category.name}</h2>
          <div className="menu-grid">
            {category.items.map((item) => (
              <div className="managed-menu-item" key={item.id}>
                <MenuItemCard item={item} />
                <div className="item-admin-actions">
                  <button className="secondary-button" type="button" onClick={() => editItem(item)}>
                    <FiEdit2 /> Edit
                  </button>
                  <button className="secondary-button" type="button" onClick={() => toggleAvailability(item)} disabled={updatingItemId === item.id}>
                    {item.availability === 'hidden' ? <FiEye /> : <FiEyeOff />}
                    {item.availability === 'hidden' ? 'Turn on' : 'Turn off'}
                  </button>
                  {item.availability === 'hidden' ? <span>Hidden from public menu</span> : null}
                  {item.availability && !['available', 'hidden'].includes(item.availability) ? <span>{availabilityOptions.find((option) => option.value === item.availability)?.label}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}

export default MenuBuilder
