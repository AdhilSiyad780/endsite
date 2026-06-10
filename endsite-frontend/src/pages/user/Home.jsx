// src/pages/user/Home.jsx

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import LoginPromptModal from '../../components/LoginPromptModal'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import banner from '../../assets/banner.png' // Adjust the path to your actual image file

export default function Home() {
  const { addToCart } = useCart()
  const { isLoggedIn } = useAuth()

  const [featuredProducts, setFeaturedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const revealRefs = useRef([])

  // ── Fetch products ─────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes] = await Promise.all([
          api.get('/products', { params: { sort: 'created_at_desc' } }),
          api.get('/products', { params: { sort: 'created_at_desc' } }),
        ])
        setFeaturedProducts(featuredRes.data.slice(0, 4))
        setNewArrivals(newRes.data.slice(0, 4))
      } catch (err) {
        console.error('[home]', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Scroll reveal ──────────────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    revealRefs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [loading])

  const addRef = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el)
  }

  return (
    <>
      <div className="min-h-screen bg-[#e9edf2]">

        {/* ── HERO — full width image ────────────────────────────────────────── */}
        <section className="w-full overflow-hidden">
          <div
            className="w-full bg-cover bg-center bg-no-repeat flex items-center justify-center relative"
            style={{
              minHeight: '80vh',
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), url(${banner})`
            }}
          >
            {/* Optional Overlay to make text readable if your image is bright */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />

            <div className="w-full h-full flex flex-col items-center justify-center text-center px-10 py-32 z-10">




            </div>
          </div>
        </section>


        {/* ── POPULAR STYLES — exact SKYPEOPLE layout ────────────────────────── */}
        <section
          className="px-[42px] pt-0 pb-0 reveal"
          style={{ paddingTop: '105px', paddingBottom: '105px' }}
          ref={addRef}
        >
          {/* Section heading */}
          <div className="flex flex-col items-center mb-[105px]">
            <h1 className="text-[26.7px] font-normal text-[#484e5a] leading-[24px]
              text-center mb-4">
              POPULAR STYLES
            </h1>
            <h3 className="text-[26.7px] font-normal text-[#484e5a]
              tracking-[0.18px] leading-[24px] text-center">
              Featured Products
            </h3>
          </div>

          {/* Product grid — SKYPEOPLE 4 column portrait layout */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[253px] justify-center">
              {Array(4).fill(null).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div
                    className="w-[177px] bg-[#dde1e9] animate-pulse"
                    style={{ height: '567px' }}
                  />
                  <div className="h-4 w-24 bg-[#dde1e9] animate-pulse" />
                  <div className="h-4 w-20 bg-[#dde1e9] animate-pulse" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div
              className="grid justify-center items-start"
              style={{
                gridTemplateColumns: 'repeat(4, minmax(175px, 1fr))',
                gap: '253px',
              }}
            >
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onWishlistPrompt={() => setModalOpen(true)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[16px] text-[#949dae]">No products yet</p>
            </div>
          )}
        </section>


        {/* ── NEW ARRIVALS ──────────────────────────────────────────────────── */}
        {newArrivals.length > 0 && (
          <section
            className="px-[42px] reveal"
            style={{ paddingTop: '105px', paddingBottom: '105px' }}
            ref={addRef}
          >
            <div className="flex flex-col items-center mb-[105px]">
              <h1 className="text-[26.7px] font-normal text-[#484e5a]
                leading-[24px] text-center mb-4">
                NEW ARRIVALS
              </h1>
              <h3 className="text-[26.7px] font-normal text-[#484e5a]
                tracking-[0.18px] leading-[24px] text-center">
                Just Dropped
              </h3>
            </div>

            <div
              className="grid justify-center items-start"
              style={{
                gridTemplateColumns: 'repeat(4, minmax(175px, 1fr))',
                gap: '253px',
              }}
            >
              {newArrivals.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onWishlistPrompt={() => setModalOpen(true)}
                />
              ))}
            </div>
          </section>
        )}


        {/* ── STORE LOCATOR BANNER — matching FrameComponent2 ──────────────── */}
        <section
          className="px-[42px] reveal"
          style={{ paddingBottom: '147px' }}
          ref={addRef}
        >
          <div className="flex flex-col items-start gap-[64px]">

            {/* Section heading */}
            <div className="self-stretch flex flex-col items-center gap-4">
              <h2 className="text-[26.7px] font-normal text-[#484e5a]
                leading-[24px] text-center">
                EXPLORE
              </h2>
              <h3 className="text-[26.7px] font-normal text-[#484e5a]
                tracking-[0.18px] leading-[24px] text-center">
                Our Story
              </h3>
            </div>

            {/* Banner */}
            <div
              className="self-stretch rounded-2xl overflow-hidden flex flex-col
                items-start px-[42px] relative bg-[#dde1e9]"
              style={{ height: '800px' }}
            >
              <div className="w-full h-full absolute inset-0
                bg-gradient-to-b from-[#e9edf2] via-transparent to-[#e9edf2]
                opacity-60 z-0" />

              <div className="relative z-10 self-stretch flex flex-col
                items-start justify-center max-w-full h-full">
                <div className="flex items-end justify-between flex-wrap
                  gap-5 w-full pt-[107px]">

                  {/* Left text */}
                  <div className="flex-1 min-w-[300px]">
                    <p className="text-[18.7px] text-[#484e5a] leading-[18.7px]
                      mb-3">
                      Our Store
                    </p>
                    <p className="text-[18.7px] text-[#484e5a] leading-[18.7px]">
                      Visit us in person
                    </p>
                  </div>

                  {/* Right — View More */}
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/about"
                      className="text-[18.7px] text-[#484e5a] hover:opacity-60
                        transition-opacity leading-[18.7px]"
                    >
                      View More
                    </Link>
                    <span className="text-[#484e5a]">→</span>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>

      </div>

      <LoginPromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        redirectTo="/"
      />
    </>
  )
}


// ── SKYPEOPLE-style Product Card ───────────────────────────────────────────

// ── SKYPEOPLE-style Product Card ───────────────────────────────────────────

function ProductCard({ product, onWishlistPrompt }) {
  const primaryImage = product.primary_image ?? null

  return (
    <Link
      to={`/products/${product.product_id ?? product.id}`}
      className="flex flex-col group"
    >
      <div className="aspect-[3/4] overflow-hidden bg-[#dde1e9] mb-6 relative">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.product_name ?? product.name}
            className="w-full h-full object-cover group-hover:scale-105
              transition-transform duration-700 ease-out-expo"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[12px] text-[#949dae] uppercase tracking-widest">No image</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[14px] font-normal text-black truncate uppercase tracking-wide">
          {product.product_name ?? product.name}
        </h3>
        <p className="text-[13px] text-[#949dae]">
          ₹{(product.min_price ?? product.base_price)?.toLocaleString('en-IN')}
        </p>
      </div>
    </Link>
  )
}
