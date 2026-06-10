// src/pages/admin/AddProduct.jsx

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Loader,
  Upload, X, Check, Image
} from 'lucide-react'
import api, { apiUpload } from '../../api/axios'

const EMPTY_VARIANT = {
  size:           '',
  color:          '',
  stock:          0,
  price_override: '',
  sku:            '',
}

export default function AddProduct() {
  const navigate = useNavigate()

  // ── Product form ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:        '',
    description: '',
    category_id: '',
    base_price:  '',
    is_listed:   true,
  })
  const [formErrors,  setFormErrors]  = useState({})
  const [categories,  setCategories]  = useState([])
  const [saving,      setSaving]      = useState(false)
  const [savedProduct, setSavedProduct] = useState(null)
  const [serverError,  setServerError]  = useState('')

  // ── Variants ───────────────────────────────────────────────────────────────
  const [variants,     setVariants]     = useState([{ ...EMPTY_VARIANT }])
  const [variantErrors, setVariantErrors] = useState([{}])
  const [savingVariants, setSavingVariants] = useState(false)
  const [variantSuccess, setVariantSuccess] = useState(false)

  // ── Images ─────────────────────────────────────────────────────────────────
  const [images,         setImages]         = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageError,     setImageError]     = useState('')
  const fileInputRef = useRef(null)


  // ── Fetch categories ───────────────────────────────────────────────────────

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data))
      .catch(console.error)
  }, [])


  // ── Form field helpers ─────────────────────────────────────────────────────

  const setField = (field) => (e) => {
    const value = e.target.type === 'checkbox'
      ? e.target.checked
      : e.target.value
    setForm((p) => ({ ...p, [field]: value }))
    setFormErrors((p) => ({ ...p, [field]: '' }))
    setServerError('')
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim())   errs.name       = 'Product name is required'
    if (!form.base_price)    errs.base_price  = 'Base price is required'
    else if (isNaN(form.base_price) || Number(form.base_price) <= 0)
      errs.base_price = 'Enter a valid price'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }


  // ── Step 1: Save product ───────────────────────────────────────────────────

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    setServerError('')
    try {
      const formData = new FormData()
      formData.append('name',        form.name.trim())
      formData.append('description', form.description.trim())
      formData.append('base_price',  Number(form.base_price))
      formData.append('is_listed',   form.is_listed)
      if (form.category_id) formData.append('category_id', form.category_id)

      const { data } = await apiUpload('/admin/products', formData)
      setSavedProduct(data)
    } catch (err) {
      setServerError(err.normalizedMessage ?? 'Failed to create product')
    } finally {
      setSaving(false)
    }
  }


  // ── Variant helpers ────────────────────────────────────────────────────────

  const setVariantField = (index, field) => (e) => {
    const value = field === 'stock'
      ? Number(e.target.value)
      : e.target.value
    setVariants((p) => p.map((v, i) => i === index ? { ...v, [field]: value } : v))
    setVariantErrors((p) => p.map((e, i) => i === index ? { ...e, [field]: '' } : e))
  }

  const addVariant = () => {
    setVariants((p) => [...p, { ...EMPTY_VARIANT }])
    setVariantErrors((p) => [...p, {}])
  }

  const removeVariant = (index) => {
    setVariants((p) => p.filter((_, i) => i !== index))
    setVariantErrors((p) => p.filter((_, i) => i !== index))
  }

  const validateVariants = () => {
    const errors = variants.map((v) => {
      const errs = {}
      if (!v.sku.trim())      errs.sku   = 'SKU required'
      if (v.stock < 0)        errs.stock = 'Cannot be negative'
      if (v.price_override && (isNaN(v.price_override) || Number(v.price_override) <= 0))
        errs.price_override = 'Invalid price'
      return errs
    })
    setVariantErrors(errors)
    return errors.every((e) => Object.keys(e).length === 0)
  }


  // ── Step 2: Save variants ──────────────────────────────────────────────────

  const handleSaveVariants = async () => {
    if (!savedProduct) return
    if (!validateVariants()) return
    setSavingVariants(true)
    setVariantSuccess(false)
    try {
      for (const v of variants) {
        if (!v.sku.trim()) continue
        await api.post(`/admin/products/${savedProduct.id}/variants`, {
          size:           v.size   || null,
          color:          v.color  || null,
          stock:          Number(v.stock),
          price_override: v.price_override ? Number(v.price_override) : null,
          sku:            v.sku.trim().toUpperCase(),
        })
      }
      setVariantSuccess(true)
    } catch (err) {
      setServerError(err.normalizedMessage ?? 'Failed to save variants')
    } finally {
      setSavingVariants(false)
    }
  }


  // ── Step 3: Upload image ───────────────────────────────────────────────────

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !savedProduct) return

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

      const { data } = await apiUpload(
        `/admin/products/${savedProduct.id}/images`,
        formData
      )
      setImages((p) => [...p, data])
    } catch (err) {
      setImageError(err.normalizedMessage ?? 'Upload failed')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!savedProduct) return
    try {
      await api.delete(`/admin/products/${savedProduct.id}/images/${imageId}`)
      setImages((p) => p.filter((img) => img.id !== imageId))
    } catch (err) {
      console.warn('[image delete]', err.message)
    }
  }

  const handleSetPrimary = async (imageId) => {
    if (!savedProduct) return
    try {
      await api.delete(`/admin/products/${savedProduct.id}/images/${imageId}`)
      const img = images.find((i) => i.id === imageId)
      if (!img) return
      const formData = new FormData()
      const response = await fetch(img.image_url)
      const blob     = await response.blob()
      formData.append('file',          new File([blob], 'image.jpg', { type: blob.type }))
      formData.append('is_primary',    true)
      formData.append('display_order', 0)
      const { data } = await apiUpload(
        `/admin/products/${savedProduct.id}/images`,
        formData
      )
      setImages((p) => [
        data,
        ...p.filter((i) => i.id !== imageId).map((i) => ({ ...i, is_primary: false }))
      ])
    } catch (err) {
      console.warn('[set primary]', err.message)
    }
  }


  // ── Finish ─────────────────────────────────────────────────────────────────

  const handleFinish = () => {
    navigate('/admin/products')
  }


  return (
    <div className="page-enter max-w-3xl">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-[11px] uppercase
            tracking-wider text-brand-grey-500 hover:text-brand-900
            transition-colors mb-6"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Back to products
        </Link>
        <p className="text-[11px] uppercase tracking-widest
          text-brand-grey-500 mb-2">
          Catalogue
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase
          text-brand-900">
          Add Product
        </h1>
      </div>


      {/* ── Step indicator ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 mb-10">
        {[
          { num: 1, label: 'Details',  done: !!savedProduct  },
          { num: 2, label: 'Variants', done: variantSuccess  },
          { num: 3, label: 'Images',   done: images.length > 0 },
        ].map(({ num, label, done }, idx) => (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 flex items-center justify-center
                text-[11px] border transition-colors duration-200
                ${done
                  ? 'bg-black border-black text-white'
                  : savedProduct && num <= (variantSuccess ? 3 : 2)
                    ? 'border-black text-brand-900'
                    : 'border-brand-grey-200 text-brand-grey-500'
                }`}>
                {done ? <Check size={12} strokeWidth={2} /> : num}
              </div>
              <p className="text-[10px] uppercase tracking-wider
                text-brand-grey-500 whitespace-nowrap">
                {label}
              </p>
            </div>
            {idx < 2 && (
              <div className={`w-16 h-px mb-5 mx-2 transition-colors
                ${done ? 'bg-black' : 'bg-brand-grey-200'}`}
              />
            )}
          </div>
        ))}
      </div>


      {/* ── Server error ──────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
          <p className="text-[12px] text-red-600">{serverError}</p>
        </div>
      )}


      {/* ═══ STEP 1: Product details ═══════════════════════════════════════ */}
      <section className={`mb-10 ${savedProduct ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[13px] uppercase tracking-wider font-medium
            text-brand-900">
            1. Product Details
          </h2>
          {savedProduct && (
            <span className="badge badge-black flex items-center gap-1">
              <Check size={10} strokeWidth={2} /> Saved
            </span>
          )}
        </div>

        <form
          onSubmit={handleSaveProduct}
          noValidate
          className="flex flex-col gap-6"
        >
          {/* Name */}
          <div>
            <label className="input-label">Product Name *</label>
            <input
              type="text"
              className={`input-underline ${formErrors.name ? 'error' : ''}`}
              placeholder="e.g. Oversized Cotton Tee"
              value={form.name}
              onChange={setField('name')}
              disabled={!!savedProduct}
            />
            {formErrors.name && (
              <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="input-label">Description</label>
            <textarea
              rows={4}
              className="w-full bg-transparent border border-brand-grey-200
                px-3 py-2 text-[13px] text-brand-900 outline-none
                focus:border-black transition-colors resize-none
                placeholder:text-brand-grey-500"
              placeholder="Product description..."
              value={form.description}
              onChange={setField('description')}
              disabled={!!savedProduct}
            />
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="input-label">Category</label>
              <select
                className="input-underline bg-transparent cursor-pointer"
                value={form.category_id}
                onChange={setField('category_id')}
                disabled={!!savedProduct}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Base Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`input-underline ${formErrors.base_price ? 'error' : ''}`}
                placeholder="999.00"
                value={form.base_price}
                onChange={setField('base_price')}
                disabled={!!savedProduct}
              />
              {formErrors.base_price && (
                <p className="text-[11px] text-red-600 mt-1">
                  {formErrors.base_price}
                </p>
              )}
            </div>
          </div>

          {/* Listed toggle */}
          <label className="flex items-center gap-3 cursor-pointer group
            self-start">
            <div
              onClick={() => !savedProduct && setForm((p) => ({
                ...p, is_listed: !p.is_listed
              }))}
              className={`w-4 h-4 border flex items-center justify-center
                flex-shrink-0 transition-colors
                ${form.is_listed
                  ? 'bg-black border-black'
                  : 'border-brand-grey-200 group-hover:border-black'
                }
                ${savedProduct ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {form.is_listed && (
                <Check size={10} strokeWidth={2} className="text-white" />
              )}
            </div>
            <span className="text-[12px] uppercase tracking-wider
              text-brand-grey-500 group-hover:text-brand-900 transition-colors">
              List product immediately
            </span>
          </label>

          {!savedProduct && (
            <button
              type="submit"
              disabled={saving}
              className="btn-primary self-start flex items-center gap-2"
            >
              {saving && (
                <Loader size={13} strokeWidth={1.5} className="animate-spin" />
              )}
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          )}
        </form>
      </section>


      {/* ═══ STEP 2: Variants ══════════════════════════════════════════════ */}
      {savedProduct && (
        <section className="mb-10 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[13px] uppercase tracking-wider font-medium
              text-brand-900">
              2. Variants
            </h2>
            {variantSuccess && (
              <span className="badge badge-black flex items-center gap-1">
                <Check size={10} strokeWidth={2} /> Saved
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {variants.map((variant, idx) => (
              <div
                key={idx}
                className="border border-brand-grey-200 p-5
                  flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-grey-500">
                    Variant {idx + 1}
                  </p>
                  {variants.length > 1 && (
                    <button
                      onClick={() => removeVariant(idx)}
                      className="text-brand-grey-200 hover:text-red-600
                        transition-colors"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* SKU */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="input-label">SKU *</label>
                    <input
                      type="text"
                      className={`input-underline uppercase
                        ${variantErrors[idx]?.sku ? 'error' : ''}`}
                      placeholder="e.g. TEE-BLK-M"
                      value={variant.sku}
                      onChange={setVariantField(idx, 'sku')}
                    />
                    {variantErrors[idx]?.sku && (
                      <p className="text-[11px] text-red-600 mt-1">
                        {variantErrors[idx].sku}
                      </p>
                    )}
                  </div>

                  {/* Color */}
                  <div>
                    <label className="input-label">Color</label>
                    <input
                      type="text"
                      className="input-underline"
                      placeholder="e.g. Black"
                      value={variant.color}
                      onChange={setVariantField(idx, 'color')}
                    />
                  </div>

                  {/* Size */}
                  <div>
                    <label className="input-label">Size</label>
                    <input
                      type="text"
                      className="input-underline"
                      placeholder="e.g. M"
                      value={variant.size}
                      onChange={setVariantField(idx, 'size')}
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="input-label">Stock *</label>
                    <input
                      type="number"
                      min="0"
                      className={`input-underline
                        ${variantErrors[idx]?.stock ? 'error' : ''}`}
                      placeholder="0"
                      value={variant.stock}
                      onChange={setVariantField(idx, 'stock')}
                    />
                    {variantErrors[idx]?.stock && (
                      <p className="text-[11px] text-red-600 mt-1">
                        {variantErrors[idx].stock}
                      </p>
                    )}
                  </div>

                  {/* Price override */}
                  <div>
                    <label className="input-label">
                      Price Override (₹)
                      <span className="text-brand-grey-500 normal-case
                        tracking-normal ml-1">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`input-underline
                        ${variantErrors[idx]?.price_override ? 'error' : ''}`}
                      placeholder="Leave blank to use base price"
                      value={variant.price_override}
                      onChange={setVariantField(idx, 'price_override')}
                    />
                    {variantErrors[idx]?.price_override && (
                      <p className="text-[11px] text-red-600 mt-1">
                        {variantErrors[idx].price_override}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add variant + save */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={addVariant}
              className="btn-outline flex items-center gap-2"
            >
              <Plus size={13} strokeWidth={1.5} />
              Add Variant
            </button>
            <button
              onClick={handleSaveVariants}
              disabled={savingVariants}
              className="btn-primary flex items-center gap-2"
            >
              {savingVariants && (
                <Loader size={13} strokeWidth={1.5} className="animate-spin" />
              )}
              {savingVariants ? 'Saving...' : 'Save Variants'}
            </button>
          </div>

          {variantSuccess && (
            <p className="text-[12px] text-green-700 uppercase tracking-wider
              mt-3 flex items-center gap-1.5">
              <Check size={13} strokeWidth={1.5} />
              Variants saved
            </p>
          )}
        </section>
      )}


      {/* ═══ STEP 3: Images ════════════════════════════════════════════════ */}
      {savedProduct && (
        <section className="mb-10 animate-fade-in">
          <h2 className="text-[13px] uppercase tracking-wider font-medium
            text-brand-900 mb-6">
            3. Images
          </h2>

          {/* Image error */}
          {imageError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200">
              <p className="text-[12px] text-red-600">{imageError}</p>
            </div>
          )}

          {/* Images grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-square bg-brand-grey-100
                    overflow-hidden"
                >
                  <img
                    src={img.image_url}
                    alt="Product"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />

                  {/* Primary badge */}
                  {img.is_primary && (
                    <div className="absolute top-1.5 left-1.5 bg-black
                      text-white text-[9px] uppercase tracking-wider px-1.5 py-0.5">
                      Primary
                    </div>
                  )}

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0
                    group-hover:opacity-100 transition-opacity duration-200
                    flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button
                        onClick={() => handleSetPrimary(img.id)}
                        className="w-7 h-7 bg-white flex items-center
                          justify-center hover:bg-brand-grey-100"
                        title="Set as primary"
                      >
                        <Check size={12} strokeWidth={2} className="text-black" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="w-7 h-7 bg-white flex items-center
                        justify-center hover:bg-red-50"
                      title="Delete image"
                    >
                      <Trash2 size={12} strokeWidth={1.5} className="text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || images.length >= 8}
              className="btn-outline flex items-center gap-2"
            >
              {uploadingImage ? (
                <Loader size={13} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Upload size={13} strokeWidth={1.5} />
              )}
              {uploadingImage
                ? 'Uploading...'
                : images.length >= 8
                  ? 'Max 8 images'
                  : 'Upload Image'
              }
            </button>
            <p className="text-[11px] text-brand-grey-500 mt-2 uppercase
              tracking-wider">
              JPEG, PNG or WebP · Max 5MB per image · Max 8 images
            </p>
          </div>
        </section>
      )}


      {/* ── Finish button ─────────────────────────────────────────────────── */}
      {savedProduct && (
        <div className="flex items-center gap-4 pt-6
          border-t border-brand-grey-200 animate-fade-in">
          <button
            onClick={handleFinish}
            className="btn-primary flex items-center gap-2"
          >
            <Check size={14} strokeWidth={1.5} />
            Finish & View Products
          </button>
          <Link
            to={`/admin/products/${savedProduct.id}/edit`}
            className="btn-outline"
          >
            Continue Editing
          </Link>
        </div>
      )}

    </div>
  )
}