// src/pages/admin/UserList.jsx

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ChevronRight, Loader,
  Users, X, ShieldOff, Shield
} from 'lucide-react'
import api from '../../api/axios'

export default function AdminUserList() {
  const [users,        setUsers]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [togglingId,   setTogglingId]   = useState(null)


  // ── Fetch users ────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (search) params.search = search
      const { data } = await api.get('/admin/users', { params })
      setUsers(data ?? [])
    } catch (err) {
      setError(err.normalizedMessage ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search])


  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300)
    return () => clearTimeout(timer)
  }, [fetchUsers])


  // ── Toggle block ───────────────────────────────────────────────────────────

  const handleToggleBlock = async (user) => {
    if (user.role === 'admin') return
    const action = user.is_blocked ? 'unblock' : 'block'
    if (!window.confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} ${user.full_name}?`
    )) return

    setTogglingId(user.id)
    try {
      await api.put(`/admin/users/${user.id}/block`, {
        is_blocked: !user.is_blocked,
      })
      setUsers((p) =>
        p.map((u) =>
          u.id === user.id ? { ...u, is_blocked: !u.is_blocked } : u
        )
      )
    } catch (err) {
      console.warn('[admin] Block toggle failed:', err.message)
    } finally {
      setTogglingId(null)
    }
  }


  // ── Client-side filter ─────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const matchRole   = !roleFilter   || u.role       === roleFilter
    const matchStatus = !statusFilter || (
      statusFilter === 'blocked'
        ? u.is_blocked
        : !u.is_blocked
    )
    return matchRole && matchStatus
  })


  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalAdmins   = users.filter((u) => u.role       === 'admin').length
  const totalBlocked  = users.filter((u) => u.is_blocked === true).length
  const totalCustomers = users.filter((u) => u.role      === 'user').length


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
          Users
          <span className="text-brand-grey-500 ml-3 text-xl">
            ({users.length})
          </span>
        </h1>
      </div>


      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total Users',    value: users.length    },
          { label: 'Customers',      value: totalCustomers  },
          { label: 'Blocked',        value: totalBlocked    },
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
            placeholder="Search by name or phone..."
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

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-[12px] uppercase tracking-wider px-3 py-2
            border border-brand-grey-200 bg-white text-brand-900
            hover:border-black transition-colors outline-none cursor-pointer"
        >
          <option value="">All roles</option>
          <option value="user">Customers</option>
          <option value="admin">Admins</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-[12px] uppercase tracking-wider px-3 py-2
            border border-brand-grey-200 bg-white text-brand-900
            hover:border-black transition-colors outline-none cursor-pointer"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
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
            { label: 'Name',        cols: 3 },
            { label: 'Phone',       cols: 2 },
            { label: 'Role',        cols: 1 },
            { label: 'Status',      cols: 2 },
            { label: 'Orders',      cols: 1 },
            { label: 'Spent',       cols: 2 },
            { label: '',            cols: 1 },
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
            <Users
              size={36}
              strokeWidth={0.75}
              className="text-brand-grey-200 mx-auto mb-4"
            />
            <p className="text-[12px] uppercase tracking-wider
              text-brand-grey-500">
              {search || roleFilter || statusFilter
                ? 'No users match your filters'
                : 'No users yet'
              }
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-col divide-y divide-brand-grey-200">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4
                  px-5 py-4 items-center hover:bg-brand-grey-100
                  transition-colors duration-200"
              >

                {/* Name */}
                <div className="md:col-span-3">
                  <Link
                    to={`/admin/users/${user.id}`}
                    className="text-[13px] uppercase tracking-wider
                      text-brand-900 hover:underline line-clamp-1"
                  >
                    {user.full_name ?? '—'}
                  </Link>
                  <p className="text-[10px] text-brand-grey-500 font-mono mt-0.5">
                    {user.id.slice(0, 8)}
                  </p>
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <p className="text-[12px] text-brand-grey-500">
                    {user.phone ?? '—'}
                  </p>
                </div>

                {/* Role */}
                <div className="md:col-span-1">
                  <span className={`badge
                    ${user.role === 'admin' ? 'badge-black' : 'badge-grey'}`}>
                    {user.role}
                  </span>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <span className={`badge
                    ${user.is_blocked ? 'badge-red' : 'badge-black'}`}>
                    {user.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </div>

                {/* Orders */}
                <div className="md:col-span-1">
                  <p className="text-[12px] text-brand-grey-500">
                    {user.total_orders ?? 0}
                  </p>
                </div>

                {/* Total spent */}
                <div className="md:col-span-2">
                  <p className="text-[13px] text-brand-900">
                    ₹{(user.total_spent ?? 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 0
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex items-center
                  justify-end gap-3">

                  {/* Block / unblock */}
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleBlock(user)}
                      disabled={togglingId === user.id}
                      title={user.is_blocked ? 'Unblock user' : 'Block user'}
                      className={`transition-colors
                        ${user.is_blocked
                          ? 'text-brand-grey-500 hover:text-brand-900'
                          : 'text-brand-grey-200 hover:text-red-600'
                        }`}
                    >
                      {togglingId === user.id ? (
                        <Loader
                          size={14}
                          strokeWidth={1.5}
                          className="animate-spin"
                        />
                      ) : user.is_blocked ? (
                        <Shield size={14} strokeWidth={1.5} />
                      ) : (
                        <ShieldOff size={14} strokeWidth={1.5} />
                      )}
                    </button>
                  )}

                  {/* View */}
                  <Link
                    to={`/admin/users/${user.id}`}
                    className="text-brand-grey-200 hover:text-brand-900
                      transition-colors"
                  >
                    <ChevronRight size={16} strokeWidth={1.5} />
                  </Link>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  )
}