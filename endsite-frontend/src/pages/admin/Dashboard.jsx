// src/pages/admin/Dashboard.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, ShoppingBag, Users, TrendingUp,
  ArrowRight, Clock, CheckCircle, XCircle,
  Truck, Loader
} from 'lucide-react'
import api from '../../api/axios'

function StatCard({ label, value, icon: Icon, sub, loading }) {
  return (
    <div className="bg-white border border-brand-grey-200 p-6
      flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest
          text-brand-grey-500">
          {label}
        </p>
        <Icon size={16} strokeWidth={1.5} className="text-brand-grey-200" />
      </div>
      {loading ? (
        <div className="h-8 w-24 bg-brand-grey-100 animate-pulse" />
      ) : (
        <p className="text-3xl font-light text-brand-900">{value}</p>
      )}
      {sub && (
        <p className="text-[11px] uppercase tracking-wider text-brand-grey-500">
          {sub}
        </p>
      )}
    </div>
  )
}

function statusBadgeClass(status) {
  switch (status) {
    case 'delivered':  return 'badge-black'
    case 'shipped':    return 'badge-black'
    case 'confirmed':  return 'badge-black'
    case 'cancelled':  return 'badge-red'
    default:           return 'badge-grey'
  }
}

export default function AdminDashboard() {
  const [stats,        setStats]        = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)


  // ── Fetch dashboard data ───────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, usersRes, productsRes] = await Promise.all([
          api.get('/admin/all',     { baseURL: `${import.meta.env.VITE_API_BASE_URL}/orders` }),
          api.get('/admin/users'),
          api.get('/admin/products'),
        ])

        const orders   = ordersRes.data   ?? []
        const users    = usersRes.data    ?? []
        const products = productsRes.data ?? []

        const totalRevenue = orders
          .filter((o) => o.payment_status === 'paid')
          .reduce((acc, o) => acc + (o.total_amount ?? 0), 0)

        setStats({
          totalOrders:    orders.length,
          totalRevenue:   totalRevenue,
          totalUsers:     users.length,
          totalProducts:  products.length,
          pendingOrders:  orders.filter((o) => o.status === 'pending').length,
          shippedOrders:  orders.filter((o) => o.status === 'shipped').length,
          deliveredOrders: orders.filter((o) => o.status === 'delivered').length,
          cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
        })

        setRecentOrders(orders.slice(0, 8))
      } catch (err) {
        console.error('[admin dashboard]', err.message)
      } finally {
        setLoading(false)
        setOrdersLoading(false)
      }
    }
    fetchData()
  }, [])


  return (
    <div className="page-enter">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest
          text-brand-grey-500 mb-2">
          endsite admin
        </p>
        <h1 className="text-3xl font-light tracking-wider uppercase
          text-[#1A1A1A]">
          Dashboard
        </h1>
      </div>


      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="Total Revenue"
          value={stats
            ? `₹${stats.totalRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 0
              })}`
            : '—'
          }
          icon={TrendingUp}
          sub="From paid orders"
          loading={loading}
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders ?? '—'}
          icon={ShoppingBag}
          sub={stats ? `${stats.pendingOrders} pending` : ''}
          loading={loading}
        />
        <StatCard
          label="Customers"
          value={stats?.totalUsers ?? '—'}
          icon={Users}
          sub="Registered accounts"
          loading={loading}
        />
        <StatCard
          label="Products"
          value={stats?.totalProducts ?? '—'}
          icon={Package}
          sub="In catalogue"
          loading={loading}
        />
      </div>


      {/* ── Order status breakdown ────────────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            {
              label: 'Pending',
              value: stats.pendingOrders,
              icon:  Clock,
              color: 'text-brand-grey-500',
            },
            {
              label: 'Shipped',
              value: stats.shippedOrders,
              icon:  Truck,
              color: 'text-brand-900',
            },
            {
              label: 'Delivered',
              value: stats.deliveredOrders,
              icon:  CheckCircle,
              color: 'text-brand-900',
            },
            {
              label: 'Cancelled',
              value: stats.cancelledOrders,
              icon:  XCircle,
              color: 'text-red-500',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-brand-grey-100 p-5 flex items-center
                justify-between"
            >
              <div>
                <p className="text-[11px] uppercase tracking-widest
                  text-brand-grey-500 mb-1">
                  {label}
                </p>
                <p className="text-2xl font-light text-brand-900">
                  {value}
                </p>
              </div>
              <Icon size={20} strokeWidth={1} className={color} />
            </div>
          ))}
        </div>
      )}


      {/* ── Quick links ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        {[
          {
            label: 'Manage Products',
            desc:  'Add, edit, or remove products and variants',
            to:    '/admin/products',
            icon:  Package,
          },
          {
            label: 'View Orders',
            desc:  'Track and update order statuses',
            to:    '/admin/orders',
            icon:  ShoppingBag,
          },
          {
            label: 'Manage Users',
            desc:  'View customers and block/unblock accounts',
            to:    '/admin/users',
            icon:  Users,
          },
        ].map(({ label, desc, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group border border-brand-grey-200 p-6
              hover:border-black transition-colors duration-200
              flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <Icon size={18} strokeWidth={1.5} className="text-brand-grey-200
                group-hover:text-brand-900 transition-colors" />
              <ArrowRight size={14} strokeWidth={1.5}
                className="text-brand-grey-200
                  group-hover:text-brand-900 transition-colors" />
            </div>
            <div>
              <p className="text-[13px] uppercase tracking-wider
                text-brand-900 font-medium mb-1">
                {label}
              </p>
              <p className="text-[12px] text-brand-grey-500">
                {desc}
              </p>
            </div>
          </Link>
        ))}
      </div>


      {/* ── Recent orders table ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] uppercase tracking-wider
            font-medium text-brand-900">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-[11px] uppercase tracking-wider
              text-brand-grey-500 hover:text-brand-900 transition-colors
              flex items-center gap-1.5"
          >
            View all
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="border border-brand-grey-200 overflow-hidden">

          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3
            border-b border-brand-grey-200 bg-brand-grey-100">
            {[
              { label: 'Order ID',   cols: 2 },
              { label: 'Customer',   cols: 3 },
              { label: 'Amount',     cols: 2 },
              { label: 'Status',     cols: 2 },
              { label: 'Payment',    cols: 2 },
              { label: 'Date',       cols: 1 },
            ].map(({ label, cols }) => (
              <div key={label} className={`col-span-${cols}`}>
                <p className="text-[11px] uppercase tracking-widest
                  text-brand-grey-500">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Table rows */}
          {ordersLoading ? (
            <div className="flex flex-col divide-y divide-brand-grey-200">
              {Array(6).fill(null).map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="h-4 bg-brand-grey-100 animate-pulse w-full" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[12px] uppercase tracking-wider
                text-brand-grey-500">
                No orders yet
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-brand-grey-200">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4
                    px-5 py-4 hover:bg-brand-grey-100 transition-colors
                    duration-200 group"
                >
                  {/* Order ID */}
                  <div className="md:col-span-2 flex items-center">
                    <p className="text-[12px] text-brand-900 font-mono
                      group-hover:underline">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="md:col-span-3 flex items-center">
                    <div>
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
                  </div>

                  {/* Amount */}
                  <div className="md:col-span-2 flex items-center">
                    <p className="text-[13px] text-brand-900">
                      ₹{order.total_amount?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Order status */}
                  <div className="md:col-span-2 flex items-center">
                    <span className={`badge ${statusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Payment status */}
                  <div className="md:col-span-2 flex items-center">
                    <span className={`badge
                      ${order.payment_status === 'paid'
                        ? 'badge-black'
                        : 'badge-grey'
                      }`}>
                      {order.payment_status}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-1 flex items-center">
                    <p className="text-[11px] text-brand-grey-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day:   'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                </Link>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
