// src/context/CartContext.jsx
//
// FIXES:
// 1. mergeGuestCart is registered into AuthContext's mergeGuestCartRef on mount.
//    AuthContext.onAuthStateChange calls it on SIGNED_IN — this is the correct
//    sequence: auth confirmed → profile fetched → guest cart merged → cart ready.
//
// 2. The useEffect([isLoggedIn]) that called fetchCart() on login is REMOVED.
//    It was firing before the session was fully ready, fetching an empty DB cart,
//    and overwriting state before mergeGuestCart had a chance to run.
//    Cart loading is now entirely driven by mergeGuestCart (on login) and
//    loadGuestCart (on logout / initial guest load).
//
// 3. On SIGNED_OUT, AuthContext sets user=null → isLoggedIn flips false →
//    the useEffect below loads the guest cart (which will be empty post-logout,
//    which is correct).

import {
  createContext, useContext, useEffect,
  useState, useCallback
} from 'react'
import { useAuth } from './AuthContext'
import api from '../api/axios'
import {
  getGuestCart,
  addToGuestCart,
  updateGuestCart,
  removeFromGuestCart,
  clearGuestCart,
} from '../utils/guestCart'

const CartContext = createContext(null)


export function CartProvider({ children }) {
  const { isLoggedIn, mergeGuestCartRef } = useAuth()

  const [cartItems, setCartItems] = useState([])
  const [cartTotal, setCartTotal] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [cartId,    setCartId]    = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)


  // ── Sync derived totals ────────────────────────────────────────────────────

  const syncDerived = useCallback((items) => {
    const count = items.reduce((acc, i) => acc + i.quantity, 0)
    const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
    setCartCount(count)
    setCartTotal(parseFloat(total.toFixed(2)))
  }, [])


  // ── Fetch DB cart ──────────────────────────────────────────────────────────

  const fetchCart = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/cart')
      setCartItems(data.items      ?? [])
      setCartId(data.cart_id       ?? null)
      setCartTotal(data.total      ?? 0)
      setCartCount(data.item_count ?? 0)
    } catch (err) {
      setError(err.normalizedMessage ?? 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [])


  // ── Load guest cart ────────────────────────────────────────────────────────

  const loadGuestCart = useCallback(() => {
    const items = getGuestCart()
    setCartItems(items)
    setCartId(null)
    syncDerived(items)
  }, [syncDerived])


  // ── Merge guest cart after login ───────────────────────────────────────────
  // This function is stored in AuthContext's mergeGuestCartRef so that
  // onAuthStateChange can call it at exactly the right moment — after
  // SIGNED_IN fires and fetchProfile completes, but before any cart page
  // renders. This guarantees the guest items are never lost on login.

  const mergeGuestCart = useCallback(async () => {
    const guestItems = getGuestCart()

    if (guestItems.length === 0) {
      // No guest items — just load whatever is in the DB
      await fetchCart()
      return
    }

    setLoading(true)
    try {
      const payload = guestItems.map((i) => ({
        variant_id: i.variant_id,
        quantity:   i.quantity,
      }))
      const { data } = await api.post('/cart/merge', payload)
      clearGuestCart()
      setCartItems(data.items      ?? [])
      setCartTotal(data.total      ?? 0)
      setCartCount(data.item_count ?? 0)
      setCartId(data.cart_id       ?? null)
    } catch (err) {
      console.warn('[cart] Merge failed, loading DB cart:', err.message)
      clearGuestCart()
      await fetchCart()
    } finally {
      setLoading(false)
    }
  }, [fetchCart])


  // ── Register mergeGuestCart into AuthContext ref ───────────────────────────
  // AuthContext.onAuthStateChange reads mergeGuestCartRef.current on SIGNED_IN.
  // Using a ref means AuthContext doesn't need mergeGuestCart in its dependency
  // array — it always calls the latest version without re-subscribing.

  useEffect(() => {
    if (mergeGuestCartRef) {
      mergeGuestCartRef.current = mergeGuestCart
    }
  }, [mergeGuestCart, mergeGuestCartRef])


  // ── Load cart on mount / logout ────────────────────────────────────────────
  // On first mount: if not logged in, load guest cart from localStorage.
  // On logout (isLoggedIn flips false): clear DB cart state, load guest cart
  // (will be empty, which is correct — guest cart was cleared on login).
  // NOTE: on login, this effect is NOT responsible for loading the cart —
  // mergeGuestCart (called by onAuthStateChange) handles that instead.

  useEffect(() => {
    if (!isLoggedIn) {
      loadGuestCart()
    }
    // Intentionally omitting isLoggedIn=true branch:
    // cart loading on login is handled by mergeGuestCart via AuthContext ref
  }, [isLoggedIn, loadGuestCart])


  // ── Add to cart ────────────────────────────────────────────────────────────

  const addToCart = useCallback(async (variant, product, quantity = 1) => {
    setError(null)

    if (isLoggedIn) {
      try {
        const { data } = await api.post('/cart/items', {
          variant_id: variant.id,
          quantity,
        })
        setCartItems(data.items      ?? [])
        setCartTotal(data.total      ?? 0)
        setCartCount(data.item_count ?? 0)
      } catch (err) {
        setError(err.normalizedMessage ?? 'Failed to add item')
        throw err
      }
    } else {
      const item = {
        variant_id:   variant.id,
        quantity,
        product_id:   product.id,
        product_name: product.name,
        size:         variant.size   ?? null,
        color:        variant.color  ?? null,
        price:        variant.price_override ?? product.base_price,
        image_url:    product.primary_image  ?? null,
        sku:          variant.sku ?? '',
      }
      const updated = addToGuestCart(item)
      setCartItems(updated)
      syncDerived(updated)
    }
  }, [isLoggedIn, syncDerived])


  // ── Update quantity ────────────────────────────────────────────────────────

  const updateQty = useCallback(async (variantId, qty, itemId = null) => {
    setError(null)

    if (isLoggedIn) {
      try {
        const id = itemId ?? cartItems.find((i) => i.variant_id === variantId)?.id
        if (!id) return
        const { data } = await api.put(`/cart/items/${id}`, { quantity: qty })
        setCartItems(data.items      ?? [])
        setCartTotal(data.total      ?? 0)
        setCartCount(data.item_count ?? 0)
      } catch (err) {
        setError(err.normalizedMessage ?? 'Failed to update quantity')
        throw err
      }
    } else {
      const updated = updateGuestCart(variantId, qty)
      setCartItems(updated)
      syncDerived(updated)
    }
  }, [isLoggedIn, cartItems, syncDerived])


  // ── Remove item ────────────────────────────────────────────────────────────

  const removeItem = useCallback(async (variantId, itemId = null) => {
    setError(null)

    if (isLoggedIn) {
      try {
        const id = itemId ?? cartItems.find((i) => i.variant_id === variantId)?.id
        if (!id) return
        const { data } = await api.delete(`/cart/items/${id}`)
        setCartItems(data.items      ?? [])
        setCartTotal(data.total      ?? 0)
        setCartCount(data.item_count ?? 0)
      } catch (err) {
        setError(err.normalizedMessage ?? 'Failed to remove item')
        throw err
      }
    } else {
      const updated = removeFromGuestCart(variantId)
      setCartItems(updated)
      syncDerived(updated)
    }
  }, [isLoggedIn, cartItems, syncDerived])


  // ── Clear cart ─────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    setError(null)

    if (isLoggedIn) {
      try {
        await api.delete('/cart')
        setCartItems([])
        setCartTotal(0)
        setCartCount(0)
        setCartId(null)
      } catch (err) {
        setError(err.normalizedMessage ?? 'Failed to clear cart')
        throw err
      }
    } else {
      clearGuestCart()
      setCartItems([])
      setCartTotal(0)
      setCartCount(0)
    }
  }, [isLoggedIn])


  // ── Helpers ────────────────────────────────────────────────────────────────

  const isInCart = useCallback((variantId) =>
    cartItems.some((i) => i.variant_id === variantId),
  [cartItems])

  const getItemQty = useCallback((variantId) =>
    cartItems.find((i) => i.variant_id === variantId)?.quantity ?? 0,
  [cartItems])


  return (
    <CartContext.Provider value={{
      cartItems,
      cartTotal,
      cartCount,
      cartId,
      loading,
      error,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      mergeGuestCart,
      fetchCart,
      loadGuestCart,
      isInCart,
      getItemQty,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}