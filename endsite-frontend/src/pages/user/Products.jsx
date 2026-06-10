// src/pages/user/Products.jsx

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react'
import api from '../../api/axios'
import ProductCard from '../../components/ProductCard'
import LoginPromptModal from '../../components/LoginPromptModal'

const SORT_OPTIONS = [
  { label: 'Newest',       value: 'created_at_desc' },
  { label: 'Oldest',       value: 'created_at_asc'  },
  { label: 'Price: Low',   value: 'price_asc'        },
  { label: 'Price: High',  value: 'price_desc'       },
  { label: 'Name: A–Z',   value: 'name_asc'         },
  { label: 'Name: Z–A',   value: 'name_desc'        },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Filter state — synced with URL params ──────────────────────────────────
  const [search,    setSearch]    = useState(searchParams.get('search')   ?? '')
  const [category,  setCategory]  = useState(searchParams.get('category') ?? '')
  const [color,     setColor]     = useState(searchParams.get('color')    ?? '')
  const [size,      setSize]      = useState(searchParams.get('size')     ?? '')
  const [minPrice,  setMinPrice]  = useState(searchParams.get('min_price') ?? '')
  const [maxPrice,  setMaxPrice]  = useState(searchParams.get('max_price') ?? '')
  const [sort,      setSort]      = useState(searchParams.get('sort')     ?? 'created_at_desc')

  // ── UI state ───────────────────────────────────────────────────────────────
  const [products,      setProducts]      = useState([])
  const [categories,    setCategories]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filtersOpen,   setFiltersOpen]   = useState(false)
  const [sortOpen,      setSortOpen]      = useState(false)
  const [modalOpen,     setModalOpen]     = useState(false)

  const sortRef    = useRef(null)
  const searchRef  = useRef(null)


  // ── Close sort dropdown on outside click ───────────────────────────────────

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])


  // ── Fetch categories once ──────────────────────────────────────────────────

  useEffect(() => {
    api.get('/categories')
      .then(({ data }) => setCategories(data))
      .catch(console.error)
  }, [])


  // ── Build params and fetch products ───────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)   params.search    = search
      if (category) params.category  = category
      if (color)    params.color     = color
      if (size)     params.size      = size
      if (minPrice) params.min_price = minPrice
      if (maxPrice) params.max_price = maxPrice
      if (sort)     params.sort      = sort

      const { data } = await api.get('/products', { params })
      setProducts(data)

      // Sync URL
      const urlParams = {}
      Object.entries(params).forEach(([k, v]) => { if (v) urlParams[k] = v })
      setSearchParams(urlParams, { replace: true })
    } catch (err) {
      console.error('[products] Fetch error:', err.message)
    } finally {
      setLoading(false)
    }
  }, [search, category, color, size, minPrice, maxPrice, sort])


  // ── Fetch on filter change ─────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])


  // ── Clear all filters ──────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setColor('')
    setSize('')
    setMinPrice('')
    setMaxPrice('')
    setSort('created_at_desc')
    setSearchParams({})
  }

  const hasActiveFilters = search || category || color || size || minPrice || maxPrice


  // ── Active filter count ────────────────────────────────────────────────────

  const activeFilterCount = [search, category, color, size, minPrice, maxPrice]
    .filter(Boolean).length


  // ── Unique colors and sizes from products ──────────────────────────────────

  const allColors = [...new Set(
    products.flatMap((p) => p.colors ?? []).filter(Boolean)
  )]

  const allSizes = [...new Set(
    products.flatMap((p) => p.sizes ?? []).filter(Boolean)
  )]


  return (
    <>
      <div className="min-h-screen bg-white page-enter">

        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="border-b border-brand-grey-200">
          <div className="max-w-content mx-auto px-10 py-12">
            <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-2">
              {category ? category : 'All'}
            </p>
            <h1 className="text-3xl font-light tracking-wider uppercase text-brand-900">
              {category ? category : 'Shop'}
            </h1>
            {!loading && (
              <p className="text-[12px] text-brand-grey-500 mt-2 uppercase tracking-wider">
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            )}
          </div>
        </div>


        {/* ── Toolbar — search, filter, sort ──────────────────────────────────── */}
        <div className="sticky top-[64px] z-30 bg-white border-b border-brand-grey-200">
          <div className="max-w-content mx-auto px-10 py-3
            flex items-center gap-4">

            {/* Search */}
            <div className="flex-1 relative max-w-xs">
              <Search
                size={14}
                strokeWidth={1.5}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-grey-500"
              />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-6 pr-4 py-1.5 text-[13px] bg-transparent
                  border-b border-brand-grey-200 focus:border-black outline-none
                  placeholder:text-brand-grey-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-0 top-1/2 -translate-y-1/2
                    text-brand-grey-500 hover:text-brand-900 transition-colors"
                >
                  <X size={13} strokeWidth={1.5} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto">

              {/* Filter toggle */}
              <button
                onClick={() => setFiltersOpen((p) => !p)}
                className={`flex items-center gap-2 text-[12px] uppercase tracking-wider
                  px-4 py-2 border transition-colors duration-200
                  ${filtersOpen
                    ? 'border-black bg-black text-white'
                    : 'border-brand-grey-200 text-brand-900 hover:border-black'
                  }`}
              >
                <SlidersHorizontal size={13} strokeWidth={1.5} />
                Filters
                {activeFilterCount > 0 && (
                  <span className={`w-4 h-4 rounded-full text-[10px]
                    flex items-center justify-center
                    ${filtersOpen ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort dropdown */}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen((p) => !p)}
                  className="flex items-center gap-2 text-[12px] uppercase tracking-wider
                    px-4 py-2 border border-brand-grey-200 hover:border-black
                    transition-colors duration-200 text-brand-900"
                >
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort'}
                  <ChevronDown
                    size={13}
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 w-[180px]
                    bg-white border border-brand-grey-200 z-40 shadow-sm animate-fade-in">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-[12px]
                          uppercase tracking-wider transition-colors
                          ${sort === opt.value
                            ? 'bg-black text-white'
                            : 'text-brand-900 hover:bg-brand-grey-100'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>


        {/* ── Filter panel ────────────────────────────────────────────────────── */}
        {filtersOpen && (
          <div className="border-b border-brand-grey-200 bg-brand-grey-100 animate-fade-in">
            <div className="max-w-content mx-auto px-10 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">

                {/* Category filter */}
                <div>
                  <label className="input-label mb-3 block">Category</label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setCategory('')}
                      className={`text-left text-[12px] uppercase tracking-wider
                        transition-colors
                        ${!category
                          ? 'text-brand-900 font-medium'
                          : 'text-brand-grey-500 hover:text-brand-900'
                        }`}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(
                          category === cat.name ? '' : cat.name
                        )}
                        className={`text-left text-[12px] uppercase tracking-wider
                          transition-colors
                          ${category === cat.name
                            ? 'text-brand-900 font-medium'
                            : 'text-brand-grey-500 hover:text-brand-900'
                          }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color filter */}
                {allColors.length > 0 && (
                  <div>
                    <label className="input-label mb-3 block">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {allColors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setColor(color === c ? '' : c)}
                          title={c}
                          className={`w-6 h-6 rounded-full border-2 transition-all
                            ${color === c
                              ? 'border-black scale-110'
                              : 'border-transparent hover:border-brand-grey-500'
                            }`}
                          style={{ backgroundColor: c?.toLowerCase() }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Size filter */}
                {allSizes.length > 0 && (
                  <div>
                    <label className="input-label mb-3 block">Size</label>
                    <div className="flex flex-wrap gap-1.5">
                      {allSizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(size === s ? '' : s)}
                          className={`w-10 h-10 text-[11px] uppercase tracking-wider
                            border transition-colors duration-200
                            ${size === s
                              ? 'border-black bg-black text-white'
                              : 'border-brand-grey-200 text-brand-900 hover:border-black'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price range */}
                <div className="col-span-2">
                  <label className="input-label mb-3 block">Price Range (₹)</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="input-underline text-[13px]"
                        min={0}
                      />
                    </div>
                    <span className="text-brand-grey-500 text-[12px]">—</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="input-underline text-[13px]"
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                {/* Clear filters */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-1.5 text-[11px] uppercase
                        tracking-wider text-brand-grey-500 hover:text-brand-900
                        transition-colors pb-1 border-b border-brand-grey-200
                        hover:border-black"
                    >
                      <X size={12} strokeWidth={1.5} />
                      Clear all
                    </button>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}


        {/* ── Active filter chips ──────────────────────────────────────────────── */}
        {hasActiveFilters && (
          <div className="max-w-content mx-auto px-10 py-4
            flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider
              text-brand-grey-500 mr-1">
              Active:
            </span>

            {[
              { label: search,    clear: () => setSearch('')   },
              { label: category,  clear: () => setCategory('') },
              { label: color,     clear: () => setColor('')    },
              { label: size,      clear: () => setSize('')     },
              minPrice && { label: `₹${minPrice}+`,  clear: () => setMinPrice('') },
              maxPrice && { label: `up to ₹${maxPrice}`, clear: () => setMaxPrice('') },
            ]
              .filter(Boolean)
              .filter((f) => f.label)
              .map((filter, i) => (
                <button
                  key={i}
                  onClick={filter.clear}
                  className="flex items-center gap-1.5 px-3 py-1
                    border border-black text-[11px] uppercase tracking-wider
                    text-brand-900 hover:bg-black hover:text-white
                    transition-colors duration-200"
                >
                  {filter.label}
                  <X size={10} strokeWidth={2} />
                </button>
              ))
            }

            <button
              onClick={clearFilters}
              className="text-[11px] uppercase tracking-wider
                text-brand-grey-500 hover:text-brand-900 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}


        {/* ── Product grid ─────────────────────────────────────────────────────── */}
        <div className="max-w-content mx-auto px-10 py-10">

          {loading ? (
            // Skeleton
            <div className="product-grid">
              {Array(12).fill(null).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div
                    className="w-full bg-brand-grey-100 animate-pulse"
                    style={{ aspectRatio: '3/4' }}
                  />
                  <div className="h-3 w-2/3 bg-brand-grey-100 animate-pulse" />
                  <div className="h-3 w-1/3 bg-brand-grey-100 animate-pulse" />
                </div>
              ))}
            </div>

          ) : products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onWishlistPrompt={() => setModalOpen(true)}
                />
              ))}
            </div>

          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center
              py-32 text-center">
              <p className="text-[11px] uppercase tracking-widest
                text-brand-grey-500 mb-4">
                No results
              </p>
              <h2 className="text-xl font-light tracking-wider uppercase
                text-brand-900 mb-4">
                No products found
              </h2>
              <p className="text-[13px] text-brand-grey-500 mb-8 max-w-sm">
                Try adjusting your filters or search term.
              </p>
              <button
                onClick={clearFilters}
                className="btn-outline"
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ── Login prompt modal ───────────────────────────────────────────────── */}
      <LoginPromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        redirectTo="/wishlist"
      />
    </>
  )
}