// src/pages/admin/OrderList.jsx

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ChevronRight, Loader,
  ShoppingBag, Filter, X
} from 'lucide-react'
import api from '../../api/axios'

const STATUS_OPTIONS = [
  { label: 'All',       value: ''           },
  { label: 'Pending',   value: 'pending'    },
  { label: 'Confirmed', value: 'confirmed'  },
  { label: 'Shipped',   value: 'shipped'    },
  { label: 'Delivered', value: 'delivered'  },
  { label: 'Cancelled', value: 'cancelled'  },
]

const PAYMENT_OPTIONS = [
  { label: 'All',      value: ''         },
  { label: 'Paid',     value: 'paid'     },
  { label: 'Pending',  value: 'pending'  },
  { label: 'Refunded', value: 'refunded' },
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

export default function AdminOrderList() {
  const [orders,         setOrders]         = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [paymentFilter,  setPaymentFilter]  = useState('')
  const [sortBy,         setSortBy]         = useState('created_at_desc')


  // ── Fetch orders ───────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (statusFilter)  params.status         = statusFilter
      if (paymentFilter) params.payment_status  = paymentFilter
      const { data } = await api.get('/orders/admin/all', { params })
      setOrders(data ?? [])
    } catch (err) {
      setError(err.normalizedMessage ?? 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, paymentFilter])


  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])


  // ── Client-side search + sort ──────────────────────────────────────────────

  const filtered = orders
    .filter((o) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        o.id.toLowerCase().includes(q)                    ||
        o.customer_name?.toLowerCase().includes(q)        ||
        o.customer_phone?.toLowerCase().includes(q)       ||
        o.razorpay_order_id?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created_at_desc':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'created_at_asc':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'amount_desc':
          return b.total_amount - a.total_amount
        case 'amount_asc':
          return a.total_amount - b.total_amount
        default:
          return 0
      }
    })


  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((acc, o) => acc + (o.total_amount ?? 0), 0)


  return (
    <div className="page-enter">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-widest
          text-brand-grey-500 mb-2">
          Management
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase
          text-brand-900">
          Orders
          <span className="text-brand-grey-500 ml-3 text-xl">
            ({orders.length})
          </span>
        </h1>
      </div>


      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          {
            label: 'Total Revenue',
            value: `₹${totalRevenue.toLocaleString('en-IN', {
              minimumFractionDigits: 0
            })}`,
          },
          {
            label: 'Total Orders',
            value: orders.length,
          },
          {
            label: 'Pending',
            value: orders.filter((o) => o.status === 'pending').length,
          },
          {
            label: 'Delivered',
            value: orders.filter((o) => o.status === 'delivered').length,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-brand-grey-100 p-4">
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-1">
              {label}
            </p>
            <p className="text-xl font-light text-brand-900">{value}</p>
          </div>
        ))}
      </div>


      {/* ── Filters toolbar ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            size={13}
            strokeWidth={1.5}
            className="absolute left-0 top-1/2 -translate-y-1/2
              text-brand-grey-500"
          />
          <input
            type="text"
            placeholder="Search by ID, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-5 pr-8 py-1.5 text-[13px] bg-transparent
              border-b border-brand-grey-200 focus:border-black outline-none
              placeholder:text-brand-grey-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-0 top-1/2 -translate-y-1/2
                text-brand-grey-500 hover:text-brand-900 transition-colors"
            >
              <X size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[12px] uppercase tracking-wider px-3 py-2
            border border-brand-grey-200 bg-white text-brand-900
            hover:border-black transition-colors outline-none cursor-pointer"
        >
          {STATUS_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label} status</option>
          ))}
        </select>

        {/* Payment filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="text-[12px] uppercase tracking-wider px-3 py-2
            border border-brand-grey-200 bg-white text-brand-900
            hover:border-black transition-colors outline-none cursor-pointer"
        >
          {PAYMENT_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label} payment</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-[12px] uppercase tracking-wider px-3 py-2
            border border-brand-grey-200 bg-white text-brand-900
            hover:border-black transition-colors outline-none cursor-pointer"
        >
          <option value="created_at_desc">Newest first</option>
          <option value="created_at_asc">Oldest first</option>
          <option value="amount_desc">Amount: High</option>
          <option value="amount_asc">Amount: Low</option>
        </select>

        {/* Result count */}
        <p className="text-[11px] uppercase tracking-wider
          text-brand-grey-500 ml-auto">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </p>

      </div>


      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200">
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}


      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="border border-brand-grey-200 overflow-hidden">

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3
          border-b border-brand-grey-200 bg-brand-grey-100">
          {[
            { label: 'Order ID',  cols: 2 },
            { label: 'Customer',  cols: 3 },
            { label: 'Items',     cols: 1 },
            { label: 'Amount',    cols: 2 },
            { label: 'Status',    cols: 2 },
            { label: 'Payment',   cols: 1 },
            { label: 'Date',      cols: 1 },
          ].map(({ label, cols }) => (
            <div key={label} className={`col-span-${cols}`}>
              <p className="text-[11px] uppercase tracking-widest
                text-brand-grey-500">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col divide-y divide-brand-grey-200">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-4 bg-brand-grey-100 animate-pulse w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <ShoppingBag
              size={36}
              strokeWidth={0.75}
              className="text-brand-grey-200 mx-auto mb-4"
            />
            <p className="text-[12px] uppercase tracking-wider
              text-brand-grey-500">
              {search || statusFilter || paymentFilter
                ? 'No orders match your filters'
                : 'No orders yet'
              }
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col divide-y divide-brand-grey-200">
            {filtered.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders/${order.id}`}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4
                  px-5 py-4 hover:bg-brand-grey-100 transition-colors
                  duration-200 group items-center"
              >
                {/* Order ID */}
                <div className="md:col-span-2 flex items-center">
                  <p className="text-[12px] text-brand-900 font-mono
                    group-hover:underline">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* Customer */}
                <div className="md:col-span-3">
                  <p className="text-[12px] uppercase tracking-wider
                    text-brand-900 line-clamp-1">
                    {order.customer_name ?? '—'}
                  </p>
                  {order.customer_phone && (
                    <p className="text-[10px] text-brand-grey-500 mt-0.5">
                      {order.customer_phone}
                    </p>
                  )}
                </div>

                {/* Item count */}
                <div className="md:col-span-1">
                  <p className="text-[12px] text-brand-grey-500">
                    {order.item_count ?? '—'}
                  </p>
                </div>

                {/* Amount */}
                <div className="md:col-span-2">
                  <p className="text-[13px] text-brand-900 font-medium">
                    ₹{order.total_amount?.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Order status */}
                <div className="md:col-span-2">
                  <span className={`badge ${statusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Payment status */}
                <div className="md:col-span-1">
                  <span className={`badge ${paymentBadgeClass(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                </div>

                {/* Date */}
                <div className="md:col-span-1 flex items-center
                  justify-between">
                  <p className="text-[11px] text-brand-grey-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day:   'numeric',
                      month: 'short',
                    })}
                  </p>
                  <ChevronRight
                    size={14}
                    strokeWidth={1.5}
                    className="text-brand-grey-200
                      group-hover:text-brand-900 transition-colors"
                  />
                </div>

              </Link>
            ))}
          </div>
        )}

      </div>

    </div>
  )
}