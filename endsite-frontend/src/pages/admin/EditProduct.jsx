// src/pages/admin/EditProduct.jsx
//
// KEY CHANGE: Images tab now lets the admin pick which color/variant
// an uploaded image belongs to. The backend stores color + variant_id
// on the product_images row. The public product page then reads
// images_by_color to show the right photos when a customer switches color.

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Loader,
  Upload, X, Check, Save, Tag
} from 'lucide-react'
import api, { apiUpload, apiUploadPut } from '../../api/axios'

const EMPTY_VARIANT = {
  size: '', color: '', stock: 0, price_override: '', sku: '',
}

export default function EditProduct() {
  const { id }  = useParams()
  const navigate = useNavigate()

  // ── Product state ──────────────────────────────────────────────────────────
  const [product,    setProduct]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [categories, setCategories] = useState([])

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '', description: '', category_id: '', base_price: '', is_listed: true,
  })
  const [formErrors,  setFormErrors]  = useState({})
  const [savingForm,  setSavingForm]  = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [serverError, setServerError] = useState('')

  // ── Variants state ─────────────────────────────────────────────────────────
  const [variants,        setVariants]        = useState([])
  const [newVariants,     setNewVariants]      = useState([])
  const [variantErrors,   setVariantErrors]   = useState([])
  const [savingVariants,  setSavingVariants]  = useState(false)
  const [variantSuccess,  setVariantSuccess]  = useState(false)
  const [deletingVariant, setDeletingVariant] = useState(null)

  // ── Images state ───────────────────────────────────────────────────────────
  const [images,          setImages]          = useState([])
  const [imagesByColor,   setImagesByColor]   = useState({})
  const [uploadingImage,  setUploadingImage]  = useState(false)
  const [imageError,      setImageError]      = useState('')
  const [deletingImage,   setDeletingImage]   = useState(null)
  // Which variant the next upload will be linked to ("" = unassigned)
  const [uploadVariantId, setUploadVariantId] = useState('')
  const fileInputRef = useRef(null)

  // ── Active tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('details')

  const TABS = [
    { key: 'details',  label: 'Details'  },
    { key: 'variants', label: 'Variants' },
    { key: 'images',   label: 'Images'   },
  ]


  // ── Fetch product + categories ─────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [productRes, categoriesRes] = await Promise.all([
          // Use the new admin detail endpoint that includes unlisted products
          api.get(`/admin/products/${id}/detail`),
          api.get('/categories'),
        ])

        const full = productRes.data
        setProduct(full)
        setForm({
          name:        full.name        ?? '',
          description: full.description ?? '',
          category_id: full.category_id ?? '',
          base_price:  full.base_price  ?? '',
          is_listed:   full.is_listed   ?? true,
        })
        setVariants(full.variants      ?? [])
        setImages(full.images          ?? [])
        setImagesByColor(full.images_by_color ?? {})
        setCategories(categoriesRes.data ?? [])
      } catch (err) {
        setServerError(err.normalizedMessage ?? 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])


  // ── Form helpers ───────────────────────────────────────────────────────────

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((p) => ({ ...p, [field]: value }))
    setFormErrors((p) => ({ ...p, [field]: '' }))
    setServerError('')
    setFormSuccess(false)
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required'
    if (!form.base_price)  errs.base_price = 'Base price is required'
    else if (isNaN(form.base_price) || Number(form.base_price) <= 0)
      errs.base_price = 'Enter a valid price'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveForm = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSavingForm(true)
    setServerError('')
    setFormSuccess(false)
    try {
      const formData = new FormData()
      formData.append('name',        form.name.trim())
      formData.append('description', form.description.trim())
      formData.append('base_price',  Number(form.base_price))
      formData.append('is_listed',   form.is_listed)
      if (form.category_id) formData.append('category_id', form.category_id)

      const { data } = await apiUploadPut(`/admin/products/${id}`, formData)
      setProduct((p) => ({ ...p, ...data }))
      setFormSuccess(true)
      setTimeout(() => setFormSuccess(false), 3000)
    } catch (err) {
      setServerError(err.normalizedMessage ?? 'Failed to update product')
    } finally {
      setSavingForm(false)
    }
  }


  // ── Variant helpers ────────────────────────────────────────────────────────

  const setNewVariantField = (index, field) => (e) => {
    const value = field === 'stock' ? Number(e.target.value) : e.target.value
    setNewVariants((p) => p.map((v, i) => i === index ? { ...v, [field]: value } : v))
    setVariantErrors((p) => p.map((e, i) => i === index ? { ...e, [field]: '' } : e))
  }

  const addNewVariant = () => {
    setNewVariants((p) => [...p, { ...EMPTY_VARIANT }])
    setVariantErrors((p) => [...p, {}])
  }

  const removeNewVariant = (index) => {
    setNewVariants((p) => p.filter((_, i) => i !== index))
    setVariantErrors((p) => p.filter((_, i) => i !== index))
  }

  const validateNewVariants = () => {
    const errors = newVariants.map((v) => {
      const errs = {}
      if (!v.sku.trim()) errs.sku = 'SKU required'
      if (v.stock < 0)   errs.stock = 'Cannot be negative'
      if (v.price_override && (isNaN(v.price_override) || Number(v.price_override) <= 0))
        errs.price_override = 'Invalid price'
      return errs
    })
    setVariantErrors(errors)
    return errors.every((e) => Object.keys(e).length === 0)
  }

  const handleSaveNewVariants = async () => {
    if (newVariants.length === 0) return
    if (!validateNewVariants()) return
    setSavingVariants(true)
    setVariantSuccess(false)
    try {
      const saved = []
      for (const v of newVariants) {
        if (!v.sku.trim()) continue
        const { data } = await api.post(`/admin/products/${id}/variants`, {
          size:           v.size   || null,
          color:          v.color  || null,
          stock:          Number(v.stock),
          price_override: v.price_override ? Number(v.price_override) : null,
          sku:            v.sku.trim().toUpperCase(),
        })
        saved.push(data)
      }
      setVariants((p) => [...p, ...saved])
      setNewVariants([])
      setVariantErrors([])
      setVariantSuccess(true)
      setTimeout(() => setVariantSuccess(false), 3000)
    } catch (err) {
      setServerError(err.normalizedMessage ?? 'Failed to save variants')
    } finally {
      setSavingVariants(false)
    }
  }

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm('Delete this variant?')) return
    setDeletingVariant(variantId)
    try {
      await api.delete(`/admin/variants/${variantId}`)
      setVariants((p) => p.filter((v) => v.id !== variantId))
    } catch (err) {
      console.warn('[variant delete]', err.message)
    } finally {
      setDeletingVariant(null)
    }
  }

  const handleUpdateStock = async (variantId, newStock) => {
    const variant = variants.find((v) => v.id === variantId)
    if (!variant) return
    try {
      const { data } = await api.put(`/admin/variants/${variantId}`, {
        size:           variant.size,
        color:          variant.color,
        stock:          Number(newStock),
        price_override: variant.price_override,
        sku:            variant.sku,
      })
      setVariants((p) => p.map((v) => v.id === variantId ? data : v))
    } catch (err) {
      console.warn('[stock update]', err.message)
    }
  }


  // ── Image helpers ──────────────────────────────────────────────────────────

  // Rebuild the images_by_color map whenever images changes
  const rebuildImagesByColor = (updatedImages) => {
    const grouped = {}
    for (const img of updatedImages) {
      const key = (img.color || '').trim().toLowerCase() || '__unassigned__'
      grouped[key] = grouped[key] ?? []
      grouped[key].push(img)
    }
    setImagesByColor(grouped)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be under 5MB')
      return
    }

    setUploadingImage(true)
    setImageError('')
    try {
      const formData = new FormData()
      formData.append('file',          file)
      formData.append('is_primary',    images.length === 0)
      formData.append('display_order', images.length)

      // Attach variant_id if admin selected one — backend auto-fills color
      if (uploadVariantId) {
        formData.append('variant_id', uploadVariantId)
      }

      const { data } = await apiUpload(`/admin/products/${id}/images`, formData)
      const updated = [...images, data]
      setImages(updated)
      rebuildImagesByColor(updated)
    } catch (err) {
      setImageError(err.normalizedMessage ?? 'Upload failed')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (imageId) => {
    setDeletingImage(imageId)
    try {
      await api.delete(`/admin/products/${id}/images/${imageId}`)
      const updated = images.filter((img) => img.id !== imageId)
      setImages(updated)
      rebuildImagesByColor(updated)
    } catch (err) {
      console.warn('[image delete]', err.message)
    } finally {
      setDeletingImage(null)
    }
  }

  const handleSetPrimary = async (imageId) => {
    try {
      const img = images.find((i) => i.id === imageId)
      if (!img) return
      const response  = await fetch(img.image_url)
      const blob      = await response.blob()
      const formData  = new FormData()
      formData.append('file',          new File([blob], 'image.jpg', { type: blob.type }))
      formData.append('is_primary',    true)
      formData.append('display_order', 0)
      if (img.variant_id) formData.append('variant_id', img.variant_id)
      if (img.color)      formData.append('color',      img.color)

      await api.delete(`/admin/products/${id}/images/${imageId}`)
      const { data } = await apiUpload(`/admin/products/${id}/images`, formData)

      const updated = [
        data,
        ...images.filter((i) => i.id !== imageId).map((i) => ({ ...i, is_primary: false }))
      ]
      setImages(updated)
      rebuildImagesByColor(updated)
    } catch (err) {
      console.warn('[set primary]', err.message)
    }
  }

  // Unique colors that have variants defined — used for the variant selector
  const variantColors = [...new Set(
    variants.map((v) => v.color).filter(Boolean)
  )]


  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader size={24} strokeWidth={1.5}
            className="animate-spin text-brand-grey-500" />
          <p className="text-[11px] uppercase tracking-wider text-brand-grey-500">
            Loading product...
          </p>
        </div>
      </div>
    )
  }


  return (
    <div className="page-enter max-w-3xl">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <Link to="/admin/products"
          className="inline-flex items-center gap-2 text-[11px] uppercase
            tracking-wider text-brand-grey-500 hover:text-brand-900
            transition-colors mb-6">
          <ArrowLeft size={13} strokeWidth={1.5} />
          Back to products
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-2">Editing</p>
            <h1 className="text-3xl font-light tracking-wider uppercase
              text-brand-900 line-clamp-2">
              {product?.name ?? 'Product'}
            </h1>
          </div>
          <span className={`badge flex-shrink-0 mt-2
            ${product?.is_listed ? 'badge-black' : 'badge-grey'}`}>
            {product?.is_listed ? 'Live' : 'Draft'}
          </span>
        </div>
      </div>

      {/* ── Server error ──────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
          <p className="text-[12px] text-red-600">{serverError}</p>
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-brand-grey-200 mb-8">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`pb-3 mr-6 text-[12px] uppercase tracking-wider
              border-b-2 transition-all duration-200
              ${activeTab === key
                ? 'border-black text-brand-900'
                : 'border-transparent text-brand-grey-500 hover:text-brand-900'
              }`}>
            {label}
            {key === 'variants' && variants.length > 0 && (
              <span className="ml-2 text-brand-grey-500">({variants.length})</span>
            )}
            {key === 'images' && images.length > 0 && (
              <span className="ml-2 text-brand-grey-500">({images.length})</span>
            )}
          </button>
        ))}
      </div>


      {/* ═══ TAB: Details ══════════════════════════════════════════════════ */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveForm} noValidate
          className="flex flex-col gap-6 animate-fade-in">
          {formSuccess && (
            <div className="px-4 py-3 bg-green-50 border border-green-200
              flex items-center gap-2">
              <Check size={14} strokeWidth={1.5} className="text-green-600" />
              <p className="text-[12px] text-green-700">Product updated</p>
            </div>
          )}
          <div>
            <label className="input-label">Product Name *</label>
            <input type="text"
              className={`input-underline ${formErrors.name ? 'error' : ''}`}
              value={form.name} onChange={setField('name')} />
            {formErrors.name && (
              <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea rows={5}
              className="w-full bg-transparent border border-brand-grey-200
                px-3 py-2 text-[13px] text-brand-900 outline-none
                focus:border-black transition-colors resize-none
                placeholder:text-brand-grey-500"
              value={form.description} onChange={setField('description')}
              placeholder="Product description..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Category</label>
              <select className="input-underline bg-transparent cursor-pointer"
                value={form.category_id} onChange={setField('category_id')}>
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Base Price (₹) *</label>
              <input type="number" min="0" step="0.01"
                className={`input-underline ${formErrors.base_price ? 'error' : ''}`}
                value={form.base_price} onChange={setField('base_price')} />
              {formErrors.base_price && (
                <p className="text-[11px] text-red-600 mt-1">{formErrors.base_price}</p>
              )}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer group self-start">
            <div onClick={() => setForm((p) => ({ ...p, is_listed: !p.is_listed }))}
              className={`w-4 h-4 border flex items-center justify-center
                flex-shrink-0 cursor-pointer transition-colors
                ${form.is_listed
                  ? 'bg-black border-black'
                  : 'border-brand-grey-200 group-hover:border-black'}`}>
              {form.is_listed && (
                <Check size={10} strokeWidth={2} className="text-white" />
              )}
            </div>
            <span className="text-[12px] uppercase tracking-wider
              text-brand-grey-500 group-hover:text-brand-900 transition-colors">
              Listed (visible to customers)
            </span>
          </label>
          <button type="submit" disabled={savingForm}
            className="btn-primary self-start flex items-center gap-2">
            {savingForm
              ? <Loader size={13} strokeWidth={1.5} className="animate-spin" />
              : <Save size={13} strokeWidth={1.5} />}
            {savingForm ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}


      {/* ═══ TAB: Variants ═════════════════════════════════════════════════ */}
      {activeTab === 'variants' && (
        <div className="animate-fade-in flex flex-col gap-8">

          {variants.length > 0 && (
            <div>
              <h3 className="text-[12px] uppercase tracking-wider
                text-brand-grey-500 mb-4">Existing Variants</h3>
              <div className="grid grid-cols-7 gap-3 pb-2 mb-2
                border-b border-brand-grey-200">
                {['SKU', 'Color', 'Size', 'Stock', 'Override', '', ''].map((h) => (
                  <p key={h} className="text-[10px] uppercase tracking-widest
                    text-brand-grey-500">{h}</p>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {variants.map((v) => (
                  <div key={v.id} className="grid grid-cols-7 gap-3 items-center
                    py-2 border-b border-brand-grey-100">
                    <p className="text-[11px] font-mono text-brand-grey-500
                      truncate col-span-1">{v.sku}</p>
                    <div className="flex items-center gap-1.5">
                      {v.color && (
                        <div className="w-3 h-3 rounded-full border
                          border-brand-grey-200 flex-shrink-0"
                          style={{ backgroundColor: v.color?.toLowerCase() }} />
                      )}
                      <p className="text-[11px] uppercase tracking-wider
                        text-brand-900 truncate">{v.color ?? '—'}</p>
                    </div>
                    <p className="text-[11px] uppercase tracking-wider
                      text-brand-900">{v.size ?? '—'}</p>
                    <input type="number" min="0" value={v.stock}
                      onChange={(e) =>
                        setVariants((p) =>
                          p.map((vv) => vv.id === v.id
                            ? { ...vv, stock: Number(e.target.value) }
                            : vv)
                        )
                      }
                      onBlur={(e) => handleUpdateStock(v.id, e.target.value)}
                      className="w-full text-[12px] text-brand-900 bg-transparent
                        border-b border-brand-grey-200 focus:border-black
                        outline-none py-0.5" />
                    <p className="text-[11px] text-brand-900">
                      {v.price_override
                        ? `₹${v.price_override.toLocaleString('en-IN')}`
                        : '—'}
                    </p>
                    <div />
                    <button onClick={() => handleDeleteVariant(v.id)}
                      disabled={deletingVariant === v.id}
                      className="text-brand-grey-200 hover:text-red-600
                        transition-colors justify-self-end">
                      {deletingVariant === v.id
                        ? <Loader size={12} strokeWidth={1.5} className="animate-spin" />
                        : <Trash2 size={12} strokeWidth={1.5} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[12px] uppercase tracking-wider
              text-brand-grey-500 mb-4">Add New Variants</h3>
            {newVariants.length === 0 ? (
              <button onClick={addNewVariant}
                className="btn-outline flex items-center gap-2">
                <Plus size={13} strokeWidth={1.5} />
                Add Variant
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                {newVariants.map((variant, idx) => (
                  <div key={idx} className="border border-brand-grey-200
                    p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] uppercase tracking-wider
                        text-brand-grey-500">New Variant {idx + 1}</p>
                      <button onClick={() => removeNewVariant(idx)}
                        className="text-brand-grey-200 hover:text-red-600 transition-colors">
                        <X size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="input-label">SKU *</label>
                        <input type="text"
                          className={`input-underline uppercase
                            ${variantErrors[idx]?.sku ? 'error' : ''}`}
                          placeholder="e.g. TEE-BLK-L" value={variant.sku}
                          onChange={setNewVariantField(idx, 'sku')} />
                        {variantErrors[idx]?.sku && (
                          <p className="text-[11px] text-red-600 mt-1">
                            {variantErrors[idx].sku}</p>
                        )}
                      </div>
                      <div>
                        <label className="input-label">Color</label>
                        <input type="text" className="input-underline"
                          placeholder="e.g. Red" value={variant.color}
                          onChange={setNewVariantField(idx, 'color')} />
                      </div>
                      <div>
                        <label className="input-label">Size</label>
                        <input type="text" className="input-underline"
                          placeholder="e.g. L" value={variant.size}
                          onChange={setNewVariantField(idx, 'size')} />
                      </div>
                      <div>
                        <label className="input-label">Stock *</label>
                        <input type="number" min="0"
                          className={`input-underline
                            ${variantErrors[idx]?.stock ? 'error' : ''}`}
                          placeholder="0" value={variant.stock}
                          onChange={setNewVariantField(idx, 'stock')} />
                        {variantErrors[idx]?.stock && (
                          <p className="text-[11px] text-red-600 mt-1">
                            {variantErrors[idx].stock}</p>
                        )}
                      </div>
                      <div>
                        <label className="input-label">Price Override (₹)</label>
                        <input type="number" min="0" step="0.01"
                          className={`input-underline
                            ${variantErrors[idx]?.price_override ? 'error' : ''}`}
                          placeholder="Optional" value={variant.price_override}
                          onChange={setNewVariantField(idx, 'price_override')} />
                        {variantErrors[idx]?.price_override && (
                          <p className="text-[11px] text-red-600 mt-1">
                            {variantErrors[idx].price_override}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={addNewVariant}
                    className="btn-outline flex items-center gap-2">
                    <Plus size={13} strokeWidth={1.5} />
                    Add Another
                  </button>
                  <button onClick={handleSaveNewVariants} disabled={savingVariants}
                    className="btn-primary flex items-center gap-2">
                    {savingVariants && (
                      <Loader size={13} strokeWidth={1.5} className="animate-spin" />
                    )}
                    {savingVariants ? 'Saving...' : 'Save Variants'}
                  </button>
                </div>
                {variantSuccess && (
                  <p className="text-[12px] text-green-700 uppercase
                    tracking-wider flex items-center gap-1.5">
                    <Check size={13} strokeWidth={1.5} />
                    Variants saved
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ═══ TAB: Images ═══════════════════════════════════════════════════ */}
      {activeTab === 'images' && (
        <div className="animate-fade-in">

          {imageError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200">
              <p className="text-[12px] text-red-600">{imageError}</p>
            </div>
          )}

          {/* ── Images grouped by color ──────────────────────────────────── */}
          {Object.keys(imagesByColor).length > 0 ? (
            <div className="flex flex-col gap-8 mb-6">
              {Object.entries(imagesByColor).map(([colorKey, colorImages]) => (
                <div key={colorKey}>
                  {/* Color group header */}
                  <div className="flex items-center gap-2 mb-3">
                    {colorKey !== '__unassigned__' && (
                      <div className="w-3 h-3 rounded-full border
                        border-brand-grey-200 flex-shrink-0"
                        style={{ backgroundColor: colorKey }} />
                    )}
                    <p className="text-[11px] uppercase tracking-widest
                      text-brand-grey-500">
                      {colorKey === '__unassigned__'
                        ? 'All colours / unassigned'
                        : colorKey}
                    </p>
                    <span className="text-[10px] text-brand-grey-500">
                      ({colorImages.length})
                    </span>
                  </div>

                  {/* Image grid for this color */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {colorImages.map((img) => (
                      <div key={img.id}
                        className="relative group aspect-square
                          bg-brand-grey-100 overflow-hidden">
                        <img src={img.image_url} alt="Product"
                          className="w-full h-full object-cover"
                          draggable={false} />
                        {img.is_primary && (
                          <div className="absolute top-1.5 left-1.5 bg-black
                            text-white text-[9px] uppercase tracking-wider
                            px-1.5 py-0.5">
                            Primary
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0
                          group-hover:opacity-100 transition-opacity duration-200
                          flex items-center justify-center gap-2">
                          {!img.is_primary && (
                            <button onClick={() => handleSetPrimary(img.id)}
                              className="w-7 h-7 bg-white flex items-center
                                justify-center hover:bg-brand-grey-100"
                              title="Set as primary">
                              <Check size={12} strokeWidth={2} className="text-black" />
                            </button>
                          )}
                          <button onClick={() => handleDeleteImage(img.id)}
                            disabled={deletingImage === img.id}
                            className="w-7 h-7 bg-white flex items-center
                              justify-center hover:bg-red-50"
                            title="Delete image">
                            {deletingImage === img.id
                              ? <Loader size={11} strokeWidth={1.5}
                                  className="animate-spin text-red-600" />
                              : <Trash2 size={12} strokeWidth={1.5}
                                  className="text-red-600" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-brand-grey-500 uppercase
              tracking-wider mb-6">
              No images uploaded yet
            </p>
          )}

          {/* ── Upload section ────────────────────────────────────────────── */}
          <div className="border border-brand-grey-200 p-5 flex flex-col gap-4">
            <p className="text-[12px] uppercase tracking-wider font-medium
              text-brand-900">
              Upload Image
            </p>

            {/* Variant selector — which color does this image belong to? */}
            <div>
              <label className="input-label flex items-center gap-1.5">
                <Tag size={11} strokeWidth={1.5} />
                Link to colour variant
              </label>
              <select
                value={uploadVariantId}
                onChange={(e) => setUploadVariantId(e.target.value)}
                className="input-underline bg-transparent cursor-pointer"
              >
                <option value="">
                  No specific colour (shows for all variants)
                </option>
                {/* Unique variants with a color, deduplicated by color */}
                {variants
                  .filter((v) => v.color)
                  .reduce((acc, v) => {
                    // one option per unique color, using the first variant's id
                    if (!acc.find((a) => a.color === v.color)) acc.push(v)
                    return acc
                  }, [])
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.color}
                    </option>
                  ))
                }
              </select>
              <p className="text-[11px] text-brand-grey-500 mt-1.5">
                Customers see only the images for their selected colour.
                Leave unset for images that apply to all colours (e.g. size chart).
              </p>
            </div>

            {/* Upload button */}
            <div>
              <input ref={fileInputRef} type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleImageUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || images.length >= 8}
                className="btn-outline flex items-center gap-2">
                {uploadingImage
                  ? <Loader size={13} strokeWidth={1.5} className="animate-spin" />
                  : <Upload size={13} strokeWidth={1.5} />}
                {uploadingImage
                  ? 'Uploading...'
                  : images.length >= 8
                    ? 'Max 8 images reached'
                    : 'Choose & upload image'}
              </button>
              <p className="text-[11px] text-brand-grey-500 mt-2 uppercase
                tracking-wider">
                JPEG, PNG or WebP · Max 5MB · Max 8 images total
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}