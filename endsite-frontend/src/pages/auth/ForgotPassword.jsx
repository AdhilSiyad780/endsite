// src/pages/auth/ForgotPassword.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const { forgotPassword } = useAuth()

  const [email,       setEmail]       = useState('')
  const [emailError,  setEmailError]  = useState('')
  const [serverError, setServerError] = useState('')
  const [success,     setSuccess]     = useState(false)
  const [loading,     setLoading]     = useState(false)


  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }


  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError('')
    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setServerError(err.message ?? 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="page-enter">

      {/* ── Back link ─────────────────────────────────────────────────────────── */}
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider
          text-brand-grey-500 hover:text-brand-900 transition-colors mb-10"
      >
        <ArrowLeft size={13} strokeWidth={1.5} />
        Back to login
      </Link>

      {/* ── Heading ───────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-2">
          Account recovery
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase text-brand-900">
          Forgot Password
        </h1>
        <p className="text-[13px] text-brand-grey-500 mt-3 leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* ── Success state ──────────────────────────────────────────────────────── */}
      {success ? (
        <div className="flex flex-col gap-6">
          <div className="px-4 py-4 bg-green-50 border border-green-200">
            <p className="text-[12px] text-green-700 leading-relaxed">
              If an account exists for <strong>{email}</strong>, you'll receive a
              password reset link shortly. Please check your inbox and spam folder.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-primary w-full text-center flex items-center justify-center"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <>
          {/* ── Server error ────────────────────────────────────────────────────── */}
          {serverError && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
              <p className="text-[12px] text-red-600">{serverError}</p>
            </div>
          )}

          {/* ── Form ────────────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">

            {/* Email */}
            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className={`input-underline ${emailError ? 'error' : ''}`}
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError('')
                  setServerError('')
                }}
              />
              {emailError && (
                <p className="text-[11px] text-red-600 mt-1.5">{emailError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader size={14} strokeWidth={1.5} className="animate-spin" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

          </form>
        </>
      )}

    </div>
  )
}