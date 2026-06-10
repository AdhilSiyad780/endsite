// src/utils/guestCart.js

const GUEST_CART_KEY = 'endsite_guest_cart'


// ── Read ───────────────────────────────────────────────────────────────────────

/**
 * Returns the current guest cart from localStorage.
 * Each item shape:
 * {
 *   variant_id:   string,
 *   quantity:     number,
 *   product_id:   string,
 *   product_name: string,
 *   size:         string | null,
 *   color:        string | null,
 *   price:        number,
 *   image_url:    string | null,
 *   sku:          string,
 * }
 */
export const getGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}


// ── Write ──────────────────────────────────────────────────────────────────────

const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart))
  } catch (err) {
    console.warn('[guestCart] Failed to save to localStorage:', err.message)
  }
}


// ── Add or increment ───────────────────────────────────────────────────────────

/**
 * Adds an item to the guest cart or increments quantity if it already exists.
 * @param {Object} item - Full item object including display info
 */
export const addToGuestCart = (item) => {
  const cart  = getGuestCart()
  const index = cart.findIndex((i) => i.variant_id === item.variant_id)

  if (index >= 0) {
    cart[index].quantity += item.quantity
  } else {
    cart.push({
      variant_id:   item.variant_id,
      quantity:     item.quantity,
      product_id:   item.product_id,
      product_name: item.product_name,
      size:         item.size   ?? null,
      color:        item.color  ?? null,
      price:        item.price,
      image_url:    item.image_url ?? null,
      sku:          item.sku   ?? '',
    })
  }

  saveGuestCart(cart)
  return cart
}


// ── Update quantity ────────────────────────────────────────────────────────────

/**
 * Sets the quantity of a specific variant in the guest cart.
 * If qty <= 0, removes the item.
 */
export const updateGuestCart = (variant_id, qty) => {
  let cart = getGuestCart()

  if (qty <= 0) {
    cart = cart.filter((i) => i.variant_id !== variant_id)
  } else {
    cart = cart.map((i) =>
      i.variant_id === variant_id ? { ...i, quantity: qty } : i
    )
  }

  saveGuestCart(cart)
  return cart
}


// ── Remove item ────────────────────────────────────────────────────────────────

/**
 * Removes a specific variant from the guest cart entirely.
 */
export const removeFromGuestCart = (variant_id) => {
  const cart = getGuestCart().filter((i) => i.variant_id !== variant_id)
  saveGuestCart(cart)
  return cart
}


// ── Clear ──────────────────────────────────────────────────────────────────────

/**
 * Empties the guest cart completely.
 * Called after successful login + cart merge.
 */
export const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY)
  } catch (err) {
    console.warn('[guestCart] Failed to clear localStorage:', err.message)
  }
}


// ── Count ──────────────────────────────────────────────────────────────────────

/**
 * Returns total number of items (sum of quantities) in the guest cart.
 */
export const getGuestCartCount = () => {
  return getGuestCart().reduce((acc, item) => acc + item.quantity, 0)
}


// ── Total ──────────────────────────────────────────────────────────────────────

/**
 * Returns total price of all items in the guest cart.
 */
export const getGuestCartTotal = () => {
  return getGuestCart().reduce((acc, item) => acc + item.price * item.quantity, 0)
}


// ── Check if variant is in cart ────────────────────────────────────────────────

/**
 * Returns true if the given variant_id is already in the guest cart.
 */
export const isInGuestCart = (variant_id) => {
  return getGuestCart().some((i) => i.variant_id === variant_id)
}


// ── Get single item ────────────────────────────────────────────────────────────

/**
 * Returns a single cart item by variant_id, or null if not found.
 */
export const getGuestCartItem = (variant_id) => {
  return getGuestCart().find((i) => i.variant_id === variant_id) ?? null
}