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
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const { addToCart } = useCart()

  // ── Product state ──────────────────────────────────────────────────────────
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Image gallery state ────────────────────────────────────────────────────
  const [activeImage, setActiveImage] = useState(0)
  const [imageZoomed, setImageZoomed] = useState(false)

  // ── Variant state ──────────────────────────────────────────────────────────
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)

  // ── Cart state ─────────────────────────────────────────────────────────────
  const [addingCart, setAddingCart] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [cartError, setCartError] = useState('')

  // ── Wishlist state ─────────────────────────────────────────────────────────
  const [wishlisted, setWishlisted] = useState(false)
  const [wishLoading, setWishLoading] = useState(false)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFor, setModalFor] = useState('wishlist')
  const [accordionOpen, setAccordionOpen] = useState({ details: true, shipping: false, returns: false })
  const [relatedProducts, setRelatedProducts] = useState([])

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
              related.filter((p) => (p.product_id ?? p.id) !== id).slice(0, 4)
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
          url: window.location.href,
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

  const images = product.images ?? []
  const variants = product.variants ?? []


  return (
    <>
      <div className="min-h-screen bg-[#e9edf2] pt-24 pb-20">

        {/* Breadcrumb */}
        <div className="px-10 py-6">
          <nav className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[#949dae]">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <span className="text-black/10">/</span>
            <Link to="/products" className="hover:text-black transition-colors">Shop</Link>
            {product.category_name && (
              <>
                <span className="text-black/10">/</span>
                <span className="text-black">{product.category_name}</span>
              </>
            )}
          </nav>
        </div>

        <div className="max-w-[1920px] mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

            {/* Gallery */}
            <div className="flex flex-col gap-6">
              <div className="aspect-[3/4] overflow-hidden bg-[#dde1e9] relative rounded-sm">
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]?.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center uppercase tracking-widest text-[#949dae] text-[12px]">
                    No imagery
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(idx)}
                      className={`aspect-[3/4] overflow-hidden bg-[#dde1e9] transition-all
                        ${activeImage === idx ? 'opacity-100 ring-1 ring-black' : 'opacity-40 hover:opacity-100'}`}
                    >
                      <img src={img.image_url} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col max-w-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[12px] font-bold uppercase tracking-[.3em] text-[#949dae]">
                  {product.category_name || 'Technical Equipment'}
                </span>
                <button onClick={handleShare} className="text-[#949dae] hover:text-black transition-colors">
                  <Share2 size={18} strokeWidth={1} />
                </button>
              </div>

              <h1 className="text-[42px] font-normal text-black uppercase tracking-tight leading-none mb-6">
                {product.name}
              </h1>

              <div className="flex items-center gap-6 mb-12">
                <p className="text-[24px] font-normal text-black">
                  ₹{displayPrice.toLocaleString('en-IN')}
                </p>
                {selectedVariant?.price_override && selectedVariant.price_override !== product.base_price && (
                  <p className="text-[16px] text-[#949dae] line-through">
                    ₹{product.base_price.toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              <div className="h-[1px] bg-black/10 w-full mb-12" />

              {/* Variants */}
              <div className="mb-12">
                <VariantSelector
                  variants={variants}
                  onSelect={(v) => {
                    setSelectedVariant(v)
                    setQuantity(1)
                    setCartError('')
                    setCartSuccess(false)
                  }}
                />
              </div>

              {/* Quantity */}
              {selectedVariant && selectedVariant.stock > 0 && (
                <div className="mb-12">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#949dae] block mb-4">Quantity</span>
                  <div className="flex items-center border border-black/10 w-fit px-4 py-2 gap-8 bg-white/50">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1} className="hover:opacity-40 transition-opacity">
                      <Minus size={14} />
                    </button>
                    <span className="text-[14px] font-bold min-w-[20px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(selectedVariant.stock, q + 1))} disabled={quantity >= selectedVariant.stock} className="hover:opacity-40 transition-opacity">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-4 mb-20">
                {cartError && <p className="text-[12px] text-red-500 uppercase tracking-widest mb-2 font-semibold">{cartError}</p>}

                <button
                  onClick={handleAddToCart}
                  disabled={addingCart || !selectedVariant || selectedVariant?.stock <= 0}
                  className="w-full py-5 bg-black text-white uppercase text-[12px] font-bold tracking-[.4em] hover:bg-[#222] transition-colors disabled:bg-[#dde1e9] disabled:text-[#949dae]"
                >
                  {addingCart ? 'Processing...' : !selectedVariant ? 'Select Size' : selectedVariant.stock <= 0 ? 'Sold Out' : 'Add to Bag'}
                </button>

                <button
                  onClick={handleWishlist}
                  disabled={wishLoading}
                  className={`w-full py-5 border border-black uppercase text-[12px] font-bold tracking-[.4em] transition-all
                    ${wishlisted ? 'bg-black text-white' : 'hover:bg-black hover:text-white'}`}
                >
                  {wishLoading ? 'Loading...' : wishlisted ? 'Saved' : 'Save to Wishlist'}
                </button>

                {cartSuccess && (
                  <p className="text-center text-[11px] font-bold uppercase tracking-widest text-black mt-2 animate-bounce">
                    ✓ Item added to bag
                  </p>
                )}
              </div>

              {/* Accordion */}
              <div className="border-t border-black/10">
                {[
                  { key: 'details', label: 'Description', content: product.description },
                  { key: 'shipping', label: 'Shipping', content: 'Free shipping on all technical equipment orders over ₹5,000.' },
                  { key: 'returns', label: 'Returns', content: 'Hassle-free 30-day returns for unused items in original packaging.' }
                ].map(({ key, label, content }) => (
                  <div key={key} className="border-b border-black/10">
                    <button
                      onClick={() => toggleAccordion(key)}
                      className="w-full py-6 flex justify-between items-center text-[12px] font-bold uppercase tracking-widest hover:opacity-60 transition-opacity"
                    >
                      {label}
                      <ChevronDown size={14} className={`transition-transform duration-500 ${accordionOpen[key] ? 'rotate-180' : ''}`} />
                    </button>
                    {accordionOpen[key] && (
                      <div className="pb-8 text-[14px] leading-relaxed text-[#484e5a] max-w-sm animate-fade-in">
                        {content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <section className="mt-40 border-t border-black/5 pt-24">
            <div className="px-10 max-w-[1920px] mx-auto">
              <div className="flex flex-col items-center mb-20 text-center">
                <span className="text-[12px] font-semibold tracking-[.3em] uppercase text-[#949dae] mb-4">Complete the Look</span>
                <h2 className="text-[28px] font-normal text-black tracking-wide uppercase">You May Also Like</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {relatedProducts.map(p => (
                  <ProductCard key={p.product_id ?? p.id} product={p} onWishlistPrompt={() => setModalOpen(true)} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      <LoginPromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        redirectTo={`/products/${id}`}
      />
    </>
  )
}