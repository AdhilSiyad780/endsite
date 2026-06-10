// src/pages/auth/Signup.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { Eye, EyeOff, Loader } from 'lucide-react'

export default function Signup() {
  const { signUp }         = useAuth()
  const { mergeGuestCart } = useCart()
  const navigate            = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email:    '',
    phone:    '',
    password: '',
    confirm:  '',
  })
  const [errors,      setErrors]      = useState({})
  const [serverError, setServerError] = useState('')
  const [success,     setSuccess]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)


  // ── Field updater ──────────────────────────────────────────────────────────

  const setField = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: '' }))
    setServerError('')
  }


  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {}
    if (!form.fullName.trim())
      errs.fullName = 'Full name is required'
    if (!form.email.trim())
      errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Enter a valid email address'
    if (form.phone && !/^\+?[\d\s\-]{10,}$/.test(form.phone))
      errs.phone = 'Enter a valid phone number'
    if (!form.password)
      errs.password = 'Password is required'
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters'
    if (!form.confirm)
      errs.confirm = 'Please confirm your password'
    else if (form.password !== form.confirm)
      errs.confirm = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }


  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    setSuccess('')
    try {
      const data = await signUp({
        email:    form.email,
        password: form.password,
        fullName: form.fullName,
        phone:    form.phone,
      })
      if (data?.session) {
        // Email confirmation disabled — immediately logged in
        await mergeGuestCart()
        navigate('/')
      } else {
        // Email confirmation required
        setSuccess('Account created! Please check your email to verify your account before logging in.')
      }
    } catch (err) {
      setServerError(err.message ?? 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="page-enter">

      {/* ── Heading ───────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-2">
          New here?
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase text-brand-900">
          Create Account
        </h1>
      </div>

      {/* ── Server error ──────────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
          <p className="text-[12px] text-red-600">{serverError}</p>
        </div>
      )}

      {/* ── Success message ────────────────────────────────────────────────────── */}
      {success && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200">
          <p className="text-[12px] text-green-700">{success}</p>
          <Link
            to="/login"
            className="text-[12px] text-green-800 underline underline-offset-2 mt-1 block"
          >
            Go to login →
          </Link>
        </div>
      )}

      {/* ── Form ──────────────────────────────────────────────────────────────── */}
      {!success && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">

          {/* Full name */}
          <div>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className={`input-underline ${errors.fullName ? 'error' : ''}`}
              placeholder="Your full name"
              autoComplete="name"
              autoFocus
              value={form.fullName}
              onChange={setField('fullName')}
            />
            {errors.fullName && (
              <p className="text-[11px] text-red-600 mt-1.5">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              className={`input-underline ${errors.email ? 'error' : ''}`}
              placeholder="your@email.com"
              autoComplete="email"
              value={form.email}
              onChange={setField('email')}
            />
            {errors.email && (
              <p className="text-[11px] text-red-600 mt-1.5">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="input-label">
              Phone{' '}
              <span className="text-brand-grey-500 normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="tel"
              className={`input-underline ${errors.phone ? 'error' : ''}`}
              placeholder="+91 98765 43210"
              autoComplete="tel"
              value={form.phone}
              onChange={setField('phone')}
            />
            {errors.phone && (
              <p className="text-[11px] text-red-600 mt-1.5">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className={`input-underline pr-8 ${errors.password ? 'error' : ''}`}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
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

          {/* Confirm password */}
          <div>
            <label className="input-label">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`input-underline pr-8 ${errors.confirm ? 'error' : ''}`}
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={setField('confirm')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-0 top-1/2 -translate-y-1/2
                  text-brand-grey-500 hover:text-brand-900 transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm
                  ? <EyeOff size={15} strokeWidth={1.5} />
                  : <Eye    size={15} strokeWidth={1.5} />
                }
              </button>
            </div>
            {errors.confirm && (
              <p className="text-[11px] text-red-600 mt-1.5">{errors.confirm}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader size={14} strokeWidth={1.5} className="animate-spin" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          {/* Terms note */}
          <p className="text-[11px] text-brand-grey-500 text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="underline underline-offset-2 hover:opacity-60">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline underline-offset-2 hover:opacity-60">
              Privacy Policy
            </Link>
          </p>

        </form>
      )}

      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-brand-grey-200" />
        <span className="text-[11px] uppercase tracking-wider text-brand-grey-500">or</span>
        <div className="flex-1 h-px bg-brand-grey-200" />
      </div>

      {/* ── Login link ────────────────────────────────────────────────────────── */}
      <p className="text-center text-[13px] text-brand-grey-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-brand-900 underline underline-offset-2
            hover:opacity-60 transition-opacity"
        >
          Sign in
        </Link>
      </p>

    </div>
  )
}