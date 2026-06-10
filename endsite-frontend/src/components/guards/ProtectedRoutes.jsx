// src/components/guards/ProtectedRoute.jsx

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { isLoggedIn, loading, isBlocked } = useAuth()
  const location = useLocation()

  // ── Still checking session ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] uppercase tracking-wider text-brand-grey-500">
            Loading
          </p>
        </div>
      </div>
    )
  }

  // ── Blocked user ───────────────────────────────────────────────────────────
  if (isLoggedIn && isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-4">
            Account Suspended
          </p>

          <h1 className="text-2xl font-light tracking-wider uppercase text-brand-900 mb-4">
            Your account has been blocked
          </h1>

          <p className="text-sm text-brand-grey-500 leading-relaxed mb-8">
            Please contact support if you believe this is a mistake.
          </p>

          <a
            href="mailto:support@endsite.com"
            className="btn-primary inline-block"
          >
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  // ── Not logged in — redirect to login, preserve intended destination ────────
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // ── Authorised ─────────────────────────────────────────────────────────────
  return <Outlet />
}