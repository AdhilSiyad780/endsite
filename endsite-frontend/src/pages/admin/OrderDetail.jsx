// src/pages/admin/OrderDetail.jsx

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader, MapPin, Package,
  Check, AlertTriangle, RefreshCw
} from 'lucide-react'
import api from '../../api/axios'

const ORDER_STATUSES = [
  'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
]

const ORDER_STEPS = ['confirmed', 'shipped', 'delivered']

function statusBadgeClass(status) {
  switch (status) {
    case 'delivered':  return 'badge-black'
    case 'shipped':    return 'badge-black'
    case 'confirmed':  return 'badge-black'
    case 'cancelled':  return 'badge-red'
    default:           return 'badge-grey'
  }
}

export default function AdminOrderDetail() {
  const { id } = useParams()

  const [order,          setOrder]          = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusError,    setStatusError]    = useState('')
  const [statusSuccess,  setStatusSuccess]  = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')


  // ── Fetch order ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/orders/admin/${id}`)
        setOrder(data)
        setSelectedStatus(data.status)
      } catch (err) {
        setError(err.normalizedMessage ?? 'Order not found')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
    window.scrollTo(0, 0)
  }, [id])


  // ── Update order status ────────────────────────────────────────────────────

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.status) return
    setUpdatingStatus(true)
    setStatusError('')
    setStatusSuccess(false)
    try {
      const { data } = await api.put(`/orders/admin/${id}/status`, {
        status: selectedStatus,
      })
      setOrder((p) => ({ ...p, ...data }))
      setStatusSuccess(true)
      setTimeout(() => setStatusSuccess(false), 3000)
    } catch (err) {
      setStatusError(err.normalizedMessage ?? 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }


  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader
            size={24}
            strokeWidth={1.5}
            className="animate-spin text-brand-grey-500"
          />
          <p className="text-[11px] uppercase tracking-wider
            text-brand-grey-500">
            Loading order...
          </p>
        </div>
      </div>
    )
  }


  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center
        min-h-[400px] text-center px-6">
        <p className="text-[11px] uppercase tracking-widest
          text-brand-grey-500 mb-4">
          Error
        </p>
        <h2 className="text-xl font-light tracking-wider uppercase
          text-brand-900 mb-4">
          {error || 'Order not found'}
        </h2>
        <Link to="/admin/orders" className="btn-primary mt-4">
          Back to Orders
        </Link>
      </div>
    )
  }

  const address      = order.address      ?? {}
  const isCancelled  = order.status       === 'cancelled'
  const currentStep  = ORDER_STEPS.indexOf(order.status)


  return (
    <div className="page-enter">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          to="/admin/orders"
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
              Order Detail
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


      {/* ── Progress tracker ──────────────────────────────────────────────── */}
      {!isCancelled && (
        <div className="mb-10 p-6 bg-brand-grey-100">
          <p className="text-[11px] uppercase tracking-widest
            text-brand-grey-500 mb-6">
            Fulfilment Progress
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
                    ${idx < currentStep ? 'bg-black' : 'bg-brand-grey-200'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cancelled banner ──────────────────────────────────────────────── */}
      {isCancelled && (
        <div className="mb-8 px-5 py-4 border border-red-200 bg-red-50
          flex items-center gap-3">
          <AlertTriangle
            size={16}
            strokeWidth={1.5}
            className="text-red-600 flex-shrink-0"
          />
          <p className="text-[12px] uppercase tracking-wider text-red-600">
            This order has been cancelled
          </p>
        </div>
      )}


      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


        {/* ── LEFT — Items ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Items list */}
          <div>
            <h2 className="text-[13px] uppercase tracking-wider font-medium
              text-brand-900 mb-5 flex items-center gap-2">
              <Package size={15} strokeWidth={1.5} />
              Items ({order.items?.length ?? 0})
            </h2>

            <div className="border border-brand-grey-200 overflow-hidden">

              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3
                border-b border-brand-grey-200 bg-brand-grey-100">
                {[
                  { label: 'Product', cols: 6 },
                  { label: 'Variant', cols: 2 },
                  { label: 'Qty',     cols: 1 },
                  { label: 'Price',   cols: 1 },
                  { label: 'Total',   cols: 2 },
                ].map(({ label, cols }) => (
                  <div key={label} className={`col-span-${cols}`}>
                    <p className="text-[11px] uppercase tracking-widest
                      text-brand-grey-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Item rows */}
              <div className="flex flex-col divide-y divide-brand-grey-200">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2
                      md:gap-4 px-4 py-4 items-center"
                  >
                    {/* Product */}
                    <div className="md:col-span-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-grey-100
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
                      <p className="text-[12px] uppercase tracking-wider
                        text-brand-900 line-clamp-2">
                        {item.product_name}
                      </p>
                    </div>

                    {/* Variant */}
                    <div className="md:col-span-2">
                      <p className="text-[11px] uppercase tracking-wider
                        text-brand-grey-500">
                        {[item.color, item.size].filter(Boolean).join(' / ') || '—'}
                      </p>
                    </div>

                    {/* Qty */}
                    <div className="md:col-span-1">
                      <p className="text-[13px] text-brand-900">
                        {item.quantity}
                      </p>
                    </div>

                    {/* Unit price */}
                    <div className="md:col-span-1">
                      <p className="text-[12px] text-brand-grey-500">
                        ₹{item.unit_price?.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="md:col-span-2">
                      <p className="text-[13px] text-brand-900 font-medium">
                        ₹{item.subtotal?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order total */}
              <div className="border-t border-brand-grey-200 px-4 py-4
                bg-brand-grey-100 flex items-center justify-between">
                <p className="text-[12px] uppercase tracking-wider
                  text-brand-grey-500">
                  Order Total
                </p>
                <p className="text-xl font-light text-brand-900">
                  ₹{order.total_amount?.toLocaleString('en-IN')}
                </p>
              </div>

            </div>
          </div>


          {/* ── Status update ──────────────────────────────────────────────── */}
          <div className="border border-brand-grey-200 p-6">
            <h2 className="text-[13px] uppercase tracking-wider font-medium
              text-brand-900 mb-5 flex items-center gap-2">
              <RefreshCw size={15} strokeWidth={1.5} />
              Update Status
            </h2>

            {statusError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200">
                <p className="text-[12px] text-red-600">{statusError}</p>
              </div>
            )}

            {statusSuccess && (
              <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200
                flex items-center gap-2">
                <Check size={14} strokeWidth={1.5} className="text-green-600" />
                <p className="text-[12px] text-green-700">
                  Status updated successfully
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">

              {/* Status buttons */}
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-4 py-2 text-[12px] uppercase tracking-wider
                      border transition-all duration-200
                      ${selectedStatus === status
                        ? status === 'cancelled'
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-black border-black text-white'
                        : 'border-brand-grey-200 text-brand-grey-500 hover:border-black hover:text-brand-900'
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Update button */}
              <button
                onClick={handleUpdateStatus}
                disabled={
                  updatingStatus ||
                  selectedStatus === order.status
                }
                className="btn-primary flex items-center gap-2"
              >
                {updatingStatus && (
                  <Loader
                    size={13}
                    strokeWidth={1.5}
                    className="animate-spin"
                  />
                )}
                {updatingStatus ? 'Updating...' : 'Apply'}
              </button>

            </div>

            {selectedStatus !== order.status && (
              <p className="text-[11px] text-brand-grey-500 mt-3 uppercase
                tracking-wider">
                Changing from{' '}
                <span className="text-brand-900">{order.status}</span>
                {' '}→{' '}
                <span className="text-brand-900">{selectedStatus}</span>
              </p>
            )}

          </div>

        </div>


        {/* ── RIGHT — Info panel ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Order info */}
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
                  Placed
                </p>
                <p className="text-[12px] text-brand-900">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[12px] uppercase tracking-wider
                  text-brand-grey-500">
                  Updated
                </p>
                <p className="text-[12px] text-brand-900">
                  {new Date(order.updated_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[12px] uppercase tracking-wider
                  text-brand-grey-500">
                  Items
                </p>
                <p className="text-[12px] text-brand-900">
                  {order.items?.length ?? 0}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[12px] uppercase tracking-wider
                  text-brand-grey-500">
                  Total
                </p>
                <p className="text-[13px] text-brand-900 font-medium">
                  ₹{order.total_amount?.toLocaleString('en-IN')}
                </p>
              </div>

              {order.razorpay_payment_id && (
                <div className="pt-2 border-t border-brand-grey-200">
                  <p className="text-[11px] uppercase tracking-wider
                    text-brand-grey-500 mb-1">
                    Payment ID
                  </p>
                  <p className="text-[11px] text-brand-grey-500 font-mono
                    break-all">
                    {order.razorpay_payment_id}
                  </p>
                </div>
              )}

              {order.razorpay_order_id && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider
                    text-brand-grey-500 mb-1">
                    Razorpay Order
                  </p>
                  <p className="text-[11px] text-brand-grey-500 font-mono
                    break-all">
                    {order.razorpay_order_id}
                  </p>
                </div>
              )}

            </div>
          </div>


          {/* Customer info */}
          <div className="bg-brand-grey-100 p-6">
            <h3 className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-4">
              Customer
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-[13px] uppercase tracking-wider text-brand-900">
                {order.customer_name ?? '—'}
              </p>
              {order.customer_phone && (
                <p className="text-[12px] text-brand-grey-500">
                  {order.customer_phone}
                </p>
              )}
              {order.user_id && (
                <Link
                  to={`/admin/users/${order.user_id}`}
                  className="text-[11px] uppercase tracking-wider
                    text-brand-grey-500 hover:text-brand-900 transition-colors
                    underline underline-offset-2 mt-1"
                >
                  View customer profile →
                </Link>
              )}
            </div>
          </div>


          {/* Delivery address */}
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


          {/* Refund stub */}
          <div className="bg-brand-grey-100 p-6">
            <h3 className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-3">
              Refund
            </h3>
            <p className="text-[12px] text-brand-grey-500 mb-4 leading-relaxed">
              Refund processing is not yet active.
              Contact Razorpay dashboard to process manually.
            </p>
            <button
              disabled
              title="Refund not yet enabled"
              className="btn-outline opacity-40 cursor-not-allowed
                text-[12px] flex items-center gap-2"
            >
              Process Refund
              <span className="text-[10px] uppercase tracking-wider
                text-brand-grey-500">
                (disabled)
              </span>
            </button>
          </div>

        </div>

      </div>

    </div>
  )
}