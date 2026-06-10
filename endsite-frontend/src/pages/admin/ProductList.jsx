// src/pages/admin/ProductList.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff,
  Loader, Package, ChevronDown, ChevronUp, Image, AlertTriangle
} from 'lucide-react'
import api from '../../api/axios'

export default function AdminProductList() {
  const [products,       setProducts]       = useState([])
  const [categories,     setCategories]     = useState([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [listedFilter,   setListedFilter]   = useState('')
  const [deletingId,     setDeletingId]     = useState(null)
  const [togglingId,     setTogglingId]     = useState(null)
  const [expandedId,     setExpandedId]     = useState(null)
  const [error,          setError]          = useState('')
  const [confirmDelete,  setConfirmDelete]  = useState(null) // product to confirm


  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/admin/products'),
          api.get('/categories'),
        ])
        setProducts(productsRes.data   ?? [])
        setCategories(categoriesRes.data ?? [])
      } catch (err) {
        setError(err.normalizedMessage ?? 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])


  // ── Toggle listed ──────────────────────────────────────────────────────────

  const handleToggleListed = async (product) => {
    setTogglingId(product.id)
    try {
      const formData = new FormData()
      formData.append('name',        product.name)
      formData.append('description', product.description ?? '')
      formData.append('base_price',  product.base_price)
      formData.append('is_listed',   !product.is_listed)
      if (product.category_id) formData.append('category_id', product.category_id)

      const { data } = await api.put(
        `/admin/products/${product.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setProducts((p) =>
        p.map((pr) => pr.id === product.id ? { ...pr, ...data } : pr)
      )
    } catch (err) {
      setError(err.normalizedMessage ?? 'Failed to toggle listing')
    } finally {
      setTogglingId(null)
    }
  }


  // ── Delete product (with all variants + images) ────────────────────────────

  const handleDelete = async (product) => {
    setDeletingId(product.id)
    setConfirmDelete(null)
    setError('')
    try {
      await api.delete(`/admin/products/${product.id}`)
      setProducts((p) => p.filter((pr) => pr.id !== product.id))
      // Close expanded row if it was this product
      if (expandedId === product.id) setExpandedId(null)
    } catch (err) {
      setError(err.normalizedMessage ?? 'Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }


  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    const matchSearch   = !search         || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.category_name === categoryFilter
    const matchListed   = listedFilter === ''
      ? true
      : listedFilter === 'listed' ? p.is_listed : !p.is_listed
    return matchSearch && matchCategory && matchListed
  })


  return (
    <div className="page-enter">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center
        justify-between gap-4 mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-widest
            text-brand-grey-500 mb-2">Catalogue</p>
          <h1 className="text-3xl font-light tracking-wider uppercase
            text-brand-900">
            Products
            <span className="text-brand-grey-500 ml-3 text-xl">
              ({products.length})
            </span>
          </h1>
        </div>
        <Link
          to="/admin/products/add"
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={14} strokeWidth={1.5} />
          Add Product
        </Link>
      </div>


      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200
          flex items-center gap-2">
          <AlertTriangle size={14} strokeWidth={1.5} className="text-red-600 flex-shrink-0" />
          <p className="text-[12px] text-red-600">{error}</p>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}


      {/* ── Confirm delete modal ───────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center
          justify-center px-4">
          <div className="bg-white w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-start gap-3 mb-5">
              <AlertTriangle
                size={20}
                strokeWidth={1.5}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-[14px] font-medium text-brand-900 mb-1">
                  Delete "{confirmDelete.name}"?
                </p>
                <p className="text-[12px] text-brand-grey-500 leading-relaxed">
                  This will permanently delete the product along with
                  <strong> all {confirmDelete.variant_count ?? 0} variants</strong> and
                  <strong> all {confirmDelete.image_count ?? 0} images</strong>.
                  This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="btn-primary bg-red-600 border-red-600
                  flex items-center gap-2"
              >
                {deletingId === confirmDelete.id ? (
                  <Loader size={13} strokeWidth={1.5} className="animate-spin" />
                ) : (
                  <Trash2 size={13} strokeWidth={1.5} />
                )}
                {deletingId === confirmDelete.id
                  ? 'Deleting...'
                  : 'Yes, Delete Everything'
                }
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} strokeWidth={1.5}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-grey-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-5 pr-3 py-1.5 text-[13px] bg-transparent
              border-b border-brand-grey-200 focus:border-black outline-none
              placeholder:text-brand-grey-500 transition-colors"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-[12px] uppercase tracking-wider px-3 py-2
            border border-brand-grey-200 bg-white text-brand-900
            hover:border-black transition-colors outline-none cursor-pointer"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <select
          value={listedFilter}
          onChange={(e) => setListedFilter(e.target.value)}
          className="text-[12px] uppercase tracking-wider px-3 py-2
            border border-brand-grey-200 bg-white text-brand-900
            hover:border-black transition-colors outline-none cursor-pointer"
        >
          <option value="">All status</option>
          <option value="listed">Listed</option>
          <option value="unlisted">Unlisted</option>
        </select>

        <p className="text-[11px] uppercase tracking-wider
          text-brand-grey-500 ml-auto">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>


      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="border border-brand-grey-200 overflow-hidden">

        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3
          border-b border-brand-grey-200 bg-brand-grey-100">
          {[
            { label: 'Product',  cols: 4 },
            { label: 'Category', cols: 2 },
            { label: 'Price',    cols: 2 },
            { label: 'Variants', cols: 1 },
            { label: 'Status',   cols: 1 },
            { label: 'Actions',  cols: 2 },
          ].map(({ label, cols }) => (
            <div key={label} className={`col-span-${cols}`}>
              <p className="text-[11px] uppercase tracking-widest text-brand-grey-500">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col divide-y divide-brand-grey-200">
            {Array(5).fill(null).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-grey-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 h-4 bg-brand-grey-100 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <Package size={36} strokeWidth={0.75}
              className="text-brand-grey-200 mx-auto mb-4" />
            <p className="text-[12px] uppercase tracking-wider text-brand-grey-500">
              No products found
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col divide-y divide-brand-grey-200">
            {filtered.map((product) => (
              <div key={product.id}>

                {/* Product row */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4
                  px-5 py-4 items-center hover:bg-brand-grey-100
                  transition-colors duration-200">

                  {/* Product info */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-grey-100 overflow-hidden
                      flex-shrink-0 flex items-center justify-center">
                      {product.primary_image ? (
                        <img
                          src={product.primary_image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <Image size={14} strokeWidth={1}
                          className="text-brand-grey-200" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] uppercase tracking-wider
                        text-brand-900 line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-brand-grey-500 font-mono mt-0.5">
                        {product.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="md:col-span-2">
                    <p className="text-[12px] uppercase tracking-wider
                      text-brand-grey-500">
                      {product.category_name ?? '—'}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="md:col-span-2">
                    <p className="text-[13px] text-brand-900">
                      ₹{product.base_price?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Variant count */}
                  <div className="md:col-span-1">
                    <p className="text-[12px] text-brand-grey-500">
                      {product.variant_count ?? 0}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1">
                    <span className={`badge
                      ${product.is_listed ? 'badge-black' : 'badge-grey'}`}>
                      {product.is_listed ? 'Live' : 'Draft'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-2 flex items-center gap-3">

                    {/* Toggle listed */}
                    <button
                      onClick={() => handleToggleListed(product)}
                      disabled={togglingId === product.id}
                      title={product.is_listed ? 'Unlist' : 'List'}
                      className="text-brand-grey-500 hover:text-brand-900
                        transition-colors"
                    >
                      {togglingId === product.id ? (
                        <Loader size={15} strokeWidth={1.5}
                          className="animate-spin" />
                      ) : product.is_listed ? (
                        <EyeOff size={15} strokeWidth={1.5} />
                      ) : (
                        <Eye size={15} strokeWidth={1.5} />
                      )}
                    </button>

                    {/* Edit */}
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className="text-brand-grey-500 hover:text-brand-900
                        transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={15} strokeWidth={1.5} />
                    </Link>

                    {/* Expand variants */}
                    <button
                      onClick={() =>
                        setExpandedId((p) =>
                          p === product.id ? null : product.id
                        )
                      }
                      className="text-brand-grey-500 hover:text-brand-900
                        transition-colors"
                      title="View variants"
                    >
                      {expandedId === product.id ? (
                        <ChevronUp size={15} strokeWidth={1.5} />
                      ) : (
                        <ChevronDown size={15} strokeWidth={1.5} />
                      )}
                    </button>

                    {/* Delete — opens confirm modal */}
                    <button
                      onClick={() => setConfirmDelete(product)}
                      disabled={deletingId === product.id}
                      title="Delete product"
                      className="text-brand-grey-200 hover:text-red-600
                        transition-colors"
                    >
                      {deletingId === product.id ? (
                        <Loader size={15} strokeWidth={1.5}
                          className="animate-spin text-red-400" />
                      ) : (
                        <Trash2 size={15} strokeWidth={1.5} />
                      )}
                    </button>

                  </div>
                </div>

                {/* Expanded variants */}
                {expandedId === product.id && (
                  <VariantRows
                    productId={product.id}
                    onVariantDeleted={() => {
                      // Refresh variant count
                      setProducts((p) =>
                        p.map((pr) =>
                          pr.id === product.id
                            ? { ...pr, variant_count: Math.max(0, (pr.variant_count ?? 1) - 1) }
                            : pr
                        )
                      )
                    }}
                  />
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}


// ── Variant sub-rows ───────────────────────────────────────────────────────────

function VariantRows({ productId, onVariantDeleted }) {
  const [variants,   setVariants]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error,      setError]      = useState('')

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const { data } = await api.get(`/products/${productId}`)
        setVariants(data.variants ?? [])
      } catch (err) {
        setError('Failed to load variants')
      } finally {
        setLoading(false)
      }
    }
    fetchVariants()
  }, [productId])

  const handleDelete = async (variantId) => {
    setDeletingId(variantId)
    setError('')
    try {
      await api.delete(`/admin/variants/${variantId}`)
      setVariants((p) => p.filter((v) => v.id !== variantId))
      onVariantDeleted?.()
    } catch (err) {
      setError(err.normalizedMessage ?? 'Failed to delete variant')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-3 bg-brand-grey-100 border-t border-brand-grey-200">
        <div className="h-4 w-48 bg-brand-grey-200 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-brand-grey-100 border-t border-brand-grey-200
      px-5 py-4 animate-fade-in">

      {error && (
        <p className="text-[11px] text-red-600 mb-3">{error}</p>
      )}

      {variants.length === 0 ? (
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-brand-grey-500">
            No variants
          </p>
          <Link
            to={`/admin/products/${productId}/edit`}
            className="text-[11px] uppercase tracking-wider text-brand-grey-500
              hover:text-brand-900 transition-colors flex items-center gap-1"
          >
            <Plus size={11} strokeWidth={1.5} />
            Add variants
          </Link>
        </div>
      ) : (
        <>
          {/* Variant table header */}
          <div className="grid grid-cols-7 gap-4 pb-2 mb-2
            border-b border-brand-grey-200">
            {['SKU', 'Color', 'Size', 'Stock', 'Price Override', '', ''].map((h) => (
              <p key={h} className="text-[10px] uppercase tracking-widest
                text-brand-grey-500">
                {h}
              </p>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {variants.map((v) => (
              <div key={v.id}
                className="grid grid-cols-7 gap-4 items-center py-1.5
                  hover:bg-brand-grey-200/40 transition-colors px-1">

                <p className="text-[11px] font-mono text-brand-grey-500 truncate">
                  {v.sku}
                </p>

                <div className="flex items-center gap-1.5">
                  {v.color && (
                    <div
                      className="w-3 h-3 rounded-full border border-brand-grey-200 flex-shrink-0"
                      style={{ backgroundColor: v.color?.toLowerCase() }}
                    />
                  )}
                  <p className="text-[11px] uppercase tracking-wider
                    text-brand-900 truncate">
                    {v.color ?? '—'}
                  </p>
                </div>

                <p className="text-[11px] uppercase tracking-wider text-brand-900">
                  {v.size ?? '—'}
                </p>

                <p className={`text-[11px] uppercase tracking-wider
                  ${v.stock <= 0
                    ? 'text-red-600'
                    : v.stock <= 5
                      ? 'text-orange-500'
                      : 'text-brand-900'
                  }`}>
                  {v.stock}
                </p>

                <p className="text-[11px] text-brand-900">
                  {v.price_override
                    ? `₹${v.price_override.toLocaleString('en-IN')}`
                    : '—'
                  }
                </p>

                {/* Edit link */}
                <Link
                  to={`/admin/products/${productId}/edit`}
                  className="text-brand-grey-500 hover:text-brand-900
                    transition-colors justify-self-center"
                  title="Edit variant"
                >
                  <Edit2 size={12} strokeWidth={1.5} />
                </Link>

                {/* Delete variant */}
                <button
                  onClick={() => handleDelete(v.id)}
                  disabled={deletingId === v.id}
                  className="text-brand-grey-200 hover:text-red-600
                    transition-colors justify-self-end"
                  title="Delete this variant"
                >
                  {deletingId === v.id ? (
                    <Loader size={12} strokeWidth={1.5} className="animate-spin text-red-400" />
                  ) : (
                    <Trash2 size={12} strokeWidth={1.5} />
                  )}
                </button>

              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-brand-grey-200">
            <Link
              to={`/admin/products/${productId}/edit`}
              className="text-[11px] uppercase tracking-wider text-brand-grey-500
                hover:text-brand-900 transition-colors flex items-center gap-1.5"
            >
              <Plus size={11} strokeWidth={1.5} />
              Add / edit variants
            </Link>
          </div>
        </>
      )}
    </div>
  )
}