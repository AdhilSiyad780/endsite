// src/pages/user/OrderHistory.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Loader } from 'lucide-react'
import api from '../../api/axios'

const STATUS_FILTERS = [
  { label: 'All',       value: ''           },
  { label: 'Confirmed', value: 'confirmed'  },
  { label: 'Shipped',   value: 'shipped'    },
  { label: 'Delivered', value: 'delivered'  },
  { label: 'Cancelled', value: 'cancelled'  },
]

function statusBadgeClass(status) {
  switch (status) {
    case 'delivered':  return 'badge-black'
    case 'shipped':    return 'badge-black'
    case 'confirmed':  return 'badge-black'
    case 'cancelled':  return 'badge-red'
    default:           return 'badge-grey'
  }
}

function paymentBadgeClass(status) {
  switch (status) {
    case 'paid':      return 'badge-black'
    case 'refunded':  return 'badge-grey'
    default:          return 'badge-grey'
  }
}

export default function OrderHistory() {
  const [orders,        setOrders]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [activeFilter,  setActiveFilter]  = useState('')


  // ── Fetch orders ───────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError('')
      try {
        const params = {}
        if (activeFilter) params.status = activeFilter
        const { data } = await api.get('/orders', { params })
        setOrders(data)
      } catch (err) {
        setError(err.normalizedMessage ?? 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [activeFilter])


  return (
    <div className="min-h-screen bg-white page-enter">
      <div className="max-w-content mx-auto px-10 py-16">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-[11px] uppercase tracking-widest
            text-brand-grey-500 mb-2">
            My account
          </p>
          <h1 className="text-3xl font-light tracking-wider uppercase
            text-brand-900">
            Orders
          </h1>
        </div>

        {/* ── Status filter tabs ───────────────────────────────────────────── */}
        <div className="flex gap-0 border-b border-brand-grey-200 mb-8
          overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveFilter(value)}
              className={`px-4 pb-3 text-[12px] uppercase tracking-wider
                whitespace-nowrap border-b-2 transition-all duration-200 mr-4
                ${activeFilter === value
                  ? 'border-black text-brand-900'
                  : 'border-transparent text-brand-grey-500 hover:text-brand-900'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Loading ──────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader
                size={24}
                strokeWidth={1.5}
                className="animate-spin text-brand-grey-500"
              />
              <p className="text-[11px] uppercase tracking-wider
                text-brand-grey-500">
                Loading orders...
              </p>
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="py-12 text-center">
            <p className="text-[12px] uppercase tracking-wider text-red-600">
              {error}
            </p>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center
            py-24 text-center border border-brand-grey-200">
            <Package
              size={48}
              strokeWidth={0.75}
              className="text-brand-grey-200 mb-6"
            />
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-3">
              No orders yet
            </p>
            <h2 className="text-xl font-light tracking-wider uppercase
              text-brand-900 mb-4">
              {activeFilter
                ? `No ${activeFilter} orders`
                : 'You haven\'t placed any orders'
              }
            </h2>
            <p className="text-[13px] text-brand-grey-500 mb-8 max-w-xs">
              {activeFilter
                ? 'Try a different filter to see your orders.'
                : 'Start shopping and your orders will appear here.'
              }
            </p>
            <Link to="/products" className="btn-primary">
              Shop Now
            </Link>
          </div>
        )}

        {/* ── Orders list ──────────────────────────────────────────────────── */}
        {!loading && !error && orders.length > 0 && (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block border border-brand-grey-200 p-5
                  hover:border-black transition-colors duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center
                  justify-between gap-4">

                  {/* Left — order info */}
                  <div className="flex items-start gap-4">

                    {/* First item image */}
                    <div className="w-14 h-14 bg-brand-grey-100
                      overflow-hidden flex-shrink-0">
                      {order.first_item_image ? (
                        <img
                          src={order.first_item_image}
                          alt={order.first_item_name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center
                          justify-center">
                          <Package
                            size={18}
                            strokeWidth={1}
                            className="text-brand-grey-200"
                          />
                        </div>
                      )}
                    </div>

                    {/* Order details */}
                    <div className="flex flex-col gap-1">
                      <p className="text-[12px] uppercase tracking-wider
                        text-brand-grey-500">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[14px] text-brand-900 uppercase
                        tracking-wider line-clamp-1">
                        {order.first_item_name}
                        {order.item_count > 1 && (
                          <span className="text-brand-grey-500 ml-1">
                            +{order.item_count - 1} more
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider
                        text-brand-grey-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day:   'numeric',
                          month: 'short',
                          year:  'numeric',
                        })}
                      </p>
                    </div>

                  </div>

                  {/* Right — status + price + arrow */}
                  <div className="flex items-center gap-4 sm:flex-shrink-0">

                    <div className="flex flex-col items-end gap-2">
                      <span className={`badge ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`badge ${paymentBadgeClass(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </div>

                    <p className="text-[14px] font-medium text-brand-900
                      whitespace-nowrap">
                      ₹{order.total_amount?.toLocaleString('en-IN')}
                    </p>

                    <ChevronRight
                      size={16}
                      strokeWidth={1.5}
                      className="text-brand-grey-200
                        group-hover:text-brand-900 transition-colors"
                    />

                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}