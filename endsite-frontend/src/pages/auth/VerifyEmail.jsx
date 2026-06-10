// src/pages/auth/VerifyEmail.jsx

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, Loader } from 'lucide-react'

export default function VerifyEmail() {
  const { user, forgotPassword } = useAuth()
  const navigate                  = useNavigate()

  const [resending,     setResending]     = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError,   setResendError]   = useState('')
  const [countdown,     setCountdown]     = useState(0)


  // ── If already verified and logged in — redirect ───────────────────────────

  useEffect(() => {
    if (user?.email_confirmed_at) {
      navigate('/', { replace: true })
    }
  }, [user])


  // ── Resend countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])


  // ── Resend verification email ──────────────────────────────────────────────

  const handleResend = async () => {
    if (!user?.email || countdown > 0) return
    setResending(true)
    setResendError('')
    setResendSuccess(false)
    try {
      await forgotPassword(user.email)
      setResendSuccess(true)
      setCountdown(60) // 60 second cooldown
    } catch (err) {
      setResendError(err.message ?? 'Failed to resend email.')
    } finally {
      setResending(false)
    }
  }


  return (
    <div className="page-enter text-center">

      {/* ── Icon ──────────────────────────────────────────────────────────────── */}
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 border border-brand-grey-200 flex items-center justify-center">
          <CheckCircle size={28} strokeWidth={1} className="text-brand-900" />
        </div>
      </div>

      {/* ── Heading ───────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest text-brand-grey-500 mb-2">
          Almost there
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase text-brand-900 mb-4">
          Verify Your Email
        </h1>
        <p className="text-[13px] text-brand-grey-500 leading-relaxed">
          We've sent a verification link to{' '}
          <span className="text-brand-900 font-medium">
            {user?.email ?? 'your email address'}
          </span>
          . Please check your inbox and click the link to activate your account.
        </p>
      </div>

      {/* ── Resend section ────────────────────────────────────────────────────── */}
      <div className="border-t border-brand-grey-200 pt-8 flex flex-col gap-4">

        {resendSuccess && (
          <div className="px-4 py-3 bg-green-50 border border-green-200">
            <p className="text-[12px] text-green-700">
              Verification email resent! Please check your inbox.
            </p>
          </div>
        )}

        {resendError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200">
            <p className="text-[12px] text-red-600">{resendError}</p>
          </div>
        )}

        <p className="text-[12px] text-brand-grey-500">
          Didn't receive the email?
        </p>

        <button
          onClick={handleResend}
          disabled={resending || countdown > 0}
          className="btn-outline w-full flex items-center justify-center gap-2"
        >
          {resending && <Loader size={14} strokeWidth={1.5} className="animate-spin" />}
          {countdown > 0
            ? `Resend in ${countdown}s`
            : resending
              ? 'Sending...'
              : 'Resend Verification Email'
          }
        </button>

        <p className="text-[11px] text-brand-grey-500">
          Also check your spam or junk folder.
        </p>

      </div>

      {/* ── Back to login ─────────────────────────────────────────────────────── */}
      <div className="mt-8">
        <Link
          to="/login"
          className="text-[12px] uppercase tracking-wider
            text-brand-grey-500 hover:text-brand-900 transition-colors"
        >
          ← Back to login
        </Link>
      </div>

    </div>
  )
}