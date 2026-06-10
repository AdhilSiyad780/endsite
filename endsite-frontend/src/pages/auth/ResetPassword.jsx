// src/pages/auth/ResetPassword.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../api/supabase'
import { Eye, EyeOff, Loader, CheckCircle } from 'lucide-react'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate           = useNavigate()

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors,      setErrors]      = useState({})
  const [serverError, setServerError] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)


  // ── Detect recovery session from URL hash ──────────────────────────────────
  // Supabase embeds the token in the URL after redirect

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])


  // ── Field updater ──────────────────────────────────────────────────────────

  const setField = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: '' }))
    setServerError('')
  }


  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const errs = {}
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
    try {
      await resetPassword(form.password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setServerError(err.message ?? 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="page-enter text-center">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 border border-brand-grey-200 flex items-center justify-center">
            <CheckCircle size={28} strokeWidth={1} className="text-brand-900" />
          </div>
        </div>
        <h1 className="text-3xl font-light tracking-wider uppercase text-brand-900 mb-4">
          Password Reset
        </h1>
        <p className="text-[13px] text-brand-grey-500 leading-relaxed mb-6">
          Your password has been updated successfully.
          You'll be redirected to login in a moment.
        </p>
        <div className="flex items-center justify-center gap-2 text-brand-grey-500">
          <Loader size={14} strokeWidth={1.5} className="animate-spin" />
          <span className="text-[12px] uppercase tracking-wider">Redirecting...</span>
        </div>
      </div>
    )
  }


  return (
    <div className="page-enter">

      {/* ── Heading ───────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-2">
          Account security
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase text-brand-900">
          Reset Password
        </h1>
        <p className="text-[13px] text-brand-grey-500 mt-3 leading-relaxed">
          Enter your new password below.
        </p>
      </div>

      {/* ── Server error ──────────────────────────────────────────────────────── */}
      {serverError && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
          <p className="text-[12px] text-red-600">{serverError}</p>
        </div>
      )}

      {/* ── Form ──────────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">

        {/* New password */}
        <div>
          <label className="input-label">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className={`input-underline pr-8 ${errors.password ? 'error' : ''}`}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              autoFocus
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
          <label className="input-label">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              className={`input-underline pr-8 ${errors.confirm ? 'error' : ''}`}
              placeholder="Repeat new password"
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
          {loading ? 'Updating password...' : 'Update Password'}
        </button>

      </form>

    </div>
  )
}