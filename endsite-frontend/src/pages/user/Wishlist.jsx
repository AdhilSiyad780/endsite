// src/pages/user/Wishlist.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, ShoppingBag, Loader } from 'lucide-react'
import api from '../../api/axios'
import { useCart } from '../../context/CartContext'
import ProductCard from '../../components/ProductCard'

export default function Wishlist() {
  const { addToCart } = useCart()

  const [wishlist,    setWishlist]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [removingId,  setRemovingId]  = useState(null)
  const [clearing,    setClearing]    = useState(false)
  const [addingCart,  setAddingCart]  = useState(null)
  const [cartSuccess, setCartSuccess] = useState(null)


  // ── Fetch wishlist ─────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/wishlist')
        setWishlist(data.items ?? [])
      } catch (err) {
        setError(err.normalizedMessage ?? 'Failed to load wishlist')
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [])


  // ── Remove from wishlist ───────────────────────────────────────────────────

  const handleRemove = async (productId) => {
    setRemovingId(productId)
    try {
      await api.delete(`/wishlist/${productId}`)
      setWishlist((p) => p.filter((i) => i.product_id !== productId))
    } catch (err) {
      console.warn('[wishlist] Remove failed:', err.message)
    } finally {
      setRemovingId(null)
    }
  }


  // ── Clear entire wishlist ──────────────────────────────────────────────────

  const handleClear = async () => {
    setClearing(true)
    try {
      await api.delete('/wishlist')
      setWishlist([])
    } catch (err) {
      console.warn('[wishlist] Clear failed:', err.message)
    } finally {
      setClearing(false)
    }
  }


  // ── Add to cart from wishlist ──────────────────────────────────────────────
  // Navigates to product page for variant selection since we
  // don't have variant info in wishlist items

  const handleAddToCart = async (item) => {
    if (!item.is_in_stock) return
    setAddingCart(item.product_id)
    try {
      // Fetch product to get first available variant
      const { data: product } = await api.get(`/products/${item.product_id}`)
      const firstVariant = product.variants?.find((v) => v.stock > 0)
      if (!firstVariant) return

      await addToCart(firstVariant, product, 1)
      setCartSuccess(item.product_id)
      setTimeout(() => setCartSuccess(null), 2000)
    } catch (err) {
      console.warn('[wishlist] Add to cart failed:', err.message)
    } finally {
      setAddingCart(null)
    }
  }


  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white page-enter">
        <div className="max-w-content mx-auto px-10 py-16">
          <div className="h-8 w-48 bg-brand-grey-100 animate-pulse mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array(8).fill(null).map((_, i) => (
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
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-white page-enter">
      <div className="max-w-content mx-auto px-10 py-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-2">
              My account
            </p>
            <h1 className="text-3xl font-light tracking-wider uppercase
              text-brand-900">
              Wishlist
              {wishlist.length > 0 && (
                <span className="text-brand-grey-500 ml-3 text-xl">
                  ({wishlist.length})
                </span>
              )}
            </h1>
          </div>

          {wishlist.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-1.5 text-[11px] uppercase
                tracking-wider text-brand-grey-500 hover:text-brand-900
                transition-colors pb-1 border-b border-transparent
                hover:border-brand-grey-500"
            >
              {clearing
                ? <Loader size={12} strokeWidth={1.5} className="animate-spin" />
                : <Trash2 size={12} strokeWidth={1.5} />
              }
              Clear all
            </button>
          )}
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {wishlist.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center
            py-24 text-center border border-brand-grey-200">
            <Heart
              size={48}
              strokeWidth={0.75}
              className="text-brand-grey-200 mb-6"
            />
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-3">
              Nothing saved yet
            </p>
            <h2 className="text-xl font-light tracking-wider uppercase
              text-brand-900 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-[13px] text-brand-grey-500 mb-8 max-w-xs">
              Save items you love by clicking the heart icon on any product.
            </p>
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        )}

        {/* ── Wishlist grid ─────────────────────────────────────────────────── */}
        {wishlist.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {wishlist.map((item) => (
              <div key={item.wishlist_id} className="relative group">

                {/* Product card */}
                <Link
                  to={`/products/${item.product_id}`}
                  className="block"
                >
                  {/* Image */}
                  <div
                    className="relative w-full bg-brand-grey-100 overflow-hidden"
                    style={{ aspectRatio: '3/4' }}
                  >
                    {item.primary_image ? (
                      <img
                        src={item.primary_image}
                        alt={item.product_name}
                        className="w-full h-full object-cover
                          group-hover:opacity-80 transition-opacity duration-300"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center
                        justify-center bg-brand-grey-100">
                        <Heart
                          size={24}
                          strokeWidth={1}
                          className="text-brand-grey-200"
                        />
                      </div>
                    )}

                    {/* Out of stock overlay */}
                    {!item.is_in_stock && (
                      <div className="absolute inset-0 bg-white/60
                        flex items-center justify-center">
                        <span className="text-[11px] uppercase tracking-widest
                          text-brand-grey-500">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Cart success flash */}
                    {cartSuccess === item.product_id && (
                      <div className="absolute bottom-3 left-3 right-3
                        bg-black text-white text-[11px] uppercase
                        tracking-wider text-center py-2 animate-fade-in">
                        Added to cart ✓
                      </div>
                    )}

                    {/* Actions — top right overlay on hover */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2
                      opacity-0 group-hover:opacity-100 transition-opacity
                      duration-200">

                      {/* Remove from wishlist */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemove(item.product_id)
                        }}
                        disabled={removingId === item.product_id}
                        className="w-8 h-8 bg-white flex items-center
                          justify-center hover:bg-red-50 transition-colors"
                        aria-label="Remove from wishlist"
                      >
                        {removingId === item.product_id ? (
                          <Loader
                            size={12}
                            strokeWidth={1.5}
                            className="animate-spin text-brand-grey-500"
                          />
                        ) : (
                          <Heart
                            size={13}
                            strokeWidth={1.5}
                            className="fill-black text-black"
                          />
                        )}
                      </button>

                      {/* Quick add to cart */}
                      {item.is_in_stock && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleAddToCart(item)
                          }}
                          disabled={addingCart === item.product_id}
                          className="w-8 h-8 bg-black text-white flex
                            items-center justify-center hover:bg-brand-grey-900
                            transition-colors"
                          aria-label="Add to cart"
                        >
                          {addingCart === item.product_id ? (
                            <Loader
                              size={12}
                              strokeWidth={1.5}
                              className="animate-spin"
                            />
                          ) : (
                            <ShoppingBag size={13} strokeWidth={1.5} />
                          )}
                        </button>
                      )}

                    </div>
                  </div>

                  {/* Product info */}
                  <div className="pt-3 pb-1">
                    <p className="text-product uppercase text-brand-900
                      leading-snug line-clamp-2">
                      {item.product_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-price text-brand-900">
                        ₹{(item.min_price ?? item.base_price)
                          .toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                      </p>
                      {!item.is_in_stock && (
                        <span className="text-[10px] uppercase tracking-wider
                          text-brand-grey-500">
                          — Out of stock
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] uppercase tracking-wider
                      text-brand-grey-500 mt-1">
                      Saved {new Date(item.added_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </p>
                  </div>

                </Link>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}