// src/components/Navbar.jsx

import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ShoppingBag, Heart, User, Menu, X, LogOut, Package, LayoutDashboard } from 'lucide-react'

const NAV_LINKS = [
  { label: 'About Us',          to: '/about' },
  { label: 'Science of Warmth', to: '/science' },
  { label: 'Store',             to: '/products' },
]

export default function Navbar() {
  const { isLoggedIn, isAdmin, profile, signOut } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const [drawerOpen,  setDrawerOpen]  = useState(false)
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
        <div className="max-w-[1920px] mx-auto px-10 py-4 flex items-center justify-between">

          {/* Left Block: Spherical Logo Icon Graphic Element */}
          <Link to="/" className="flex items-center shrink-0 group">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-blue-400 to-sky-200 shadow-inner flex items-center justify-center relative overflow-hidden border border-blue-900/20 transition-transform duration-300 group-hover:scale-105">
              <div className="absolute inset-1.5 rounded-full bg-radial from-transparent to-black/20 pointer-events-none" />
              <div className="w-3 h-7 border-2 border-white/70 rounded-full opacity-60 transform rotate-12 relative">
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-10 ml-14 mr-auto">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `text-[14px] font-semibold text-black tracking-wide border-black transition-all duration-200 relative py-1
                  after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-black after:transition-transform after:duration-300
                  ${isActive ? 'after:scale-x-100 opacity-100' : 'after:scale-x-0 opacity-70 hover:opacity-100'}`
                }
              >
                {label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                className="text-[14px] font-semibold text-black opacity-70 hover:opacity-100 transition-opacity"
              >
                Admin
              </NavLink>
            )}
          </nav>

          {/* Center-Right Branding Layer */}
          <div className="hidden lg:block select-none pointer-events-none mx-10">
            <h1 className="text-[52px] font-black tracking-tighter text-black leading-none uppercase">
              ENDSITE
            </h1>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-5 shrink-0">

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative text-black hover:opacity-70 transition-opacity p-1"
              aria-label="Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4
                  bg-black text-white text-[9px] font-medium
                  flex items-center justify-center rounded-full scale-100 animate-[bounce_1s_infinite_1]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Wishlist Icon */}
            {isLoggedIn && (
              <Link
                to="/wishlist"
                className="hidden md:block text-black hover:opacity-70 transition-opacity p-1"
                aria-label="Wishlist"
              >
                <Heart size={22} strokeWidth={1.5} />
              </Link>
            )}

            {/* Profile Dropdown Actions */}
            {isLoggedIn ? (
              <div className="relative hidden md:block" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((p) => !p)}
                  className="text-black hover:opacity-70 transition-opacity p-1"
                >
                  <User size={22} strokeWidth={1.5} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-[200px]
                    bg-[#e9edf2] border border-[#d2dae3] z-50 shadow-xl rounded-sm overflow-hidden transform origin-top-right transition-all duration-200 animate-[fadeIn_0.15s_ease-out]">

                    <div className="px-4 py-3 bg-[#dde1e9]/50 border-b border-[#d2dae3]">
                      <p className="text-[14px] font-semibold text-black truncate">
                        {profile?.full_name ?? 'Account'}
                      </p>
                      <p className="text-[12px] text-[#949dae] mt-0.5">
                        {isAdmin ? 'Administrator' : 'Member'}
                      </p>
                    </div>

                    <div className="py-1">
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5
                            text-[14px] text-black hover:bg-[#dde1e9]
                            transition-colors"
                        >
                          <LayoutDashboard size={14} strokeWidth={1.5} />
                          Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5
                          text-[14px] text-black hover:bg-[#dde1e9]
                          transition-colors"
                      >
                        <User size={14} strokeWidth={1.5} />
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5
                          text-[14px] text-black hover:bg-[#dde1e9]
                          transition-colors"
                      >
                        <Package size={14} strokeWidth={1.5} />
                        Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5
                          text-[14px] text-black hover:bg-[#dde1e9]
                          transition-colors"
                      >
                        <Heart size={14} strokeWidth={1.5} />
                        Wishlist
                      </Link>
                    </div>

                    <div className="border-t border-[#d2dae3] py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 px-4 py-2.5 w-full
                          text-[14px] text-gray-500 hover:text-black
                          hover:bg-[#dde1e9] transition-colors"
                      >
                        <LogOut size={14} strokeWidth={1.5} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5
                  text-black hover:opacity-70 transition-opacity"
              >
                <User size={22} strokeWidth={1.5} />
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden text-black hover:opacity-70 transition-opacity p-1"
            >
              <Menu size={24} strokeWidth={1.5} />
            </button>

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
              <Link to="/profile"  onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Profile</Link>
              <Link to="/orders"   onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Orders</Link>
              <Link to="/wishlist" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Wishlist</Link>
              <Link to="/cart"     onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">
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
              <Link to="/cart"  onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">
                Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link to="/login"  onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Login</Link>
              <Link to="/signup" onClick={() => setDrawerOpen(false)} className="text-[16px] font-medium text-black hover:opacity-60">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}