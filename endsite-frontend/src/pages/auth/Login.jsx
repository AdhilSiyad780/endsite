// src/pages/auth/Login.jsx

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { Eye, EyeOff, Loader } from 'lucide-react'

export default function Login() {
  const { signIn }         = useAuth()
  const { mergeGuestCart } = useCart()
  const navigate            = useNavigate()
  const location            = useLocation()

  const redirectTo = location.state?.from ?? '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)


  // ── Field updater ──────────────────────────────────────────────────────────

  const setField = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: '' }))
    setServerError('')
  }


  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {}
    if (!form.email.trim())
      errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Enter a valid email'
    if (!form.password)
      errs.password = 'Password is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }


  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await signIn({ email: form.email, password: form.password })
      await mergeGuestCart()
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(err.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="page-enter">

      {/* ── Heading ───────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-2">
          Welcome back
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase text-brand-900">
          Sign In
        </h1>
      </div>

      {/* ── Server error ──────────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
          <p className="text-[12px] text-red-600">{serverError}</p>
        </div>
      )}

      {/* ── Form ──────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">

        {/* Email */}
        <div>
          <label className="input-label">Email</label>
          <input
            type="email"
            className={`input-underline ${errors.email ? 'error' : ''}`}
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            value={form.email}
            onChange={setField('email')}
          />
          {errors.email && (
            <p className="text-[11px] text-red-600 mt-1.5">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-0">
            <label className="input-label">Password</label>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className={`input-underline pr-8 ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={setField('password')}
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-0 top-1/2 -translate-y-1/2
                text-brand-grey-500 hover:text-brand-900 transition-colors"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass
                ? <EyeOff size={15} strokeWidth={1.5} />
                : <Eye    size={15} strokeWidth={1.5} />
              }
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-600 mt-1.5">{errors.password}</p>
          )}
        </div>

        {/* Forgot password link */}
        <div className="text-right -mt-4">
          <Link
            to="/forgot-password"
            className="text-[11px] uppercase tracking-wider
              text-brand-grey-500 hover:text-brand-900 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
        >
          {loading && <Loader size={14} strokeWidth={1.5} className="animate-spin" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

      </form>

      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-brand-grey-200" />
        <span className="text-[11px] uppercase tracking-wider text-brand-grey-500">or</span>
        <div className="flex-1 h-px bg-brand-grey-200" />
      </div>

      {/* ── Sign up link ──────────────────────────────────────────────────────── */}
      <p className="text-center text-[13px] text-brand-grey-500">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="text-brand-900 underline underline-offset-2
            hover:opacity-60 transition-opacity"
        >
          Create one
        </Link>
      </p>

    </div>
  )
}