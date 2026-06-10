// src/components/LoginPromptModal.jsx

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { X, Eye, EyeOff, Loader } from 'lucide-react'

export default function LoginPromptModal({ isOpen, onClose, redirectTo = '/checkout' }) {
  const { signIn, signUp }       = useAuth()
  const { mergeGuestCart }       = useCart()
  const navigate                  = useNavigate()

  const [tab,         setTab]         = useState('login')   // 'login' | 'signup'
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const modalRef = useRef(null)

  // ── Login form state ───────────────────────────────────────────────────────
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginErrors, setLoginErrors] = useState({})

  // ── Signup form state ──────────────────────────────────────────────────────
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email:    '',
    phone:    '',
    password: '',
    confirm:  '',
  })
  const [signupErrors, setSignupErrors] = useState({})


  // ── Reset state when modal opens / tab changes ─────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess('')
      setLoginErrors({})
      setSignupErrors({})
      setLoginForm({ email: '', password: '' })
      setSignupForm({ fullName: '', email: '', phone: '', password: '', confirm: '' })
      setShowPass(false)
      setShowConfirm(false)
    }
  }, [isOpen, tab])


  // ── Close on Escape key ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])


  // ── Prevent body scroll when open ─────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])


  if (!isOpen) return null


  // ── Validation ─────────────────────────────────────────────────────────────

  const validateLogin = () => {
    const errs = {}
    if (!loginForm.email.trim())    errs.email    = 'Email is required'
    if (!loginForm.password.trim()) errs.password = 'Password is required'
    setLoginErrors(errs)
    return Object.keys(errs).length === 0
  }

  const validateSignup = () => {
    const errs = {}
    if (!signupForm.fullName.trim())
      errs.fullName = 'Full name is required'
    if (!signupForm.email.trim())
      errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(signupForm.email))
      errs.email = 'Enter a valid email'
    if (!signupForm.password)
      errs.password = 'Password is required'
    else if (signupForm.password.length < 8)
      errs.password = 'Password must be at least 8 characters'
    if (signupForm.password !== signupForm.confirm)
      errs.confirm = 'Passwords do not match'
    setSignupErrors(errs)
    return Object.keys(errs).length === 0
  }


  // ── Handle login submit ────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!validateLogin()) return
    setLoading(true)
    setError('')
    try {
      await signIn({ email: loginForm.email, password: loginForm.password })
      await mergeGuestCart()
      onClose()
      navigate(redirectTo)
    } catch (err) {
      setError(err.message ?? 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  // ── Handle signup submit ───────────────────────────────────────────────────

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!validateSignup()) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await signUp({
        email:    signupForm.email,
        password: signupForm.password,
        fullName: signupForm.fullName,
        phone:    signupForm.phone,
      })

      // If session exists, user is immediately logged in (email confirm disabled)
      if (data?.session) {
        await mergeGuestCart()
        onClose()
        navigate(redirectTo)
      } else {
        // Email confirmation required
        setSuccess('Account created! Please check your email to verify your account.')
      }
    } catch (err) {
      setError(err.message ?? 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  // ── Field helpers ──────────────────────────────────────────────────────────

  const loginField   = (field) => ({
    value:    loginForm[field],
    onChange: (e) => {
      setLoginForm((p) => ({ ...p, [field]: e.target.value }))
      setLoginErrors((p) => ({ ...p, [field]: '' }))
    },
  })

  const signupField  = (field) => ({
    value:    signupForm[field],
    onChange: (e) => {
      setSignupForm((p) => ({ ...p, [field]: e.target.value }))
      setSignupErrors((p) => ({ ...p, [field]: '' }))
    },
  })


  return (
    // ── Backdrop ──────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >

      {/* ── Modal card ──────────────────────────────────────────────────────── */}
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[440px] relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Close button ──────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-grey-500
            hover:text-brand-900 transition-colors z-10"
          aria-label="Close"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-0">
          <h2 className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-1">
            endsite
          </h2>
          <p className="text-xl font-light tracking-wider uppercase text-brand-900">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </p>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="px-8 pt-6 flex gap-0 border-b border-brand-grey-200">
          {['login', 'signup'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccess('') }}
              className={`pb-3 mr-6 text-[12px] uppercase tracking-wider
                transition-all duration-200 border-b-2
                ${tab === t
                  ? 'border-black text-brand-900'
                  : 'border-transparent text-brand-grey-500 hover:text-brand-900'
                }`}
            >
              {t === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* ── Error / success banner ─────────────────────────────────────────── */}
        {error && (
          <div className="mx-8 mt-5 px-4 py-3 bg-red-50 border border-red-200">
            <p className="text-[12px] text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mx-8 mt-5 px-4 py-3 bg-green-50 border border-green-200">
            <p className="text-[12px] text-green-700">{success}</p>
          </div>
        )}

        {/* ── Login form ────────────────────────────────────────────────────── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="px-8 py-7 flex flex-col gap-6" noValidate>

            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className={`input-underline ${loginErrors.email ? 'error' : ''}`}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                {...loginField('email')}
              />
              {loginErrors.email && (
                <p className="text-[11px] text-red-600 mt-1">{loginErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input-underline pr-8 ${loginErrors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...loginField('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-0 top-1/2 -translate-y-1/2
                    text-brand-grey-500 hover:text-brand-900 transition-colors"
                >
                  {showPass
                    ? <EyeOff size={15} strokeWidth={1.5} />
                    : <Eye    size={15} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-[11px] text-red-600 mt-1">{loginErrors.password}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-right -mt-3">
              <button
                type="button"
                onClick={() => { onClose(); navigate('/forgot-password') }}
                className="text-[11px] uppercase tracking-wider
                  text-brand-grey-500 hover:text-brand-900 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader size={14} strokeWidth={1.5} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Switch to signup */}
            <p className="text-center text-[12px] text-brand-grey-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setTab('signup')}
                className="text-brand-900 underline underline-offset-2
                  hover:opacity-60 transition-opacity"
              >
                Sign up
              </button>
            </p>

          </form>
        )}

        {/* ── Signup form ───────────────────────────────────────────────────── */}
        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="px-8 py-7 flex flex-col gap-6" noValidate>

            {/* Full name */}
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className={`input-underline ${signupErrors.fullName ? 'error' : ''}`}
                placeholder="Your full name"
                autoComplete="name"
                autoFocus
                {...signupField('fullName')}
              />
              {signupErrors.fullName && (
                <p className="text-[11px] text-red-600 mt-1">{signupErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className={`input-underline ${signupErrors.email ? 'error' : ''}`}
                placeholder="your@email.com"
                autoComplete="email"
                {...signupField('email')}
              />
              {signupErrors.email && (
                <p className="text-[11px] text-red-600 mt-1">{signupErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="input-label">Phone <span className="text-brand-grey-500">(optional)</span></label>
              <input
                type="tel"
                className="input-underline"
                placeholder="+91 98765 43210"
                autoComplete="tel"
                {...signupField('phone')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input-underline pr-8 ${signupErrors.password ? 'error' : ''}`}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  {...signupField('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-0 top-1/2 -translate-y-1/2
                    text-brand-grey-500 hover:text-brand-900 transition-colors"
                >
                  {showPass
                    ? <EyeOff size={15} strokeWidth={1.5} />
                    : <Eye    size={15} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {signupErrors.password && (
                <p className="text-[11px] text-red-600 mt-1">{signupErrors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`input-underline pr-8 ${signupErrors.confirm ? 'error' : ''}`}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  {...signupField('confirm')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-0 top-1/2 -translate-y-1/2
                    text-brand-grey-500 hover:text-brand-900 transition-colors"
                >
                  {showConfirm
                    ? <EyeOff size={15} strokeWidth={1.5} />
                    : <Eye    size={15} strokeWidth={1.5} />
                  }
                </button>
              </div>
              {signupErrors.confirm && (
                <p className="text-[11px] text-red-600 mt-1">{signupErrors.confirm}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader size={14} strokeWidth={1.5} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Switch to login */}
            <p className="text-center text-[12px] text-brand-grey-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setTab('login')}
                className="text-brand-900 underline underline-offset-2
                  hover:opacity-60 transition-opacity"
              >
                Sign in
              </button>
            </p>

          </form>
        )}

      </div>
    </div>
  )
}