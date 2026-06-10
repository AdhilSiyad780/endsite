// src/pages/user/Products.jsx

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, Search } from 'lucide-react'
import api from '../../api/axios'
import ProductCard from '../../components/ProductCard'
import LoginPromptModal from '../../components/LoginPromptModal'

const SORT_OPTIONS = [
  { label: 'Newest', value: 'created_at_desc' },
  { label: 'Oldest', value: 'created_at_asc' },
  { label: 'Price: Low', value: 'price_asc' },
  { label: 'Price: High', value: 'price_desc' },
  { label: 'Name: A–Z', value: 'name_asc' },
  { label: 'Name: Z–A', value: 'name_desc' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  // ── Filter state — synced with URL params ──────────────────────────────────
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [color, setColor] = useState(searchParams.get('color') ?? '')
  const [size, setSize] = useState(searchParams.get('size') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'created_at_desc')

  // ── UI state ───────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const sortRef = useRef(null)
  const searchRef = useRef(null)


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
      if (search) params.search = search
      if (category) params.category = category
      if (color) params.color = color
      if (size) params.size = size
      if (minPrice) params.min_price = minPrice
      if (maxPrice) params.max_price = maxPrice
      if (sort) params.sort = sort

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
      <div className="min-h-screen bg-[#e9edf2] pt-32 pb-20 px-10">
        <div className="max-w-[1920px] mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold tracking-[.3em] uppercase text-[#949dae]">Explore</span>
              <h1 className="text-[32px] font-normal text-black uppercase tracking-wide">
                {category || 'All Products'}
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <p className="text-[13px] text-[#484e5a] uppercase tracking-widest">
                {products.length} Items
              </p>
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 text-[12px] uppercase tracking-widest text-black font-semibold border-b border-black pb-1"
                >
                  {SORT_OPTIONS.find(o => o.value === sort)?.label}
                  <ChevronDown size={14} />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#e9edf2] border border-[#d2dae3] shadow-xl py-2 z-50">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false) }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#dde1e9] uppercase tracking-wider"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16">

            {/* Sidebar / Filters */}
            <aside className="lg:w-48 shrink-0">
              <div className="flex flex-col gap-10 sticky top-40">

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#949dae]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-6 py-2 bg-transparent border-b border-[#d2dae3] focus:border-black outline-none text-sm placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
                  />
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-black mb-6">Categories</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      className={`text-[13px] text-left uppercase tracking-wider transition-colors
                        ${!category ? 'text-black font-bold' : 'text-[#949dae] hover:text-black'}`}
                      onClick={() => setCategory('')}
                    >
                      All
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        className={`text-[13px] text-left uppercase tracking-wider transition-colors
                          ${category === cat.name ? 'text-black font-bold' : 'text-[#949dae] hover:text-black'}`}
                        onClick={() => setCategory(cat.name)}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Clear */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] font-bold text-black uppercase tracking-widest border-b border-black w-fit pb-1"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </aside>

            {/* Grid */}
            <main className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-[#dde1e9] animate-pulse rounded-sm" />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                  {products.map(p => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onWishlistPrompt={() => setModalOpen(true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 bg-[#dde1e9]/30 rounded-sm">
                  <p className="text-[14px] text-[#949dae] uppercase tracking-widest">No products found</p>
                  <button
                    onClick={clearFilters}
                    className="mt-6 text-[12px] font-bold border-b border-black pb-1 uppercase"
                  >
                    Reset Grid
                  </button>
                </div>
              )}
            </main>
          </div>
        </div>

        <LoginPromptModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          redirectTo="/products"
        />
      </div>
    </>
  )
}
