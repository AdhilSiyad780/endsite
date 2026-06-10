// src/pages/user/OrderConfirm.jsx

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { CheckCircle, Package, MapPin, ArrowRight, Loader } from 'lucide-react'
import api from '../../api/axios'

export default function OrderConfirm() {
  const { id }     = useParams()
  const navigate    = useNavigate()

  const [order,    setOrder]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')


  // ── Fetch order ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true })
      return
    }
    const fetchOrder = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/orders/${id}`)
        setOrder(data)
      } catch (err) {
        setError(err.normalizedMessage ?? 'Order not found')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])


  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader
            size={24}
            strokeWidth={1.5}
            className="animate-spin text-brand-grey-500"
          />
          <p className="text-[11px] uppercase tracking-wider text-brand-grey-500">
            Loading order...
          </p>
        </div>
      </div>
    )
  }


  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center
        justify-center text-center px-6">
        <p className="text-[11px] uppercase tracking-widest
          text-brand-grey-500 mb-4">
          Error
        </p>
        <h1 className="text-2xl font-light tracking-wider uppercase
          text-brand-900 mb-4">
          {error || 'Order not found'}
        </h1>
        <Link to="/orders" className="btn-primary mt-4">
          View My Orders
        </Link>
      </div>
    )
  }


  const address = order.address ?? {}


  return (
    <div className="min-h-screen bg-white page-enter">
      <div className="max-w-content mx-auto px-10 py-16">


        {/* ── Success header ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-16">

          {/* Icon */}
          <div className="w-20 h-20 border border-brand-grey-200
            flex items-center justify-center mb-8">
            <CheckCircle
              size={36}
              strokeWidth={0.75}
              className="text-brand-900"
            />
          </div>

          <p className="text-[11px] uppercase tracking-widest
            text-brand-grey-500 mb-3">
            Order confirmed
          </p>
          <h1 className="text-3xl font-light tracking-wider uppercase
            text-brand-900 mb-4">
            Thank You!
          </h1>
          <p className="text-[14px] text-brand-grey-500 leading-relaxed
            max-w-md">
            Your order has been placed successfully.
            We'll send you an update when it's on its way.
          </p>

          {/* Order ID */}
          <div className="mt-6 px-6 py-3 bg-brand-grey-100">
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-1">
              Order ID
            </p>
            <p className="text-[13px] text-brand-900 font-medium
              tracking-wider">
              #{id.slice(0, 8).toUpperCase()}
            </p>
          </div>

        </div>


        {/* ── Order detail grid ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">


          {/* ── Items ──────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2">

            <h2 className="text-[13px] uppercase tracking-wider font-medium
              text-brand-900 mb-6 flex items-center gap-2">
              <Package size={15} strokeWidth={1.5} />
              Items Ordered
            </h2>

            <div className="flex flex-col divide-y divide-brand-grey-200">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 py-5"
                >
                  {/* Image */}
                  <div className="w-16 h-16 bg-brand-grey-100
                    overflow-hidden flex-shrink-0">
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
                    <p className="text-[13px] uppercase tracking-wider
                      text-brand-900">
                      {item.product_name}
                    </p>
                    <div className="flex flex-wrap gap-x-3 mt-1">
                      {item.color && (
                        <p className="text-[11px] uppercase tracking-wider
                          text-brand-grey-500">
                          Color: {item.color}
                        </p>
                      )}
                      {item.size && (
                        <p className="text-[11px] uppercase tracking-wider
                          text-brand-grey-500">
                          Size: {item.size}
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] uppercase tracking-wider
                      text-brand-grey-500 mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-[13px] text-brand-900">
                      ₹{item.subtotal?.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-brand-grey-500 mt-0.5">
                      ₹{item.unit_price?.toLocaleString('en-IN')} each
                    </p>
                  </div>

                </div>
              ))}
            </div>

            {/* Order total */}
            <div className="border-t border-brand-grey-200 pt-5 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-[13px] uppercase tracking-wider
                  font-medium text-brand-900">
                  Order Total
                </p>
                <p className="text-xl font-light text-brand-900">
                  ₹{order.total_amount?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

          </div>


          {/* ── Summary panel ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-6">

            {/* Status */}
            <div className="bg-brand-grey-100 p-6">
              <h3 className="text-[11px] uppercase tracking-widest
                text-brand-grey-500 mb-4">
                Order Status
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-grey-500">
                    Status
                  </p>
                  <span className={`badge
                    ${order.status === 'cancelled'
                      ? 'badge-red'
                      : 'badge-black'
                    }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-grey-500">
                    Payment
                  </p>
                  <span className={`badge
                    ${order.payment_status === 'paid'
                      ? 'badge-black'
                      : 'badge-grey'
                    }`}>
                    {order.payment_status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-grey-500">
                    Date
                  </p>
                  <p className="text-[12px] text-brand-900">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day:   'numeric',
                      month: 'short',
                      year:  'numeric',
                    })}
                  </p>
                </div>
                {order.razorpay_payment_id && (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] uppercase tracking-wider
                      text-brand-grey-500">
                      Payment ID
                    </p>
                    <p className="text-[11px] text-brand-grey-500 font-mono">
                      {order.razorpay_payment_id.slice(0, 16)}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery address */}
            {address && (
              <div className="bg-brand-grey-100 p-6">
                <h3 className="text-[11px] uppercase tracking-widest
                  text-brand-grey-500 mb-4 flex items-center gap-2">
                  <MapPin size={12} strokeWidth={1.5} />
                  Delivery Address
                </h3>
                <div className="flex flex-col gap-1">
                  <p className="text-[13px] uppercase tracking-wider
                    text-brand-900">
                    {address.full_name}
                  </p>
                  <p className="text-[12px] text-brand-grey-500 leading-relaxed">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                    <br />
                    {address.city}, {address.state}
                    <br />
                    {address.pincode}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider
                    text-brand-grey-500 mt-1">
                    {address.phone}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>


        {/* ── CTAs ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-4
          justify-center mt-16 pt-10 border-t border-brand-grey-200">
          <Link
            to="/orders"
            className="btn-outline flex items-center gap-2"
          >
            View All Orders
          </Link>
          <Link
            to="/products"
            className="btn-primary flex items-center gap-2"
          >
            Continue Shopping
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>

      </div>
    </div>
  )
}