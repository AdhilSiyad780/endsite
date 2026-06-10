// src/api/axios.js
//
// PERF FIX: The request interceptor previously called supabase.auth.getSession()
// before every API request. When logged in this is an async operation that adds
// 50-300ms latency to every call (categories, products, cart, etc).
//
// Fix: Cache the access token in memory. supabase.auth.onAuthStateChange keeps
// it current on login/logout/refresh. The interceptor reads from the cache
// synchronously — zero extra latency on every request.

import axios from 'axios'
import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  throw new Error('Missing VITE_API_BASE_URL in environment')
}

// ── In-memory token cache ──────────────────────────────────────────────────────
// Populated immediately on module load from the current session,
// then kept current by onAuthStateChange.
let _cachedToken = null

// Seed the cache from whatever session exists right now (e.g. on page refresh)
supabase.auth.getSession().then(({ data: { session } }) => {
  _cachedToken = session?.access_token ?? null
})

// Keep the cache current as auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    _cachedToken = session?.access_token ?? null
  }
  if (event === 'SIGNED_OUT') {
    _cachedToken = null
  }
})


// ── Axios instance ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})


// ── Request interceptor — attach token synchronously from cache ────────────────
// No async, no await, no network call — just reads _cachedToken from memory.
// Result: GET /products fires immediately instead of waiting for getSession().

api.interceptors.request.use(
  (config) => {
    if (_cachedToken) {
      config.headers.Authorization = `Bearer ${_cachedToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)


// ── Response interceptor — handle 401 with one refresh attempt ────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        // Token expired — ask Supabase to refresh it
        const { data: { session } } = await supabase.auth.refreshSession()
        if (session?.access_token) {
          _cachedToken = session.access_token          // update cache
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`
          return api(originalRequest)                  // retry original request
        }
      } catch {
        // Refresh failed — clear cache and let the request fail naturally.
        // AuthContext listens to onAuthStateChange(SIGNED_OUT) and clears state.
        _cachedToken = null
        await supabase.auth.signOut()
      }
    }

    // Normalise error shape from FastAPI { detail: "..." }
    error.normalizedMessage =
      error.response?.data?.detail  ||
      error.response?.data?.message ||
      error.message                 ||
      'Something went wrong'

    return Promise.reject(error)
  }
)


// ── Named helpers ──────────────────────────────────────────────────────────────

export const apiGet    = (url, params) => api.get(url, { params })
export const apiPost   = (url, data)   => api.post(url, data)
export const apiPut    = (url, data)   => api.put(url, data)
export const apiDelete = (url)         => api.delete(url)
export const apiPatch  = (url, data)   => api.patch(url, data)

export const apiUpload = (url, formData) =>
  api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const apiUploadPut = (url, formData) =>
  api.put(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export default api