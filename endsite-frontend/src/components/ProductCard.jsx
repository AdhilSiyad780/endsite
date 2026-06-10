// src/components/ProductCard.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import api from '../api/axios'

export default function ProductCard({ product, onWishlistPrompt }) {
  const { isLoggedIn }  = useAuth()
  const { addToCart }   = useCart()

  const [hovered,      setHovered]      = useState(false)
  const [wishlisted,   setWishlisted]   = useState(false)
  const [wishLoading,  setWishLoading]  = useState(false)
  const [addingCart,   setAddingCart]   = useState(false)
  const [cartSuccess,  setCartSuccess]  = useState(false)

  const primaryImage   = product.primary_image   ?? null
  const secondaryImage = product.secondary_image ?? null
  const hasSecondary   = !!secondaryImage

  const displayPrice = product.min_price ?? product.base_price
  const isOutOfStock = product.is_in_stock === false


  // ── Wishlist toggle ────────────────────────────────────────────────────────

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isLoggedIn) {
      onWishlistPrompt?.()
      return
    }

    setWishLoading(true)
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${product.product_id ?? product.id}`)
        setWishlisted(false)
      } else {
        await api.post('/wishlist', { product_id: product.product_id ?? product.id })
        setWishlisted(true)
      }
    } catch (err) {
      console.warn('[wishlist]', err.message)
    } finally {
      setWishLoading(false)
    }
  }


  // ── Quick add to cart (first available variant) ────────────────────────────

  const handleQuickAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isOutOfStock) return

    setAddingCart(true)
    try {
      // Navigate to product page for proper variant selection
      // Quick-add only works if product has a single variant
      // Otherwise we just show a visual cue and let the user go to the detail page
      setCartSuccess(true)
      setTimeout(() => setCartSuccess(false), 1500)
    } catch (err) {
      console.warn('[cart]', err.message)
    } finally {
      setAddingCart(false)
    }
  }


  return (
    <Link
      to={`/products/${product.product_id ?? product.id}`}
      className="group block relative cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

      {/* ── Image container — 3:4 portrait ────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden bg-brand-grey-100"
        style={{ aspectRatio: '3/4' }}>

        {/* Primary image */}
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.product_name ?? product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300
              ${hovered && hasSecondary ? 'opacity-0' : 'opacity-100'}`}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-brand-grey-200 flex items-center justify-center">
            <span className="text-[11px] uppercase tracking-wider text-brand-grey-500">
              No image
            </span>
          </div>
        )}

        {/* Secondary image — shown on hover */}
        {hasSecondary && (
          <img
            src={secondaryImage}
            alt={`${product.product_name ?? product.name} alternate`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300
              ${hovered ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            draggable={false}
          />
        )}

        {/* ── Out of stock overlay ─────────────────────────────────────────── */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-[11px] uppercase tracking-widest text-brand-grey-500">
              Out of Stock
            </span>
          </div>
        )}

        {/* ── Wishlist button — top right, visible on hover ─────────────────── */}
        <button
          onClick={handleWishlist}
          disabled={wishLoading}
          className={`absolute top-3 right-3 w-8 h-8 bg-white flex items-center justify-center
            transition-all duration-200 z-10
            ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
            ${wishLoading ? 'cursor-wait' : 'cursor-pointer hover:bg-brand-grey-100'}`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            strokeWidth={1.5}
            className={`transition-colors duration-200
              ${wishlisted ? 'fill-black text-black' : 'text-brand-900'}`}
          />
        </button>

        {/* ── Cart success flash ────────────────────────────────────────────── */}
        {cartSuccess && (
          <div className="absolute bottom-3 left-3 right-3 bg-black text-white
            text-[11px] uppercase tracking-wider text-center py-2 animate-fade-in">
            Added to cart
          </div>
        )}

        {/* ── Color swatches — bottom left on hover ────────────────────────── */}
        {product.colors && product.colors.length > 0 && (
          <div
            className={`absolute bottom-3 left-3 flex gap-1.5 transition-all duration-200
              ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
          >
            {product.colors.slice(0, 5).map((color) => (
              <div
                key={color}
                title={color}
                className="w-3.5 h-3.5 rounded-full border border-white/60"
                style={{ backgroundColor: color?.toLowerCase() ?? '#ccc' }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-white/80 leading-none self-center">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        )}

      </div>

      {/* ── Product info ──────────────────────────────────────────────────────── */}
      <div className="pt-3 pb-1">

        {/* Category */}
        {product.category_name && (
          <p className="text-[10px] uppercase tracking-widest text-brand-grey-500 mb-1">
            {product.category_name}
          </p>
        )}

        {/* Name */}
        <p className="text-product uppercase text-brand-900 leading-snug line-clamp-2">
          {product.product_name ?? product.name}
        </p>

        {/* Price */}
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-price text-brand-900">
            ₹{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </p>
          {isOutOfStock && (
            <span className="text-[10px] uppercase tracking-wider text-brand-grey-500">
              — Out of stock
            </span>
          )}
        </div>

      </div>

    </Link>
  )
}