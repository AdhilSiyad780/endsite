// src/pages/user/Checkout.jsx

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, MapPin, Check, Loader, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import api from '../../api/axios'

export default function Checkout() {
  const { profile }                           = useAuth()
  const { cartItems, cartTotal, clearCart }   = useCart()
  const navigate                               = useNavigate()

  // ── Address state ──────────────────────────────────────────────────────────
  const [addresses,        setAddresses]        = useState([])
  const [selectedAddress,  setSelectedAddress]  = useState(null)
  const [addressLoading,   setAddressLoading]   = useState(true)
  const [showAddressForm,  setShowAddressForm]  = useState(false)

  // ── New address form state ─────────────────────────────────────────────────
  const [addressForm, setAddressForm] = useState({
    full_name:     profile?.full_name ?? '',
    phone:         profile?.phone     ?? '',
    address_line1: '',
    address_line2: '',
    city:          '',
    state:         '',
    pincode:       '',
    is_default:    false,
  })
  const [addressErrors,  setAddressErrors]  = useState({})
  const [savingAddress,  setSavingAddress]  = useState(false)

  // ── Payment state ──────────────────────────────────────────────────────────
  const [paying,       setPaying]       = useState(false)
  const [payError,     setPayError]     = useState('')

  // ── Order summary toggle (mobile) ──────────────────────────────────────────
  const [summaryOpen,  setSummaryOpen]  = useState(false)


  // ── Derived totals ─────────────────────────────────────────────────────────
  const shippingFee   = cartTotal >= 999 ? 0 : 99
  const grandTotal    = cartTotal + shippingFee


  // ── Redirect if cart is empty ──────────────────────────────────────────────

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart', { replace: true })
    }
  }, [cartItems])


  // ── Fetch addresses ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAddresses = async () => {
      setAddressLoading(true)
      try {
        const { data } = await api.get('/addresses')
        setAddresses(data)
        const def = data.find((a) => a.is_default) ?? data[0] ?? null
        setSelectedAddress(def?.id ?? null)
        if (data.length === 0) setShowAddressForm(true)
      } catch (err) {
        console.error('[checkout] Address fetch failed:', err.message)
      } finally {
        setAddressLoading(false)
      }
    }
    fetchAddresses()
  }, [])


  // ── Address form field updater ─────────────────────────────────────────────

  const setAddressField = (field) => (e) => {
    setAddressForm((p) => ({ ...p, [field]: e.target.value }))
    setAddressErrors((p) => ({ ...p, [field]: '' }))
  }


  // ── Address form validation ────────────────────────────────────────────────

  const validateAddress = () => {
    const errs = {}
    if (!addressForm.full_name.trim())     errs.full_name     = 'Full name is required'
    if (!addressForm.phone.trim())         errs.phone         = 'Phone is required'
    if (!addressForm.address_line1.trim()) errs.address_line1 = 'Address is required'
    if (!addressForm.city.trim())          errs.city          = 'City is required'
    if (!addressForm.state.trim())         errs.state         = 'State is required'
    if (!addressForm.pincode.trim())       errs.pincode       = 'Pincode is required'
    else if (!/^\d{6}$/.test(addressForm.pincode))
      errs.pincode = 'Enter a valid 6-digit pincode'
    setAddressErrors(errs)
    return Object.keys(errs).length === 0
  }


  // ── Save new address ───────────────────────────────────────────────────────

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!validateAddress()) return
    setSavingAddress(true)
    try {
      const { data } = await api.post('/addresses', addressForm)
      setAddresses((p) => [...p, data])
      setSelectedAddress(data.id)
      setShowAddressForm(false)
      setAddressForm({
        full_name: '', phone: '', address_line1: '',
        address_line2: '', city: '', state: '', pincode: '',
        is_default: false,
      })
    } catch (err) {
      setAddressErrors({ submit: err.normalizedMessage ?? 'Failed to save address' })
    } finally {
      setSavingAddress(false)
    }
  }


  // ── Razorpay payment flow ──────────────────────────────────────────────────

  const handlePay = async () => {
    if (!selectedAddress) {
      setPayError('Please select a delivery address')
      return
    }
    setPayError('')
    setPaying(true)

    try {
      // 1. Create Razorpay order
      const { data: order } = await api.post('/payments/create-order', {
        address_id: selectedAddress,
      })

      // 2. Open Razorpay modal
      const options = {
        key:      order.key_id,
        amount:   order.amount,
        currency: order.currency,
        order_id: order.razorpay_order_id,
        name:     'endsite',
        description: `Order — ${order.cart_items?.length ?? ''} items`,
        prefill: {
          name:  profile?.full_name ?? '',
          email: '',
          contact: profile?.phone  ?? '',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: () => {
            setPaying(false)
            setPayError('Payment cancelled. Please try again.')
          },
        },
        handler: async (response) => {
          // 3. Verify payment
          try {
            const { data: verified } = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              address_id:          selectedAddress,
            })
            await clearCart()
            navigate(`/order-confirm/${verified.order_id}`, { replace: true })
          } catch (err) {
            setPaying(false)
            setPayError(
              err.normalizedMessage ?? 'Payment verification failed. Contact support.'
            )
          }
        },
      }

      const rzp = new window.Razorpay(options)

      rzp.on('payment.failed', (response) => {
        setPaying(false)
        setPayError(
          response.error?.description ?? 'Payment failed. Please try again.'
        )
      })

      rzp.open()

    } catch (err) {
      setPaying(false)
      setPayError(err.normalizedMessage ?? 'Failed to initiate payment.')
    }
  }


  // ── Indian states list ─────────────────────────────────────────────────────

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
    'Puducherry',
  ]


  return (
    <div className="min-h-screen bg-white page-enter">
      <div className="max-w-content mx-auto px-10 py-16">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-widest
            text-brand-grey-500 mb-2">
            Final step
          </p>
          <h1 className="text-3xl font-light tracking-wider uppercase
            text-brand-900">
            Checkout
          </h1>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">


          {/* ── LEFT — Address + payment ───────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-10">


            {/* ── Section: Delivery address ─────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[13px] uppercase tracking-wider
                  font-medium text-brand-900 flex items-center gap-2">
                  <MapPin size={15} strokeWidth={1.5} />
                  Delivery Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => setShowAddressForm((p) => !p)}
                    className="flex items-center gap-1.5 text-[11px] uppercase
                      tracking-wider text-brand-grey-500 hover:text-brand-900
                      transition-colors"
                  >
                    <Plus size={12} strokeWidth={1.5} />
                    Add new
                  </button>
                )}
              </div>

              {/* Address loading */}
              {addressLoading ? (
                <div className="flex flex-col gap-3">
                  {Array(2).fill(null).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-brand-grey-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {/* Existing addresses */}
                  {addresses.length > 0 && (
                    <div className="flex flex-col gap-3 mb-6">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddress(addr.id)}
                          className={`w-full text-left p-4 border transition-all duration-200
                            ${selectedAddress === addr.id
                              ? 'border-black bg-black text-white'
                              : 'border-brand-grey-200 text-brand-900 hover:border-black'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                              <p className={`text-[13px] font-medium uppercase
                                tracking-wider
                                ${selectedAddress === addr.id
                                  ? 'text-white'
                                  : 'text-brand-900'
                                }`}>
                                {addr.full_name}
                              </p>
                              <p className={`text-[12px] leading-relaxed
                                ${selectedAddress === addr.id
                                  ? 'text-white/80'
                                  : 'text-brand-grey-500'
                                }`}>
                                {addr.address_line1}
                                {addr.address_line2 && `, ${addr.address_line2}`}
                                <br />
                                {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                              <p className={`text-[11px] uppercase tracking-wider
                                ${selectedAddress === addr.id
                                  ? 'text-white/60'
                                  : 'text-brand-grey-500'
                                }`}>
                                {addr.phone}
                              </p>
                              {addr.is_default && (
                                <span className={`text-[10px] uppercase tracking-widest
                                  mt-1
                                  ${selectedAddress === addr.id
                                    ? 'text-white/60'
                                    : 'text-brand-grey-500'
                                  }`}>
                                  Default address
                                </span>
                              )}
                            </div>

                            {selectedAddress === addr.id && (
                              <Check
                                size={16}
                                strokeWidth={1.5}
                                className="text-white flex-shrink-0 mt-0.5"
                              />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* New address form */}
                  {showAddressForm && (
                    <form
                      onSubmit={handleSaveAddress}
                      noValidate
                      className="border border-brand-grey-200 p-6
                        flex flex-col gap-6 animate-fade-in"
                    >
                      <p className="text-[12px] uppercase tracking-wider
                        text-brand-900 font-medium">
                        New Address
                      </p>

                      {/* Submit error */}
                      {addressErrors.submit && (
                        <div className="px-4 py-3 bg-red-50 border border-red-200">
                          <p className="text-[12px] text-red-600">
                            {addressErrors.submit}
                          </p>
                        </div>
                      )}

                      {/* Full name + phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="input-label">Full Name</label>
                          <input
                            type="text"
                            className={`input-underline
                              ${addressErrors.full_name ? 'error' : ''}`}
                            placeholder="Recipient name"
                            value={addressForm.full_name}
                            onChange={setAddressField('full_name')}
                          />
                          {addressErrors.full_name && (
                            <p className="text-[11px] text-red-600 mt-1">
                              {addressErrors.full_name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="input-label">Phone</label>
                          <input
                            type="tel"
                            className={`input-underline
                              ${addressErrors.phone ? 'error' : ''}`}
                            placeholder="+91 98765 43210"
                            value={addressForm.phone}
                            onChange={setAddressField('phone')}
                          />
                          {addressErrors.phone && (
                            <p className="text-[11px] text-red-600 mt-1">
                              {addressErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Address line 1 */}
                      <div>
                        <label className="input-label">Address Line 1</label>
                        <input
                          type="text"
                          className={`input-underline
                            ${addressErrors.address_line1 ? 'error' : ''}`}
                          placeholder="House / flat / street"
                          value={addressForm.address_line1}
                          onChange={setAddressField('address_line1')}
                        />
                        {addressErrors.address_line1 && (
                          <p className="text-[11px] text-red-600 mt-1">
                            {addressErrors.address_line1}
                          </p>
                        )}
                      </div>

                      {/* Address line 2 */}
                      <div>
                        <label className="input-label">
                          Address Line 2{' '}
                          <span className="text-brand-grey-500 normal-case
                            tracking-normal">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          className="input-underline"
                          placeholder="Landmark / area"
                          value={addressForm.address_line2}
                          onChange={setAddressField('address_line2')}
                        />
                      </div>

                      {/* City + pincode */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="input-label">City</label>
                          <input
                            type="text"
                            className={`input-underline
                              ${addressErrors.city ? 'error' : ''}`}
                            placeholder="City"
                            value={addressForm.city}
                            onChange={setAddressField('city')}
                          />
                          {addressErrors.city && (
                            <p className="text-[11px] text-red-600 mt-1">
                              {addressErrors.city}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="input-label">Pincode</label>
                          <input
                            type="text"
                            className={`input-underline
                              ${addressErrors.pincode ? 'error' : ''}`}
                            placeholder="6-digit pincode"
                            maxLength={6}
                            value={addressForm.pincode}
                            onChange={setAddressField('pincode')}
                          />
                          {addressErrors.pincode && (
                            <p className="text-[11px] text-red-600 mt-1">
                              {addressErrors.pincode}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* State */}
                      <div>
                        <label className="input-label">State</label>
                        <select
                          className={`input-underline bg-transparent cursor-pointer
                            ${addressErrors.state ? 'error' : ''}`}
                          value={addressForm.state}
                          onChange={setAddressField('state')}
                        >
                          <option value="">Select state</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {addressErrors.state && (
                          <p className="text-[11px] text-red-600 mt-1">
                            {addressErrors.state}
                          </p>
                        )}
                      </div>

                      {/* Set as default */}
                      <label className="flex items-center gap-3 cursor-pointer
                        group">
                        <div
                          onClick={() =>
                            setAddressForm((p) => ({
                              ...p,
                              is_default: !p.is_default,
                            }))
                          }
                          className={`w-4 h-4 border flex items-center
                            justify-center flex-shrink-0 transition-colors
                            ${addressForm.is_default
                              ? 'bg-black border-black'
                              : 'border-brand-grey-200 group-hover:border-black'
                            }`}
                        >
                          {addressForm.is_default && (
                            <Check size={10} strokeWidth={2} className="text-white" />
                          )}
                        </div>
                        <span className="text-[12px] uppercase tracking-wider
                          text-brand-grey-500 group-hover:text-brand-900
                          transition-colors">
                          Set as default address
                        </span>
                      </label>

                      {/* Form actions */}
                      <div className="flex items-center gap-4">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="btn-primary flex items-center gap-2"
                        >
                          {savingAddress && (
                            <Loader
                              size={13}
                              strokeWidth={1.5}
                              className="animate-spin"
                            />
                          )}
                          {savingAddress ? 'Saving...' : 'Save Address'}
                        </button>

                        {addresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false)
                              setAddressErrors({})
                            }}
                            className="btn-outline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                    </form>
                  )}
                </>
              )}
            </div>


            {/* ── Section: Payment ──────────────────────────────────────────── */}
            <div>
              <h2 className="text-[13px] uppercase tracking-wider font-medium
                text-brand-900 mb-6">
                Payment
              </h2>

              {/* Pay error */}
              {payError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200">
                  <p className="text-[12px] text-red-600">{payError}</p>
                </div>
              )}

              {/* Razorpay info */}
              <div className="border border-brand-grey-200 p-4 mb-6
                flex items-center justify-between">
                <div>
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-900">
                    Pay via Razorpay
                  </p>
                  <p className="text-[11px] text-brand-grey-500 mt-1">
                    Cards, UPI, Net Banking, Wallets
                  </p>
                </div>
                <div className="w-8 h-8 bg-brand-grey-100 flex items-center
                  justify-center">
                  <Check size={16} strokeWidth={1.5} className="text-brand-900" />
                </div>
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={
                  paying ||
                  !selectedAddress ||
                  cartItems.length === 0 ||
                  addressLoading
                }
                className="btn-primary w-full flex items-center justify-center
                  gap-2 py-4 text-[13px]"
              >
                {paying ? (
                  <>
                    <Loader
                      size={14}
                      strokeWidth={1.5}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{grandTotal.toLocaleString('en-IN')}
                  </>
                )}
              </button>

              {/* Back to cart */}
              <div className="mt-4 text-center">
                <Link
                  to="/cart"
                  className="text-[11px] uppercase tracking-wider
                    text-brand-grey-500 hover:text-brand-900 transition-colors"
                >
                  ← Back to cart
                </Link>
              </div>

            </div>

          </div>


          {/* ── RIGHT — Order summary ────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-brand-grey-100 p-6 sticky top-24">

              {/* Summary header — collapsible on mobile */}
              <button
                onClick={() => setSummaryOpen((p) => !p)}
                className="w-full flex items-center justify-between
                  mb-0 lg:mb-6 lg:pointer-events-none"
              >
                <h2 className="text-[13px] uppercase tracking-wider
                  font-medium text-brand-900">
                  Order Summary
                  <span className="text-brand-grey-500 ml-2 font-normal">
                    ({cartItems.length})
                  </span>
                </h2>
                <span className="lg:hidden text-brand-grey-500">
                  {summaryOpen
                    ? <ChevronUp size={16} strokeWidth={1.5} />
                    : <ChevronDown size={16} strokeWidth={1.5} />
                  }
                </span>
              </button>

              {/* Items list */}
              <div className={`${summaryOpen ? 'block' : 'hidden'} lg:block`}>

                <div className="flex flex-col gap-4 mt-4 lg:mt-0
                  mb-6 max-h-64 overflow-y-auto no-scrollbar">
                  {cartItems.map((item) => (
                    <div
                      key={item.variant_id}
                      className="flex items-start gap-3"
                    >
                      {/* Image */}
                      <div className="w-12 h-12 bg-brand-grey-200
                        flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-grey-200" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] uppercase tracking-wider
                          text-brand-900 line-clamp-1">
                          {item.product_name}
                        </p>
                        <p className="text-[11px] text-brand-grey-500 mt-0.5">
                          {[item.color, item.size]
                            .filter(Boolean)
                            .join(' / ')}
                          {' · '}Qty {item.quantity}
                        </p>
                      </div>

                      {/* Price */}
                      <p className="text-[12px] text-brand-900 flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-brand-grey-200 mb-4" />

                {/* Totals */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] uppercase tracking-wider
                      text-brand-grey-500">
                      Subtotal
                    </p>
                    <p className="text-[13px] text-brand-900">
                      ₹{cartTotal.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] uppercase tracking-wider
                      text-brand-grey-500">
                      Shipping
                    </p>
                    <p className="text-[13px] text-brand-900">
                      {shippingFee === 0
                        ? 'Free'
                        : `₹${shippingFee}`
                      }
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-brand-grey-200 my-4" />

                {/* Grand total */}
                <div className="flex items-center justify-between">
                  <p className="text-[13px] uppercase tracking-wider
                    font-medium text-brand-900">
                    Total
                  </p>
                  <p className="text-xl font-light text-brand-900">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Secure note */}
                <p className="text-[11px] text-brand-grey-500 text-center
                  uppercase tracking-wider mt-6">
                  🔒 Secured by Razorpay
                </p>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}