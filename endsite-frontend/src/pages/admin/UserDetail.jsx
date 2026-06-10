// src/pages/admin/UserDetail.jsx

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Loader, Package, MapPin,
  Shield, ShieldOff, Check, AlertTriangle,
  User, Phone, Calendar
} from 'lucide-react'
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

export default function AdminUserDetail() {
  const { id } = useParams()

  const [user,          setUser]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [togglingBlock, setTogglingBlock] = useState(false)
  const [blockError,    setBlockError]    = useState('')
  const [blockSuccess,  setBlockSuccess]  = useState('')
  const [activeTab,     setActiveTab]     = useState('overview')

  const TABS = [
    { key: 'overview',  label: 'Overview'  },
    { key: 'orders',    label: 'Orders'    },
    { key: 'addresses', label: 'Addresses' },
  ]


  // ── Fetch user ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/admin/users/${id}`)
        setUser(data)
      } catch (err) {
        setError(err.normalizedMessage ?? 'User not found')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
    window.scrollTo(0, 0)
  }, [id])


  // ── Toggle block ───────────────────────────────────────────────────────────

  const handleToggleBlock = async () => {
    if (!user || user.role === 'admin') return
    const action   = user.is_blocked ? 'unblock' : 'block'
    const newState = !user.is_blocked

    setTogglingBlock(true)
    setBlockError('')
    setBlockSuccess('')
    try {
      await api.put(`/admin/users/${id}/block`, {
        is_blocked: newState,
      })
      setUser((p) => ({ ...p, is_blocked: newState }))
      setBlockSuccess(
        `User ${newState ? 'blocked' : 'unblocked'} successfully`
      )
      setTimeout(() => setBlockSuccess(''), 3000)
    } catch (err) {
      setBlockError(err.normalizedMessage ?? `Failed to ${action} user`)
    } finally {
      setTogglingBlock(false)
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
            Loading user...
          </p>
        </div>
      </div>
    )
  }


  // ── Error ──────────────────────────────────────────────────────────────────

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center
        min-h-[400px] text-center px-6">
        <p className="text-[11px] uppercase tracking-widest
          text-brand-grey-500 mb-4">
          Error
        </p>
        <h2 className="text-xl font-light tracking-wider uppercase
          text-brand-900 mb-4">
          {error || 'User not found'}
        </h2>
        <Link to="/admin/users" className="btn-primary mt-4">
          Back to Users
        </Link>
      </div>
    )
  }


  const recentOrders = user.recent_orders ?? []
  const addresses    = user.addresses     ?? []


  return (
    <div className="page-enter">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-[11px] uppercase
            tracking-wider text-brand-grey-500 hover:text-brand-900
            transition-colors mb-6"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          Back to users
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end
          justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-2">
              Customer profile
            </p>
            <h1 className="text-3xl font-light tracking-wider uppercase
              text-brand-900">
              {user.full_name ?? '—'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className={`badge
              ${user.role === 'admin' ? 'badge-black' : 'badge-grey'}`}>
              {user.role}
            </span>
            <span className={`badge
              ${user.is_blocked ? 'badge-red' : 'badge-black'}`}>
              {user.is_blocked ? 'Blocked' : 'Active'}
            </span>
          </div>
        </div>
      </div>


      {/* ── Block / unblock action ─────────────────────────────────────────── */}
      {user.role !== 'admin' && (
        <div className="mb-8">

          {blockError && (
            <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200
              flex items-center gap-2">
              <AlertTriangle
                size={14}
                strokeWidth={1.5}
                className="text-red-600 flex-shrink-0"
              />
              <p className="text-[12px] text-red-600">{blockError}</p>
            </div>
          )}

          {blockSuccess && (
            <div className="mb-3 px-4 py-3 bg-green-50 border border-green-200
              flex items-center gap-2">
              <Check
                size={14}
                strokeWidth={1.5}
                className="text-green-600 flex-shrink-0"
              />
              <p className="text-[12px] text-green-700">{blockSuccess}</p>
            </div>
          )}

          <button
            onClick={handleToggleBlock}
            disabled={togglingBlock}
            className={`flex items-center gap-2 btn-outline text-[12px]
              ${user.is_blocked
                ? 'hover:bg-black hover:text-white hover:border-black'
                : 'border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600'
              }`}
          >
            {togglingBlock ? (
              <Loader size={13} strokeWidth={1.5} className="animate-spin" />
            ) : user.is_blocked ? (
              <Shield size={13} strokeWidth={1.5} />
            ) : (
              <ShieldOff size={13} strokeWidth={1.5} />
            )}
            {togglingBlock
              ? 'Updating...'
              : user.is_blocked
                ? 'Unblock User'
                : 'Block User'
            }
          </button>

        </div>
      )}


      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-brand-grey-200 mb-8">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 mr-6 text-[12px] uppercase tracking-wider
              border-b-2 transition-all duration-200
              ${activeTab === key
                ? 'border-black text-brand-900'
                : 'border-transparent text-brand-grey-500 hover:text-brand-900'
              }`}
          >
            {label}
            {key === 'orders' && recentOrders.length > 0 && (
              <span className="ml-2 text-brand-grey-500">
                ({recentOrders.length})
              </span>
            )}
          </button>
        ))}
      </div>


      {/* ═══ TAB: Overview ═════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">

          {/* User info */}
          <div className="bg-brand-grey-100 p-6">
            <h3 className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-5">
              Account Info
            </h3>
            <div className="flex flex-col gap-4">

              <div className="flex items-center gap-3">
                <User
                  size={14}
                  strokeWidth={1.5}
                  className="text-brand-grey-500 flex-shrink-0"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-wider
                    text-brand-grey-500 mb-0.5">
                    Full Name
                  </p>
                  <p className="text-[13px] text-brand-900 uppercase
                    tracking-wide">
                    {user.full_name ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone
                  size={14}
                  strokeWidth={1.5}
                  className="text-brand-grey-500 flex-shrink-0"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-wider
                    text-brand-grey-500 mb-0.5">
                    Phone
                  </p>
                  <p className="text-[13px] text-brand-900">
                    {user.phone ?? '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar
                  size={14}
                  strokeWidth={1.5}
                  className="text-brand-grey-500 flex-shrink-0"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-wider
                    text-brand-grey-500 mb-0.5">
                    Member Since
                  </p>
                  <p className="text-[13px] text-brand-900">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString('en-IN', {
                          day:   'numeric',
                          month: 'long',
                          year:  'numeric',
                        })
                      : '—'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield
                  size={14}
                  strokeWidth={1.5}
                  className="text-brand-grey-500 flex-shrink-0"
                />
                <div>
                  <p className="text-[10px] uppercase tracking-wider
                    text-brand-grey-500 mb-0.5">
                    User ID
                  </p>
                  <p className="text-[11px] text-brand-grey-500 font-mono">
                    {user.id}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Order summary */}
          <div className="bg-brand-grey-100 p-6">
            <h3 className="text-[11px] uppercase tracking-widest
              text-brand-grey-500 mb-5">
              Purchase Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Total Orders',
                  value: user.total_orders ?? 0,
                },
                {
                  label: 'Total Spent',
                  value: `₹${(user.total_spent ?? 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 0
                  })}`,
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] uppercase tracking-widest
                    text-brand-grey-500 mb-1">
                    {label}
                  </p>
                  <p className="text-2xl font-light text-brand-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Avatar if exists */}
            {user.avatar_url && (
              <div className="mt-5 pt-5 border-t border-brand-grey-200">
                <p className="text-[11px] uppercase tracking-wider
                  text-brand-grey-500 mb-3">
                  Avatar
                </p>
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-16 h-16 object-cover"
                />
              </div>
            )}
          </div>

        </div>
      )}


      {/* ═══ TAB: Orders ═══════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center
              py-16 text-center border border-brand-grey-200">
              <Package
                size={36}
                strokeWidth={0.75}
                className="text-brand-grey-200 mb-4"
              />
              <p className="text-[12px] uppercase tracking-wider
                text-brand-grey-500">
                No orders yet
              </p>
            </div>
          ) : (
            <div className="border border-brand-grey-200 overflow-hidden">

              {/* Table header */}
              <div className="hidden md:grid grid-cols-10 gap-4 px-5 py-3
                border-b border-brand-grey-200 bg-brand-grey-100">
                {[
                  { label: 'Order ID',  cols: 2 },
                  { label: 'Amount',    cols: 2 },
                  { label: 'Status',    cols: 2 },
                  { label: 'Payment',   cols: 2 },
                  { label: 'Date',      cols: 2 },
                ].map(({ label, cols }) => (
                  <div key={label} className={`col-span-${cols}`}>
                    <p className="text-[11px] uppercase tracking-widest
                      text-brand-grey-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col divide-y divide-brand-grey-200">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/orders/${order.id}`}
                    className="grid grid-cols-1 md:grid-cols-10 gap-2 md:gap-4
                      px-5 py-4 hover:bg-brand-grey-100 transition-colors
                      duration-200 group items-center"
                  >
                    <div className="md:col-span-2">
                      <p className="text-[12px] text-brand-900 font-mono
                        group-hover:underline">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[13px] text-brand-900">
                        ₹{order.total_amount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className={`badge ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className={`badge
                        ${order.payment_status === 'paid'
                          ? 'badge-black'
                          : 'badge-grey'
                        }`}>
                        {order.payment_status}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-[11px] text-brand-grey-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

            </div>
          )}

          {recentOrders.length > 0 && (
            <p className="text-[11px] uppercase tracking-wider
              text-brand-grey-500 mt-4">
              Showing last {recentOrders.length} orders.
              Full history available in orders section.
            </p>
          )}
        </div>
      )}


      {/* ═══ TAB: Addresses ════════════════════════════════════════════════ */}
      {activeTab === 'addresses' && (
        <div className="animate-fade-in">
          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center
              py-16 text-center border border-brand-grey-200">
              <MapPin
                size={36}
                strokeWidth={0.75}
                className="text-brand-grey-200 mb-4"
              />
              <p className="text-[12px] uppercase tracking-wider
                text-brand-grey-500">
                No addresses saved
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-xl">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`border p-5
                    ${addr.is_default
                      ? 'border-black'
                      : 'border-brand-grey-200'
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] uppercase tracking-wider
                          text-brand-900 font-medium">
                          {addr.full_name}
                        </p>
                        {addr.is_default && (
                          <span className="badge badge-black text-[9px]">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-brand-grey-500
                        leading-relaxed">
                        {addr.address_line1}
                        {addr.address_line2 && `, ${addr.address_line2}`}
                        <br />
                        {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider
                        text-brand-grey-500">
                        {addr.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}