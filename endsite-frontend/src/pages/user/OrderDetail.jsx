// src/pages/user/OrderDetail.jsx

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Package, MapPin, ArrowLeft, Loader, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'

function statusBadgeClass(status) {
  switch (status) {
    case 'delivered':  return 'badge-black'
    case 'shipped':    return 'badge-black'
    case 'confirmed':  return 'badge-black'
    case 'cancelled':  return 'badge-red'
    default:           return 'badge-grey'
  }
}

const ORDER_STEPS = ['confirmed', 'shipped', 'delivered']

export default function OrderDetail() {
  const { id }    = useParams()
  const navigate   = useNavigate()

  const [order,      setOrder]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)


  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      setError('')
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
    window.scrollTo(0, 0)
  }, [id])


  const handleCancel = async () => {
    setCancelling(true)
    setCancelError('')
    try {
      await api.put(`/orders/${id}/cancel`)
      setOrder((p) => ({ ...p, status: 'cancelled' }))
      setShowConfirm(false)
    } catch (err) {
      setCancelError(err.normalizedMessage ?? 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }


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
          Back to Orders
        </Link>
      </div>
    )
  }


  const address       = order.address ?? {}
  const isCancellable = ['pending', 'confirmed'].includes(order.status)
  const currentStep   = ORDER_STEPS.indexOf(order.status)
  const isCancelled   = order.status === 'cancelled'


  return (
    <div className="min-h-screen bg-white page-enter">
      <div className="max-w-content mx-auto px-10 py-16">

        <div className="mb-10">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-[11px] uppercase
              tracking-wider text-brand-grey-500 hover:text-brand-900
              transition-colors mb-6"
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Back to orders
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end
            justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest
                text-brand-grey-500 mb-2">
                Order #{id.slice(0, 8).toUpperCase()}
              </p>
              <h1 className="text-3xl font-light tracking-wider uppercase
                text-brand-900">
                Order Details
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className={`badge ${statusBadgeClass(order.status)}`}>
                {order.status}
              </span>
              <span className={`badge
                ${order.payment_status === 'paid' ? 'badge-black' : 'badge-grey'}`}>
                {order.payment_status}
              </span>
            </div>
          </div>
        </div>


        {!isCancelled && (
          <div className="mb-12 p-6 bg-brand-grey-100">
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-6">
              Delivery Progress
            </p>
            <div className="flex items-center">
              {ORDER_STEPS.map((step, idx) => (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center
                      border-2 transition-all duration-300
                      ${idx <= currentStep
                        ? 'border-black bg-black'
                        : 'border-brand-grey-200 bg-white'
                      }`}>
                      {idx <= currentStep ? (
                        <span className="text-white text-[10px]">✓</span>
                      ) : (
                        <span className="text-brand-grey-200 text-[10px]">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] uppercase tracking-widest
                      whitespace-nowrap
                      ${idx <= currentStep
                        ? 'text-brand-900'
                        : 'text-brand-grey-200'
                      }`}>
                      {step}
                    </p>
                  </div>

                  {idx < ORDER_STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-2 transition-all duration-300
                      ${idx < currentStep
                        ? 'bg-black'
                        : 'bg-brand-grey-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="mb-10 px-5 py-4 border border-red-200 bg-red-50
            flex items-center gap-3">
            <AlertTriangle size={16} strokeWidth={1.5} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="text-[12px] uppercase tracking-wider text-red-600 font-medium">
                Order Cancelled
              </p>
              <p className="text-[12px] text-red-500 mt-0.5">
                This order has been cancelled.
                {order.payment_status === 'paid' &&
                  ' Refund will be processed by our team separately.'}
              </p>
            </div>
          </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          <div className="lg:col-span-2">

            <h2 className="text-[13px] uppercase tracking-wider font-medium
              text-brand-900 mb-6 flex items-center gap-2">
              <Package size={15} strokeWidth={1.5} />
              Items ({order.items?.length ?? 0})
            </h2>

            <div className="flex flex-col divide-y divide-brand-grey-200">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-start gap-4 py-5">
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
                      Qty: {item.quantity} ×
                      ₹{item.unit_price?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <p className="text-[13px] text-brand-900 flex-shrink-0">
                    ₹{item.subtotal?.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

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

            {isCancellable && (
              <div className="mt-8">
                {cancelError && (
                  <p className="text-[12px] text-red-600 mb-3 uppercase
                    tracking-wider">
                    {cancelError}
                  </p>
                )}

                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="btn-outline text-red-600 border-red-200
                      hover:bg-red-600 hover:text-white hover:border-red-600"
                  >
                    Cancel Order
                  </button>
                ) : (
                  <div className="border border-red-200 p-5 bg-red-50
                    flex flex-col gap-4 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={16}
                        strokeWidth={1.5}
                        className="text-red-600 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-[13px] text-red-700 font-medium">
                          Cancel this order?
                        </p>
                        <p className="text-[12px] text-red-500 mt-1 leading-relaxed">
                          This action cannot be undone. If you've already paid,
                          a refund will be processed separately by our team.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="btn-primary bg-red-600 border-red-600
                          hover:bg-red-700 flex items-center gap-2"
                      >
                        {cancelling && (
                          <Loader
                            size={13}
                            strokeWidth={1.5}
                            className="animate-spin"
                          />
                        )}
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirm(false)
                          setCancelError('')
                        }}
                        className="btn-outline"
                      >
                        Keep Order
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>


          <div className="flex flex-col gap-6">

            <div className="bg-brand-grey-100 p-6">
              <h3 className="text-[11px] uppercase tracking-widest
                text-brand-grey-500 mb-4">
                Order Info
              </h3>
              <div className="flex flex-col gap-3">

                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-grey-500">
                    Order ID
                  </p>
                  <p className="text-[12px] text-brand-900 font-mono">
                    #{id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-grey-500">
                    Placed on
                  </p>
                  <p className="text-[12px] text-brand-900">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day:   'numeric',
                      month: 'short',
                      year:  'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-grey-500">
                    Last updated
                  </p>
                  <p className="text-[12px] text-brand-900">
                    {new Date(order.updated_at).toLocaleDateString('en-IN', {
                      day:   'numeric',
                      month: 'short',
                      year:  'numeric',
                    })}
                  </p>
                </div>

                {order.razorpay_payment_id && (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] uppercase tracking-wider
                      text-brand-grey-500 flex-shrink-0">
                      Payment ID
                    </p>
                    <p className="text-[11px] text-brand-grey-500 font-mono
                      text-right break-all">
                      {order.razorpay_payment_id}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {address && Object.keys(address).length > 0 && (
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

            <div className="bg-brand-grey-100 p-6">
              <h3 className="text-[11px] uppercase tracking-widest
                text-brand-grey-500 mb-3">
                Need Help?
              </h3>
              <p className="text-[12px] text-brand-grey-500 leading-relaxed mb-4">
                For order issues, contact our support team with your order ID.
              </p>
              
                <a href="mailto:support@endsite.com"
                className="text-[12px] uppercase tracking-wider text-brand-900
                  underline underline-offset-2 hover:opacity-60 transition-opacity"
              >
                support@endsite.com
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}