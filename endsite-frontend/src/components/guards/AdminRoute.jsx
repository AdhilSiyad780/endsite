// src/components/guards/AdminRoute.jsx

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminRoute() {
  const { isLoggedIn, loading, isBlocked, profile } = useAuth()
  const location = useLocation()

  // 1. Still checking session loop
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border border-solid border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] uppercase tracking-wider text-white/50 m-0">
            Loading Admin Workspace
          </p>
        </div>
      </div>
    )
  }

  // 2. Clear unauthenticated users
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // 3. Clear blocked users
  if (isBlocked) {
    return <Navigate to="/" replace />
  }

  // 4. FIX: Check explicit string properties on profile structure directly 
  const userRole = profile?.role || profile?._profile_dict?.role;
  const isUserAdmin = userRole === 'admin';

  if (profile && !isUserAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6 font-font-family-font-1">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-4 m-0">
            403 FORBIDDEN
          </p>
          <h1 className="text-2xl font-light tracking-wider uppercase text-brand-900 mb-4 m-0">
            ACCESS DENIED
          </h1>
          <p className="text-sm text-brand-grey-500 leading-relaxed mb-8 m-0">
            Your account credentials do not clear the security deployment thresholds required for backend management administration panel access.
          </p>
          <a href="/" className="bg-black text-white px-6 py-3 uppercase tracking-wider text-[12px] inline-block hover:opacity-80 transition-opacity">
            Back to Store
          </a>
        </div>
      </div>
    )
  }

  // 5. Authorised admin layout initialization clearance
  return <Outlet />
}