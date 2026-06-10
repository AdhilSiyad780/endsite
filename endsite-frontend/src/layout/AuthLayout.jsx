// src/layouts/AuthLayout.jsx

import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function AuthLayout() {
  const { isLoggedIn, loading, isAdmin } = useAuth()

  // ── Still checking session ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Already logged in — redirect away from auth pages ─────────────────────
  if (isLoggedIn) {
    return <Navigate to={isAdmin ? '/admin' : '/'} replace />
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="w-full px-10 py-6 flex items-center justify-between border-b border-brand-grey-200">
        <Link
          to="/"
          className="font-light tracking-widest text-[18px] uppercase text-brand-900 hover:opacity-70 transition-opacity"
        >
          endsite
        </Link>
        <Link
          to="/"
          className="text-[11px] uppercase tracking-wider text-brand-grey-500 hover:text-brand-900 transition-colors"
        >
          ← Back to store
        </Link>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md page-enter">
          <Outlet />
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="w-full px-10 py-6 border-t border-brand-grey-200">
        <p className="text-[11px] uppercase tracking-wider text-brand-grey-500 text-center">
          © {new Date().getFullYear()} endsite. All rights reserved.
        </p>
      </footer>

    </div>
  )
}