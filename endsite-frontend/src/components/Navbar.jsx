// src/components/Navbar.jsx

import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ShoppingBag, Heart, User, Menu, X, LogOut, Package, LayoutDashboard } from 'lucide-react'

const NAV_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Science of Warmth', to: '/science' },
  { label: 'Store', to: '/products' },
]

export default function Navbar() {
  const { isLoggedIn, isAdmin, profile, signOut } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  // Advanced smooth animation tracking states
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)

  // Smooth slide-to-reveal mechanism
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const deltaY = currentScrollY - lastScrollY.current

      // 1. Don't hide if we haven't scrolled past a clean baseline height
      if (currentScrollY < 150) {
        setIsVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      // 2. Intentional buffer check: ignore micro-movements to avoid layout jittering
      if (Math.abs(deltaY) < 15) return

      // 3. Evaluate intentional vector direction
      if (deltaY > 0 && isVisible) {
        setIsVisible(false) // Smoothly hide on continuous down-scroll
      } else if (deltaY < 0 && !isVisible) {
        setIsVisible(true)  // Instantly queue reveal on deliberate up-scroll
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isVisible])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setProfileOpen(false)
    setDrawerOpen(false)
    try {
      await signOut()
    } catch (err) {
      console.warn('[navbar] signOut error:', err.message)
    } finally {
      navigate('/')   // always navigate, regardless of whether signOut threw
    }
  }

  return (
    <>
      {/* ── Navbar Container with custom luxury easing curves ────────────────── */}
      <header
        className="sticky top-0 z-50 bg-[#e9edf2] border-b border-[#d2dae3] will-change-transform"
        style={{
          transform: isVisible ? 'translateY(0)' : 'translateY(-101%)',
          transition: 'transform 450ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="max-w-[1920px] mx-auto px-10 py-6 flex items-center">

          {/* ── Left Block: Logo & Nav ────────────────────────────────────────── */}
          <div className="flex items-center gap-14 flex-1">
            <Link to="/" className="flex items-center shrink-0 group">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <div className="w-2 h-5 border border-white/40 rounded-full" />
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-10">
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `text-[14px] font-normal text-black tracking-wide transition-opacity duration-200 py-1
                    ${isActive ? 'opacity-100 border-b border-black' : 'opacity-60 hover:opacity-100'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* ── Right Block: Brand & Actions ──────────────────────────────────── */}
          <div className="flex items-center gap-10">

            {/* Branding Text */}
            <div className="hidden lg:block select-none">
              <h1 className="text-[28px] font-black tracking-tighter text-black leading-none uppercase">
                ENDSITE
              </h1>
            </div>

            <div className="flex items-center gap-6">
              {/* Cart */}
              <Link to="/cart" className="relative text-black hover:opacity-60 transition-opacity">
                <ShoppingBag size={20} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Wishlist */}
              {isLoggedIn && (
                <Link to="/wishlist" className="hidden md:block text-black hover:opacity-60 transition-opacity">
                  <Heart size={20} strokeWidth={1.5} />
                </Link>
              )}

              {/* Profile */}
              {isLoggedIn ? (
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen(!profileOpen)} className="text-black hover:opacity-60 transition-opacity">
                    <User size={20} strokeWidth={1.5} />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-4 w-48 bg-[#e9edf2] border border-[#d2dae3] shadow-xl py-2 animate-fade-in">
                      <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-[#dde1e9]">Profile</Link>
                      <Link to="/orders" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-[#dde1e9]">Orders</Link>
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#dde1e9]">Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="text-black hover:opacity-60 transition-opacity">
                  <User size={20} strokeWidth={1.5} />
                </Link>
              )}

              {/* Mobile Toggle */}
              <button onClick={() => setDrawerOpen(true)} className="md:hidden text-black">
                <Menu size={24} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Modals */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-[#e9edf2] z-50
          shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-6
          border-b border-[#d2dae3]">
          <span className="text-[20px] font-black uppercase tracking-tight text-black">
            SKYPEOPLE
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-gray-500 hover:text-black transition-colors"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-col px-6 py-6 gap-5 border-b border-[#d2dae3]">
          {NAV_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setDrawerOpen(false)}
              className="text-[16px] font-semibold text-black hover:opacity-60 transition-opacity"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col px-6 py-6 gap-4">
          {isLoggedIn ? (
            <>
              <div className="mb-2">
                <p className="text-[16px] font-bold text-black">
                  {profile?.full_name ?? 'Account'}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">
                  {isAdmin ? 'Administrator' : 'Member'}
                </p>
              </div>
              <Link to="/profile" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Profile</Link>
              <Link to="/orders" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Orders</Link>
              <Link to="/wishlist" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Wishlist</Link>
              <Link to="/cart" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-left text-[16px] font-medium text-gray-500 hover:text-black transition-colors mt-2"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/cart" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link to="/login" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Login</Link>
              <Link to="/signup" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}