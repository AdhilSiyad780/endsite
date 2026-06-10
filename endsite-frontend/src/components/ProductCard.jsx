// src/components/ProductCard.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import api from '../api/axios'

export default function ProductCard({ product, onWishlistPrompt }) {
  const { isLoggedIn } = useAuth()
  const [wishlisted, setWishlisted] = useState(false)
  const [wishLoading, setWishLoading] = useState(false)

  const primaryImage = product.primary_image ?? null
  const secondaryImage = product.secondary_image ?? null
  const hasSecondary = !!secondaryImage

  const displayPrice = product.min_price ?? product.base_price
  const isOutOfStock = product.is_in_stock === false

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) { onWishlistPrompt?.(); return }
    setWishLoading(true)
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${product.product_id ?? product.id}`)
        setWishlisted(false)
      } else {
        await api.post('/wishlist', { product_id: product.product_id ?? product.id })
        setWishlisted(true)
      }
    } catch { /* ignore */ } finally {
      setWishLoading(false)
    }
  }

  return (
    <Link
      to={`/products/${product.product_id ?? product.id}`}
      className="flex flex-col group relative"
    >
      <div className="aspect-[3/4] overflow-hidden bg-[#dde1e9] mb-4 relative rounded-sm">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.product_name ?? product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out-expo
              ${hasSecondary ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] uppercase tracking-widest text-[#949dae]">No image</span>
          </div>
        )}

        {hasSecondary && (
          <img
            src={secondaryImage}
            alt={product.product_name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out-expo"
            loading="lazy"
          />
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-10">
            <span className="text-[10px] uppercase tracking-[.2em] text-black bg-white px-3 py-1">Sold Out</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          disabled={wishLoading}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <Heart size={16} strokeWidth={1.5} className={wishlisted ? 'fill-black text-black' : 'text-black'} />
        </button>
      </div>

      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-[13px] font-medium text-black uppercase tracking-wide truncate">
          {product.product_name ?? product.name}
        </h3>
        <p className="text-[12px] text-[#949dae]">
          ₹{displayPrice?.toLocaleString('en-IN')}
        </p>
      </div>
    </Link>
  )
}