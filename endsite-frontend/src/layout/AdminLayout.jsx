// src/layouts/AdminLayout.jsx

import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to:    '/admin',
    icon:  LayoutDashboard,
    end:   true,
  },
  {
    label: 'Products',
    to:    '/admin/products',
    icon:  Package,
    end:   false,
  },
  {
    label: 'Orders',
    to:    '/admin/orders',
    icon:  ShoppingBag,
    end:   false,
  },
  {
    label: 'Users',
    to:    '/admin/users',
    icon:  Users,
    end:   false,
  },
]

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  const navigate              = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-brand-grey-100">

      {/* ── Sidebar — desktop ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[240px] min-h-screen bg-[#0A0A0A] text-white fixed left-0 top-0 z-40">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <span className="font-light tracking-widest text-[18px] uppercase">
            endsite
          </span>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
            Admin
          </p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-[12px] uppercase tracking-wider
                transition-all duration-200 group
                ${isActive
                  ? 'border-l-2 border-white bg-white/5 text-white pl-[10px]'
                  : 'border-l-2 border-transparent text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile + sign out */}
        <div className="px-4 py-5 border-t border-white/10">
          <div className="mb-3">
            <p className="text-[12px] text-white truncate">
              {profile?.full_name ?? 'Admin'}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">
              Administrator
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-[11px] uppercase tracking-wider
              text-white/40 hover:text-white transition-colors w-full"
          >
            <LogOut size={13} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>

      </aside>


      {/* ── Mobile sidebar overlay ────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[240px] bg-[#0A0A0A] text-white z-50
          transform transition-transform duration-300 ease lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo + close */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="font-light tracking-widest text-[18px] uppercase">
              endsite
            </span>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
              Admin
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-[12px] uppercase tracking-wider
                transition-all duration-200
                ${isActive
                  ? 'border-l-2 border-white bg-white/5 text-white pl-[10px]'
                  : 'border-l-2 border-transparent text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={15} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Profile + sign out */}
        <div className="px-4 py-5 border-t border-white/10">
          <div className="mb-3">
            <p className="text-[12px] text-white truncate">
              {profile?.full_name ?? 'Admin'}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">
              Administrator
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-[11px] uppercase tracking-wider
              text-white/40 hover:text-white transition-colors w-full"
          >
            <LogOut size={13} strokeWidth={1.5} />
            Sign Out
          </button>
        </div>
      </aside>


      {/* ── Main content area ─────────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="lg:hidden bg-[#0A0A0A] text-white px-4 py-4
          flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <span className="font-light tracking-widest text-[16px] uppercase">
            endsite
          </span>
          <div className="w-5" /> {/* spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 page-enter">
          <Outlet />
        </main>

      </div>

    </div>
  )
}