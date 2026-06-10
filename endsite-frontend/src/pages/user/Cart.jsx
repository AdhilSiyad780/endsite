// src/pages/user/Cart.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, X, ShoppingBag, ArrowRight, Loader } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import LoginPromptModal from '../../components/LoginPromptModal'

export default function Cart() {
  const { isLoggedIn } = useAuth()
  const { cartItems, cartTotal, cartCount, updateQty,
    removeItem, clearCart, loading } = useCart()
  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [clearing, setClearing] = useState(false)
  const [itemErrors, setItemErrors] = useState({})

  // ── Quantity update ────────────────────────────────────────────────────────
  const handleUpdateQty = async (item, newQty) => {
    if (newQty < 1) return
    if (newQty > item.stock) {
      setItemErrors((p) => ({
        ...p,
        [item.variant_id]: `Only ${item.stock} in stock`,
      }))
      return
    }
    setItemErrors((p) => ({ ...p, [item.variant_id]: '' }))
    setUpdatingId(item.variant_id)
    try {
      await updateQty(item.variant_id, newQty, item.id)
    } catch (err) {
      setItemErrors((p) => ({
        ...p,
        [item.variant_id]: err.normalizedMessage ?? 'Update failed',
      }))
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Remove item ────────────────────────────────────────────────────────────
  const handleRemove = async (item) => {
    setRemovingId(item.variant_id)
    try {
      await removeItem(item.variant_id, item.id)
    } catch (err) {
      setItemErrors((p) => ({
        ...p,
        [item.variant_id]: err.normalizedMessage ?? 'Remove failed',
      }))
    } finally {
      setRemovingId(null)
    }
  }

  // ── Clear cart ─────────────────────────────────────────────────────────────
  const handleClear = async () => {
    setClearing(true)
    try {
      await clearCart()
    } catch (err) {
      console.warn('[cart] Clear failed:', err.message)
    } finally {
      setClearing(false)
    }
  }

  // ── Proceed to checkout ────────────────────────────────────────────────────
  const handleCheckout = () => {
    if (!isLoggedIn) {
      setModalOpen(true)
      return
    }
    navigate('/checkout')
  }

  const shippingThreshold = 999
  const shippingFee = cartTotal >= shippingThreshold ? 0 : 99
  const grandTotal = cartTotal + shippingFee

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full h-auto min-h-screen relative [background:#e9edf2] overflow-y-auto flex flex-col items-start pt-0 px-0 pb-[981.3px] box-border gap-[154.7px] leading-[normal] tracking-[normal] font-font-family-font-1">
        <div className="self-stretch flex flex-col items-start py-8 px-[42px] bg-color-grey-93-2 border-b border-solid border-color-azure-86">
          <div className="h-8 w-32 bg-color-azure-63/20 animate-pulse" />
        </div>
        <div className="self-stretch flex flex-col items-start py-0 px-[42px] gap-6">
          {Array(3).fill(null).map((_, i) => (
            <div key={i} className="w-[917.3px] flex gap-4 max-w-full">
              <div className="w-[133.3px] h-[133.3px] bg-color-azure-63/20 animate-pulse shrink-0" />
              <div className="flex-1 flex flex-col gap-2 pt-2">
                <div className="h-4 w-2/3 bg-color-azure-63/20 animate-pulse" />
                <div className="h-3 w-1/3 bg-color-azure-63/20 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="w-full h-auto min-h-screen relative [background:#e9edf2] overflow-y-auto flex flex-col items-start pt-0 px-0 pb-[200px] box-border gap-[105.3px] leading-[normal] tracking-[normal] font-font-family-font-1">
        <header className="self-stretch bg-color-grey-93-2 flex flex-col items-start py-8 px-[42px] border-b border-solid border-color-azure-86">
          <p className="text-[11px] uppercase tracking-letter-spacing-0-18 text-color-azure-63 mb-2 font-font-weight-500">
            YOUR BAG
          </p>
          <h1 className="m-0 text-[26.7px] font-font-weight-400 text-color-black-solid tracking-wider uppercase">
            CART
          </h1>
        </header>

        <div className="self-stretch flex flex-col items-center justify-center py-24 px-[42px] text-center border-t border-b border-solid border-color-azure-86 bg-color-white-solid max-w-full">
          <ShoppingBag size={48} strokeWidth={0.75} className="text-color-azure-63 mb-6" />
          <p className="text-[13px] uppercase tracking-letter-spacing-0-18 text-color-azure-63 mb-3">
            NOTHING HERE YET
          </p>
          <h2 className="m-0 text-[26.7px] font-font-weight-400 tracking-wider text-color-black-solid uppercase mb-4">
            YOUR CART IS EMPTY
          </h2>
          <p className="text-font-size-16 leading-line-height-24 text-color-azure-32 mb-8 max-w-xs">
            Add items from the store grid to initialize your collection checkout ecosystem.
          </p>
          <Link
            to="/products"
            className="bg-color-black-solid text-color-white-solid uppercase tracking-wider text-[13px] py-4 px-8 font-font-weight-500 transition-opacity hover:opacity-80"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-[#e9edf2] pt-24 pb-20 font-font-family-font-1 text-color-black-solid">

        {/* ── Header Wrapper ─────────────────────────────────────────────────── */}
        <header className="self-stretch bg-color-grey-93-2 flex items-end justify-between py-8 px-[42px] border-b border-solid border-color-azure-86 top-0 sticky z-[99]">
          <div>
            <p className="text-[11px] uppercase tracking-letter-spacing-0-18 text-color-azure-32 mb-2 font-font-weight-500">
              YOUR BAG
            </p>
            <h1 className="m-0 text-[26.7px] font-font-weight-400 tracking-wider uppercase flex items-center">
              CART
              <span className="text-color-azure-32 ml-3 text-xl font-font-weight-500">
                ({cartCount})
              </span>
            </h1>
          </div>

          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-letter-spacing-0-18 text-color-azure-32 hover:text-color-black-solid transition-colors pb-1 border-b border-solid border-color-azure-32"
          >
            {clearing ? (
              <Loader size={12} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <X size={12} strokeWidth={1.5} />
            )}
            Clear cart
          </button>
        </header>

        {/* ── Main Layout Frame ──────────────────────────────────────────────── */}
        <div className="self-stretch flex flex-col lg:flex-row items-start py-0 px-[42px] gap-[42.6px] max-w-full shrink-0 box-border">

          {/* ── Cart Items Column List ───────────────────────────────────────── */}
          <div className="w-full lg:w-[917.3px] flex flex-col items-start max-w-full">

            {/* Column Desktop Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 w-full pb-3 border-b border-solid border-color-azure-86 text-left">
              <div className="col-span-6">
                <p className="text-[11px] uppercase tracking-letter-spacing-0-18 text-color-azure-63 font-font-weight-500">
                  PRODUCT
                </p>
              </div>
              <div className="col-span-2 text-center">
                <p className="text-[11px] uppercase tracking-letter-spacing-0-18 text-color-azure-63 font-font-weight-500">
                  PRICE
                </p>
              </div>
              <div className="col-span-2 text-center">
                <p className="text-[11px] uppercase tracking-letter-spacing-0-18 text-color-azure-63 font-font-weight-500">
                  QTY
                </p>
              </div>
              <div className="col-span-2 text-right">
                <p className="text-[11px] uppercase tracking-letter-spacing-0-18 text-color-azure-63 font-font-weight-500">
                  TOTAL
                </p>
              </div>
            </div>

            {/* Content List Items */}
            <div className="w-full flex flex-col divide-y divide-solid divide-color-azure-86">
              {cartItems.map((item) => {
                const isUpdating = updatingId === item.variant_id
                const isRemoving = removingId === item.variant_id
                const itemError = itemErrors[item.variant_id]
                const itemTotal = item.price * item.quantity

                return (
                  <div
                    key={item.variant_id}
                    className={`w-full py-6 transition-opacity duration-200 ${isRemoving ? 'opacity-40 pointer-events-none' : 'opacity-100'
                      }`}
                  >
                    <div className="grid grid-cols-12 gap-4 items-start w-full">

                      {/* Image Frame component slot + specifications metadata */}
                      <div className="col-span-12 md:col-span-6 flex gap-4 text-left">
                        <Link to={`/products/${item.product_id}`} className="shrink-0">
                          <div className="w-[133.3px] h-[133.3px] bg-color-white-solid border border-solid border-color-azure-86 overflow-hidden flex items-center justify-center shrink-0">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-full h-full object-cover max-w-width-186-67 max-h-height-582-67"
                                draggable={false}
                              />
                            ) : (
                              <ShoppingBag size={24} strokeWidth={1} className="text-color-azure-63" />
                            )}
                          </div>
                        </Link>

                        <div className="flex flex-col gap-[6.66px] min-w-0">
                          <Link
                            to={`/products/${item.product_id}`}
                            className="text-font-size-16 font-font-weight-500 uppercase leading-line-height-21-33 text-color-black-solid hover:text-color-azure-32 transition-colors line-clamp-2"
                          >
                            {item.product_name}
                          </Link>

                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {item.color && (
                              <p className="text-[11px] uppercase tracking-wider text-color-azure-32 m-0">
                                COLOR: {item.color}
                              </p>
                            )}
                            {item.size && (
                              <p className="text-[11px] uppercase tracking-wider text-color-azure-32 m-0">
                                SIZE: {item.size}
                              </p>
                            )}
                          </div>

                          {item.sku && (
                            <p className="text-[10px] uppercase tracking-wider text-color-azure-63 m-0">
                              SKU: {item.sku}
                            </p>
                          )}

                          <p className="text-[13px] font-font-weight-500 text-color-black-solid mt-1 md:hidden">
                            ₹{item.price.toLocaleString('en-IN')}
                          </p>

                          <button
                            onClick={() => handleRemove(item)}
                            disabled={isRemoving}
                            className="md:hidden flex items-center gap-1 text-[11px] uppercase tracking-wider text-color-azure-63 hover:text-color-black-solid transition-colors mt-1 self-start"
                          >
                            <X size={11} strokeWidth={1.5} />
                            Remove
                          </button>

                          {itemError && (
                            <p className="text-[11px] text-color-azure-32 font-font-weight-500 mt-1 m-0">
                              {itemError}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Desktop Unit view price column */}
                      <div className="hidden md:flex col-span-2 items-start justify-center pt-2">
                        <p className="text-[13px] text-color-black-solid m-0">
                          ₹{item.price.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Quantity control matrix frame */}
                      <div className="col-span-8 md:col-span-2 flex items-start justify-start md:justify-center pt-1">
                        <div className={`flex items-center border border-solid border-color-azure-86 bg-color-white-solid rounded-[2.7px] transition-opacity ${isUpdating ? 'opacity-50' : 'opacity-100'
                          }`}>
                          <button
                            onClick={() => handleUpdateQty(item, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="p-2 border-r border-solid border-color-azure-86 hover:bg-color-grey-93-2 transition-colors disabled:opacity-30"
                          >
                            {isUpdating ? (
                              <Loader size={12} strokeWidth={1.5} className="animate-spin" />
                            ) : (
                              <Minus size={12} strokeWidth={1.5} />
                            )}
                          </button>
                          <span className="px-3 text-[13px] font-font-weight-500 min-w-[24px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= item.stock}
                            className="p-2 border-l border-solid border-color-azure-86 hover:bg-color-grey-93-2 transition-colors disabled:opacity-30"
                          >
                            <Plus size={12} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>

                      {/* Line metric calculation view */}
                      <div className="hidden md:flex col-span-2 items-start justify-end gap-3 pt-2">
                        <p className="text-[13px] font-font-weight-500 text-color-black-solid m-0">
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </p>
                        <button
                          onClick={() => handleRemove(item)}
                          disabled={isRemoving}
                          className="text-color-azure-63 hover:text-color-black-solid transition-colors"
                          aria-label="Remove item"
                        >
                          <X size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      <div className="col-span-4 md:hidden flex items-start justify-end pt-1">
                        <p className="text-[13px] font-font-weight-500 text-color-black-solid m-0">
                          ₹{itemTotal.toLocaleString('en-IN')}
                        </p>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>

            {/* Navigation backflow */}
            <div className="mt-8 text-left">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-[12px] uppercase tracking-letter-spacing-0-18 text-color-azure-32 hover:text-color-black-solid transition-colors font-font-weight-500"
              >
                ← CONTINUE SHOPPING
              </Link>
            </div>

          </div>

          {/* ── Checkout Calculations Block Panel ───────────────────────────── */}
          <div className="w-full lg:w-[458.7px] flex-1 max-w-full relative isolate">
            <div className="bg-color-white-solid border border-solid border-color-azure-86 p-6 sticky top-24 rounded-2xl flex flex-col items-start text-left">

              <h2 className="m-0 text-[13px] uppercase tracking-letter-spacing-0-18 text-color-black-solid font-font-weight-500 mb-6 self-stretch border-b border-solid border-color-grey-93-2 pb-3">
                ORDER SUMMARY
              </h2>

              <div className="self-stretch flex flex-col gap-3 mb-6">
                <div className="flex items-center justify-between w-full">
                  <p className="text-[12px] uppercase tracking-wider text-color-azure-32 m-0">
                    Subtotal ({cartCount} items)
                  </p>
                  <p className="text-[13px] font-font-weight-500 text-color-black-solid m-0">
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center justify-between w-full">
                  <p className="text-[12px] uppercase tracking-wider text-color-azure-32 m-0">
                    Shipping
                  </p>
                  {shippingFee === 0 ? (
                    <p className="text-[13px] text-color-black-solid uppercase tracking-letter-spacing-0-18 font-font-weight-500 m-0">
                      FREE
                    </p>
                  ) : (
                    <p className="text-[13px] text-color-black-solid m-0">
                      ₹{shippingFee}
                    </p>
                  )}
                </div>

                {shippingFee > 0 && (
                  <p className="text-[11px] text-color-azure-63 m-0">
                    Add ₹{(shippingThreshold - cartTotal).toLocaleString('en-IN')} more for free shipping tier execution.
                  </p>
                )}

                {/* Tracking scale tier clip */}
                <div className="w-full h-0.5 bg-color-grey-93-2 mt-1 relative overflow-hidden">
                  <div
                    className="h-full bg-color-black-solid transition-all duration-500 absolute top-0 left-0"
                    style={{
                      width: `${Math.min((cartTotal / shippingThreshold) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="h-px bg-color-azure-86 self-stretch mb-6" />

              <div className="flex items-center justify-between w-full mb-8">
                <p className="text-[13px] uppercase tracking-letter-spacing-0-18 text-color-black-solid font-font-weight-500 m-0">
                  TOTAL
                </p>
                <p className="text-[26.7px] font-font-weight-400 text-color-black-solid m-0">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-color-black-solid text-color-white-solid flex items-center justify-center gap-2 py-4 text-[13px] uppercase tracking-wider font-font-weight-500 transition-opacity hover:opacity-90 border-0 cursor-pointer rounded-[2.7px]"
              >
                PROCEED TO CHECKOUT
                <ArrowRight size={14} strokeWidth={1.5} />
              </button>

              {!isLoggedIn && (
                <p className="text-[11px] text-color-azure-63 text-center self-stretch mt-4 leading-line-height-13-33 m-0">
                  Identity authentication interface required globally forward checkout deployment framework.
                </p>
              )}

              <p className="text-[11px] text-color-azure-63 text-center self-stretch mt-3 uppercase tracking-letter-spacing-0-18 m-0 font-font-weight-500">
                SECURED BY RAZORPAY
              </p>

            </div>
          </div>

        </div>
      </div>

      <LoginPromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        redirectTo="/checkout"
      />
    </>
  )
}