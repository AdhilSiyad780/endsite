// src/pages/user/ProductDetail.jsx

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Heart, Share2, ArrowLeft, Minus, Plus, ChevronDown } from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import VariantSelector from '../../components/VariantSelector'
import ProductCard from '../../components/ProductCard'
import LoginPromptModal from '../../components/LoginPromptModal'

export default function ProductDetail() {
  const { id }          = useParams()
  const navigate         = useNavigate()
  const { isLoggedIn }   = useAuth()
  const { addToCart }    = useCart()

  // ── Product state ──────────────────────────────────────────────────────────
  const [product,          setProduct]          = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState('')

  // ── Image gallery state ────────────────────────────────────────────────────
  const [activeImage,      setActiveImage]      = useState(0)
  const [imageZoomed,      setImageZoomed]      = useState(false)

  // ── Variant state ──────────────────────────────────────────────────────────
  const [selectedVariant,  setSelectedVariant]  = useState(null)
  const [quantity,         setQuantity]         = useState(1)

  // ── Cart state ─────────────────────────────────────────────────────────────
  const [addingCart,       setAddingCart]       = useState(false)
  const [cartSuccess,      setCartSuccess]      = useState(false)
  const [cartError,        setCartError]        = useState('')

  // ── Wishlist state ─────────────────────────────────────────────────────────
  const [wishlisted,       setWishlisted]       = useState(false)
  const [wishLoading,      setWishLoading]      = useState(false)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [modalOpen,        setModalOpen]        = useState(false)
  const [modalFor,         setModalFor]         = useState('wishlist')
  const [accordionOpen,    setAccordionOpen]    = useState({ details: true, shipping: false, returns: false })
  const [relatedProducts,  setRelatedProducts]  = useState([])

  const imageRef = useRef(null)


  // ── Fetch product ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError('')
      setSelectedVariant(null)
      setQuantity(1)
      setActiveImage(0)
      setCartSuccess(false)
      setCartError('')
      try {
        const { data } = await api.get(`/products/${id}`)
        setProduct(data)

        // Check wishlist status
        if (isLoggedIn) {
          try {
            const { data: wData } = await api.get(`/wishlist/check/${id}`)
            setWishlisted(wData.is_wishlisted)
          } catch { /* ignore */ }
        }

        // Fetch related products from same category
        if (data.category_id) {
          try {
            const { data: related } = await api.get('/products', {
              params: { category: data.category_name }
            })
            setRelatedProducts(
              related.filter((p) => p.id !== id).slice(0, 4)
            )
          } catch { /* ignore */ }
        }
      } catch (err) {
        setError(err.normalizedMessage ?? 'Product not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
    window.scrollTo(0, 0)
  }, [id, isLoggedIn])


  // ── Add to cart ────────────────────────────────────────────────────────────

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setCartError('Please select a size and colour')
      return
    }
    if (selectedVariant.stock <= 0) {
      setCartError('This variant is out of stock')
      return
    }
    if (quantity > selectedVariant.stock) {
      setCartError(`Only ${selectedVariant.stock} units available`)
      return
    }

    setAddingCart(true)
    setCartError('')
    setCartSuccess(false)

    try {
      await addToCart(selectedVariant, product, quantity)
      setCartSuccess(true)
      setTimeout(() => setCartSuccess(false), 3000)
    } catch (err) {
      setCartError(err.normalizedMessage ?? 'Failed to add to cart')
    } finally {
      setAddingCart(false)
    }
  }


  // ── Wishlist toggle ────────────────────────────────────────────────────────

  const handleWishlist = async () => {
    if (!isLoggedIn) {
      setModalFor('wishlist')
      setModalOpen(true)
      return
    }

    setWishLoading(true)
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${id}`)
        setWishlisted(false)
      } else {
        await api.post('/wishlist', { product_id: id })
        setWishlisted(true)
      }
    } catch (err) {
      console.warn('[wishlist]', err.message)
    } finally {
      setWishLoading(false)
    }
  }


  // ── Share ──────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          url:   window.location.href,
        })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }


  // ── Accordion toggle ───────────────────────────────────────────────────────

  const toggleAccordion = (key) => {
    setAccordionOpen((p) => ({ ...p, [key]: !p[key] }))
  }


  // ── Computed price ─────────────────────────────────────────────────────────

  const displayPrice = selectedVariant?.price_override
    ?? selectedVariant?.price
    ?? product?.base_price
    ?? 0


  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-content mx-auto px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image skeleton */}
          <div className="flex flex-col gap-2">
            <div
              className="w-full bg-brand-grey-100 animate-pulse"
              style={{ aspectRatio: '3/4' }}
            />
            <div className="flex gap-2">
              {Array(4).fill(null).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-brand-grey-100 animate-pulse flex-shrink-0"
                />
              ))}
            </div>
          </div>
          {/* Info skeleton */}
          <div className="flex flex-col gap-6 pt-4">
            <div className="h-4 w-1/4 bg-brand-grey-100 animate-pulse" />
            <div className="h-8 w-3/4 bg-brand-grey-100 animate-pulse" />
            <div className="h-6 w-1/4 bg-brand-grey-100 animate-pulse" />
            <div className="h-px w-full bg-brand-grey-200" />
            <div className="h-32 w-full bg-brand-grey-100 animate-pulse" />
            <div className="h-12 w-full bg-brand-grey-100 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }


  // ── Error state ────────────────────────────────────────────────────────────

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center
        text-center px-6">
        <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-4">
          404
        </p>
        <h1 className="text-2xl font-light tracking-wider uppercase
          text-brand-900 mb-4">
          Product Not Found
        </h1>
        <p className="text-[13px] text-brand-grey-500 mb-8">
          {error || 'This product does not exist or has been removed.'}
        </p>
        <button
          onClick={() => navigate('/products')}
          className="btn-primary"
        >
          Back to Shop
        </button>
      </div>
    )
  }

  const images  = product.images  ?? []
  const variants = product.variants ?? []


  return (
    <>
      <div className="min-h-screen bg-white page-enter">

        {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
        <div className="max-w-content mx-auto px-10 py-4">
          <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider">
            <Link
              to="/"
              className="text-brand-grey-500 hover:text-brand-900 transition-colors"
            >
              Home
            </Link>
            <span className="text-brand-grey-200">/</span>
            <Link
              to="/products"
              className="text-brand-grey-500 hover:text-brand-900 transition-colors"
            >
              Shop
            </Link>
            {product.category_name && (
              <>
                <span className="text-brand-grey-200">/</span>
                <Link
                  to={`/products?category=${encodeURIComponent(product.category_name)}`}
                  className="text-brand-grey-500 hover:text-brand-900 transition-colors"
                >
                  {product.category_name}
                </Link>
              </>
            )}
            <span className="text-brand-grey-200">/</span>
            <span className="text-brand-900 truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>


        {/* ── Main product section ─────────────────────────────────────────────── */}
        <div className="max-w-content mx-auto px-10 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">


            {/* ── LEFT — Image gallery ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-3">

              {/* Main image */}
              <div
                ref={imageRef}
                className="relative w-full overflow-hidden bg-brand-grey-100 cursor-zoom-in"
                style={{ aspectRatio: '3/4' }}
                onClick={() => setImageZoomed((p) => !p)}
              >
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]?.image_url}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-500
                      ${imageZoomed ? 'scale-150' : 'scale-100'}`}
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[11px] uppercase tracking-wider
                      text-brand-grey-500">
                      No image
                    </span>
                  </div>
                )}

                {/* Image count badge */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/60
                    text-white text-[10px] uppercase tracking-wider px-2 py-1">
                    {activeImage + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail row */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 overflow-hidden
                        border-2 transition-all duration-200
                        ${activeImage === idx
                          ? 'border-black'
                          : 'border-transparent hover:border-brand-grey-200'
                        }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              )}

            </div>


            {/* ── RIGHT — Product info ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 md:pt-4">

              {/* Category + actions row */}
              <div className="flex items-center justify-between">
                {product.category_name && (
                  <Link
                    to={`/products?category=${encodeURIComponent(product.category_name)}`}
                    className="text-[11px] uppercase tracking-widest
                      text-brand-grey-500 hover:text-brand-900 transition-colors"
                  >
                    {product.category_name}
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={handleShare}
                    className="text-brand-grey-500 hover:text-brand-900
                      transition-colors"
                    aria-label="Share"
                  >
                    <Share2 size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Product name */}
              <h1 className="text-2xl md:text-3xl font-light tracking-wider
                uppercase text-brand-900 leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-light text-brand-900">
                  ₹{displayPrice.toLocaleString('en-IN', {
                    minimumFractionDigits: 0
                  })}
                </p>
                {selectedVariant?.price_override &&
                  selectedVariant.price_override !== product.base_price && (
                  <p className="text-[13px] text-brand-grey-500 line-through">
                    ₹{product.base_price.toLocaleString('en-IN', {
                      minimumFractionDigits: 0
                    })}
                  </p>
                )}
                <span className="text-[11px] uppercase tracking-wider
                  text-brand-grey-500">
                  incl. taxes
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-brand-grey-200" />

              {/* Variant selector */}
              {variants.length > 0 ? (
                <VariantSelector
                  variants={variants}
                  onSelect={(v) => {
                    setSelectedVariant(v)
                    setQuantity(1)
                    setCartError('')
                    setCartSuccess(false)
                  }}
                />
              ) : (
                <p className="text-[12px] uppercase tracking-wider
                  text-brand-grey-500">
                  No variants available
                </p>
              )}

              {/* Divider */}
              <div className="h-px bg-brand-grey-200" />

              {/* Quantity selector */}
              {selectedVariant && selectedVariant.stock > 0 && (
                <div>
                  <label className="input-label mb-3 block">Quantity</label>
                  <div className="qty-stepper inline-flex">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus size={14} strokeWidth={1.5} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() =>
                        setQuantity((q) =>
                          Math.min(selectedVariant.stock, q + 1)
                        )
                      }
                      disabled={quantity >= selectedVariant.stock}
                    >
                      <Plus size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                  {selectedVariant.stock <= 5 && (
                    <p className="text-[11px] text-red-600 uppercase
                      tracking-wider mt-2">
                      Only {selectedVariant.stock} left in stock
                    </p>
                  )}
                </div>
              )}

              {/* Cart error / success */}
              {cartError && (
                <p className="text-[12px] text-red-600 uppercase tracking-wider">
                  {cartError}
                </p>
              )}
              {cartSuccess && (
                <div className="px-4 py-3 bg-black text-white text-[12px]
                  uppercase tracking-wider text-center animate-fade-in">
                  Added to cart ✓
                </div>
              )}

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                disabled={
                  addingCart ||
                  !selectedVariant ||
                  selectedVariant?.stock <= 0
                }
                className="btn-primary w-full flex items-center justify-center
                  gap-2 py-4 text-[13px]"
              >
                {addingCart ? (
                  <>
                    <div className="w-4 h-4 border border-white
                      border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : !selectedVariant ? (
                  'Select a Variant'
                ) : selectedVariant.stock <= 0 ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </button>

              {/* Wishlist button */}
              <button
                onClick={handleWishlist}
                disabled={wishLoading}
                className={`btn-outline w-full flex items-center justify-center
                  gap-2 py-4 text-[13px] transition-all duration-200
                  ${wishlisted
                    ? 'bg-black text-white border-black'
                    : ''
                  }`}
              >
                <Heart
                  size={16}
                  strokeWidth={1.5}
                  className={wishlisted ? 'fill-white' : ''}
                />
                {wishLoading
                  ? 'Updating...'
                  : wishlisted
                    ? 'Wishlisted'
                    : 'Add to Wishlist'
                }
              </button>


              {/* ── Accordion — details, shipping, returns ─────────────────────── */}
              <div className="flex flex-col border-t border-brand-grey-200 mt-2">

                {[
                  {
                    key:     'details',
                    label:   'Product Details',
                    content: product.description
                      ?? 'No description available.',
                  },
                  {
                    key:   'shipping',
                    label: 'Shipping & Delivery',
                    content:
                      'Free shipping on orders above ₹999. Standard delivery in 3–7 business days. Express delivery available at checkout.',
                  },
                  {
                    key:   'returns',
                    label: 'Returns & Exchanges',
                    content:
                      '7-day hassle-free returns. Items must be unworn, unwashed, and in original packaging. Exchanges subject to stock availability.',
                  },
                ].map(({ key, label, content }) => (
                  <div
                    key={key}
                    className="border-b border-brand-grey-200"
                  >
                    <button
                      onClick={() => toggleAccordion(key)}
                      className="w-full flex items-center justify-between
                        py-4 text-left group"
                    >
                      <span className="text-[12px] uppercase tracking-wider
                        text-brand-900 group-hover:opacity-60 transition-opacity">
                        {label}
                      </span>
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        className={`text-brand-grey-500 transition-transform duration-200
                          ${accordionOpen[key] ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {accordionOpen[key] && (
                      <div className="pb-4 animate-fade-in">
                        <p className="text-[13px] text-brand-grey-500
                          leading-relaxed">
                          {content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

              </div>

            </div>

          </div>
        </div>


        {/* ── Related products ─────────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-brand-grey-200 py-20
            bg-brand-grey-100">
            <div className="max-w-content mx-auto px-10">

              <div className="flex items-center justify-between mb-10">
                <div>
                  <p className="text-[11px] uppercase tracking-widest
                    text-brand-grey-500 mb-2">
                    You may also like
                  </p>
                  <h2 className="text-2xl font-light tracking-wider
                    uppercase text-brand-900">
                    Related
                  </h2>
                </div>
                <Link
                  to={`/products?category=${encodeURIComponent(product.category_name ?? '')}`}
                  className="hidden md:inline-flex items-center gap-2
                    text-[12px] uppercase tracking-wider text-brand-grey-500
                    hover:text-brand-900 transition-colors"
                >
                  View all
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onWishlistPrompt={() => {
                      setModalFor('wishlist')
                      setModalOpen(true)
                    }}
                  />
                ))}
              </div>

            </div>
          </section>
        )}

      </div>

      {/* ── Login prompt modal ───────────────────────────────────────────────── */}
      <LoginPromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        redirectTo={modalFor === 'checkout' ? '/checkout' : '/wishlist'}
      />
    </>
  )
}