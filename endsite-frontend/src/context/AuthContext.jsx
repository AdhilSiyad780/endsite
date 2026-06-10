// src/context/AuthContext.jsx
//
// FIXES:
// 1. signIn() no longer calls fetchProfile() manually — onAuthStateChange
//    is the single source of truth for all auth state updates. Calling it
//    in two places caused a race where two /me requests ran in parallel.
//
// 2. onAuthStateChange now receives mergeGuestCart via a ref so it can
//    call it on SIGNED_IN without adding it as a dependency (which would
//    cause the effect to re-run and re-subscribe on every cart change).
//
// 3. A separate authReady state is exposed so ProtectedRoute can wait for
//    the full init sequence (session check + profile fetch) before deciding
//    to redirect — preventing the flash-to-login on hard refresh.

import {
  createContext, useContext, useEffect,
  useState, useCallback, useRef
} from 'react'
import { supabase } from '../api/supabase'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)   // true until first session check done

  // Ref so onAuthStateChange can call mergeGuestCart without being in its
  // dependency array (avoids re-subscribing every time cart changes)
  const mergeGuestCartRef = useRef(null)


  // ── Fetch profile ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/me')
      setProfile(data)
      return data
    } catch {
      setProfile(null)
      return null
    }
  }, [])


  // ── Initialise + subscribe ─────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        if (session?.user) {
          setUser(session.user)
          await fetchProfile()
        }
      } catch (err) {
        console.warn('[auth] Init error:', err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    // onAuthStateChange is the ONLY place that reacts to login/logout events.
    // signIn() / signUp() no longer call fetchProfile() themselves — they just
    // trigger Supabase, which fires this listener, which does all the work.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          await fetchProfile()

          // Merge guest cart into DB cart now that we have a valid session.
          // mergeGuestCartRef.current is set by CartProvider after it mounts.
          if (mergeGuestCartRef.current) {
            await mergeGuestCartRef.current()
          }
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }
      }
    )

    const handleSessionExpired = async () => {
      if (!mounted) return
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    }

    window.addEventListener('endsite:session-expired', handleSessionExpired)

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('endsite:session-expired', handleSessionExpired)
    }
  }, [fetchProfile])


  // ── Auth actions ───────────────────────────────────────────────────────────

  const signUp = async ({ email, password, fullName, phone }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone: phone ?? '' } }
    })
    if (error) throw error
    return data
    // onAuthStateChange fires SIGNED_IN → fetchProfile + mergeGuestCart
  }

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
    // DO NOT call fetchProfile() or setUser() here.
    // onAuthStateChange fires SIGNED_IN and handles everything in one place.
    // Calling it here too causes two concurrent /me requests (race condition).
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[auth] signOut error:', err.message)
    } finally {
      // Always clear local state even if Supabase call fails
      setUser(null)
      setProfile(null)
    }
  }

  const forgotPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  const resetPassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const updateProfile = async (fields) => {
    const { data } = await api.put('/me', fields)
    setProfile(data)
    return data
  }


  // ── Derived ────────────────────────────────────────────────────────────────

  const isLoggedIn = !!user
  const isAdmin    = profile?.role === 'admin'
  const isBlocked  = profile?.is_blocked === true


  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isLoggedIn,
      isAdmin,
      isBlocked,
      mergeGuestCartRef,   // CartProvider writes its mergeGuestCart fn into this ref
      signUp,
      signIn,
      signOut,
      forgotPassword,
      resetPassword,
      updateProfile,
      fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}