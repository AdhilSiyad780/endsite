// src/pages/user/Profile.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Package, Heart, MapPin, Edit2,
  Check, X, Loader, Plus, Trash2, Star
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function Profile() {
  const { profile, updateProfile, fetchProfile } = useAuth()

  // ── Profile edit state ─────────────────────────────────────────────────────
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm,    setProfileForm]    = useState({
    full_name:  profile?.full_name  ?? '',
    phone:      profile?.phone      ?? '',
    avatar_url: profile?.avatar_url ?? '',
  })
  const [profileErrors,  setProfileErrors]  = useState({})
  const [savingProfile,  setSavingProfile]  = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // ── Address state ──────────────────────────────────────────────────────────
  const [addresses,      setAddresses]      = useState([])
  const [addressLoading, setAddressLoading] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress,  setEditingAddress]  = useState(null)
  const [addressForm,    setAddressForm]    = useState({
    full_name: '', phone: '', address_line1: '',
    address_line2: '', city: '', state: '', pincode: '', is_default: false,
  })
  const [addressErrors,  setAddressErrors]  = useState({})
  const [savingAddress,  setSavingAddress]  = useState(false)
  const [deletingAddr,   setDeletingAddr]   = useState(null)

  // ── Stats state ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null)

  // ── Active tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('profile')

  const TABS = [
    { key: 'profile',   label: 'Profile',   icon: User    },
    { key: 'addresses', label: 'Addresses', icon: MapPin  },
  ]

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


  // ── Fetch addresses + stats on mount ──────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [addrRes, meRes] = await Promise.all([
          api.get('/addresses'),
          api.get('/me'),
        ])
        setAddresses(addrRes.data)
        setStats(meRes.data.stats)
      } catch (err) {
        console.warn('[profile] Fetch failed:', err.message)
      } finally {
        setAddressLoading(false)
      }
    }
    fetchData()
  }, [])


  // ── Sync profile form when profile changes ─────────────────────────────────

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name:  profile.full_name  ?? '',
        phone:      profile.phone      ?? '',
        avatar_url: profile.avatar_url ?? '',
      })
    }
  }, [profile])


  // ── Profile field helpers ──────────────────────────────────────────────────

  const setProfileField = (field) => (e) => {
    setProfileForm((p) => ({ ...p, [field]: e.target.value }))
    setProfileErrors((p) => ({ ...p, [field]: '' }))
  }

  const validateProfile = () => {
    const errs = {}
    if (!profileForm.full_name.trim())
      errs.full_name = 'Full name is required'
    setProfileErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!validateProfile()) return
    setSavingProfile(true)
    setProfileSuccess(false)
    try {
      await updateProfile(profileForm)
      setProfileSuccess(true)
      setEditingProfile(false)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileErrors({ submit: err.normalizedMessage ?? 'Failed to save' })
    } finally {
      setSavingProfile(false)
    }
  }


  // ── Address helpers ────────────────────────────────────────────────────────

  const setAddressField = (field) => (e) => {
    setAddressForm((p) => ({ ...p, [field]: e.target.value }))
    setAddressErrors((p) => ({ ...p, [field]: '' }))
  }

  const resetAddressForm = () => {
    setAddressForm({
      full_name: '', phone: '', address_line1: '',
      address_line2: '', city: '', state: '', pincode: '', is_default: false,
    })
    setAddressErrors({})
    setEditingAddress(null)
    setShowAddressForm(false)
  }

  const openNewAddress = () => {
    resetAddressForm()
    setAddressForm((p) => ({
      ...p,
      full_name: profile?.full_name ?? '',
      phone:     profile?.phone     ?? '',
    }))
    setShowAddressForm(true)
  }

  const openEditAddress = (addr) => {
    setEditingAddress(addr.id)
    setAddressForm({
      full_name:     addr.full_name     ?? '',
      phone:         addr.phone         ?? '',
      address_line1: addr.address_line1 ?? '',
      address_line2: addr.address_line2 ?? '',
      city:          addr.city          ?? '',
      state:         addr.state         ?? '',
      pincode:       addr.pincode       ?? '',
      is_default:    addr.is_default    ?? false,
    })
    setShowAddressForm(true)
  }

  const validateAddress = () => {
    const errs = {}
    if (!addressForm.full_name.trim())     errs.full_name     = 'Required'
    if (!addressForm.phone.trim())         errs.phone         = 'Required'
    if (!addressForm.address_line1.trim()) errs.address_line1 = 'Required'
    if (!addressForm.city.trim())          errs.city          = 'Required'
    if (!addressForm.state.trim())         errs.state         = 'Required'
    if (!addressForm.pincode.trim())       errs.pincode       = 'Required'
    else if (!/^\d{6}$/.test(addressForm.pincode))
      errs.pincode = '6 digits required'
    setAddressErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!validateAddress()) return
    setSavingAddress(true)
    try {
      if (editingAddress) {
        const { data } = await api.put(`/addresses/${editingAddress}`, addressForm)
        setAddresses((p) =>
          p.map((a) => a.id === editingAddress ? data : a)
        )
      } else {
        const { data } = await api.post('/addresses', addressForm)
        setAddresses((p) => [...p, data])
      }
      resetAddressForm()
    } catch (err) {
      setAddressErrors({ submit: err.normalizedMessage ?? 'Failed to save address' })
    } finally {
      setSavingAddress(false)
    }
  }

  const handleDeleteAddress = async (id) => {
    setDeletingAddr(id)
    try {
      await api.delete(`/addresses/${id}`)
      setAddresses((p) => p.filter((a) => a.id !== id))
    } catch (err) {
      console.warn('[address] Delete failed:', err.message)
    } finally {
      setDeletingAddr(null)
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/addresses/${id}/set-default`)
      setAddresses((p) =>
        p.map((a) => ({ ...a, is_default: a.id === id }))
      )
    } catch (err) {
      console.warn('[address] Set default failed:', err.message)
    }
  }


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
            Profile
          </h1>
        </div>


        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px
            bg-brand-grey-200 mb-10">
            {[
              { label: 'Total Orders',    value: stats.total_orders    },
              { label: 'Delivered',       value: stats.delivered_orders },
              { label: 'Pending',         value: stats.pending_orders  },
              { label: 'Wishlist Items',  value: stats.wishlist_count  },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white p-5 text-center">
                <p className="text-2xl font-light text-brand-900">{value}</p>
                <p className="text-[11px] uppercase tracking-widest
                  text-brand-grey-500 mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}


        {/* ── Quick links ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Link to="/orders" className="btn-outline flex items-center gap-2">
            <Package size={14} strokeWidth={1.5} />
            My Orders
          </Link>
          <Link to="/wishlist" className="btn-outline flex items-center gap-2">
            <Heart size={14} strokeWidth={1.5} />
            Wishlist
          </Link>
        </div>


        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-0 border-b border-brand-grey-200 mb-8">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 pb-3 mr-6 text-[12px]
                uppercase tracking-wider border-b-2 transition-all duration-200
                ${activeTab === key
                  ? 'border-black text-brand-900'
                  : 'border-transparent text-brand-grey-500 hover:text-brand-900'
                }`}
            >
              <Icon size={13} strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>


        {/* ── Tab: Profile ─────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="max-w-lg animate-fade-in">

            {/* Success message */}
            {profileSuccess && (
              <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200
                flex items-center gap-2">
                <Check size={14} strokeWidth={1.5} className="text-green-600" />
                <p className="text-[12px] text-green-700">
                  Profile updated successfully
                </p>
              </div>
            )}

            {/* Profile display / edit form */}
            {editingProfile ? (
              <form
                onSubmit={handleSaveProfile}
                noValidate
                className="flex flex-col gap-7"
              >

                {profileErrors.submit && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200">
                    <p className="text-[12px] text-red-600">
                      {profileErrors.submit}
                    </p>
                  </div>
                )}

                {/* Full name */}
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    className={`input-underline
                      ${profileErrors.full_name ? 'error' : ''}`}
                    value={profileForm.full_name}
                    onChange={setProfileField('full_name')}
                    placeholder="Your full name"
                  />
                  {profileErrors.full_name && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {profileErrors.full_name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="input-label">Phone</label>
                  <input
                    type="tel"
                    className="input-underline"
                    value={profileForm.phone}
                    onChange={setProfileField('phone')}
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* Avatar URL */}
                <div>
                  <label className="input-label">Avatar URL</label>
                  <input
                    type="url"
                    className="input-underline"
                    value={profileForm.avatar_url}
                    onChange={setProfileField('avatar_url')}
                    placeholder="https://..."
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary flex items-center gap-2"
                  >
                    {savingProfile && (
                      <Loader size={13} strokeWidth={1.5} className="animate-spin" />
                    )}
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false)
                      setProfileErrors({})
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            ) : (
              <div className="flex flex-col gap-6">

                {/* Avatar */}
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-brand-grey-100 overflow-hidden
                    flex-shrink-0 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={24} strokeWidth={1} className="text-brand-grey-200" />
                    )}
                  </div>
                  <div>
                    <p className="text-[16px] font-light tracking-wider
                      uppercase text-brand-900">
                      {profile?.full_name ?? '—'}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider
                      text-brand-grey-500 mt-0.5">
                      {profile?.role ?? 'Member'}
                    </p>
                  </div>
                </div>

                {/* Info rows */}
                <div className="flex flex-col divide-y divide-brand-grey-200">
                  {[
                    { label: 'Full Name', value: profile?.full_name   ?? '—' },
                    { label: 'Phone',     value: profile?.phone       ?? '—' },
                    { label: 'Role',      value: profile?.role        ?? '—' },
                    {
                      label: 'Member since',
                      value: profile?.created_at
                        ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })
                        : '—'
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-4"
                    >
                      <p className="text-[11px] uppercase tracking-widest
                        text-brand-grey-500">
                        {label}
                      </p>
                      <p className="text-[13px] text-brand-900 uppercase
                        tracking-wide">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Edit button */}
                <button
                  onClick={() => setEditingProfile(true)}
                  className="btn-outline self-start flex items-center gap-2"
                >
                  <Edit2 size={13} strokeWidth={1.5} />
                  Edit Profile
                </button>

              </div>
            )}

          </div>
        )}


        {/* ── Tab: Addresses ───────────────────────────────────────────────── */}
        {activeTab === 'addresses' && (
          <div className="animate-fade-in">

            {/* Add new address button */}
            {!showAddressForm && (
              <button
                onClick={openNewAddress}
                disabled={addresses.length >= 5}
                className="btn-outline flex items-center gap-2 mb-8"
              >
                <Plus size={13} strokeWidth={1.5} />
                Add New Address
              </button>
            )}

            {addresses.length >= 5 && !showAddressForm && (
              <p className="text-[11px] uppercase tracking-wider
                text-brand-grey-500 mb-6">
                Maximum of 5 addresses reached.
                Delete one to add a new address.
              </p>
            )}

            {/* Address form */}
            {showAddressForm && (
              <form
                onSubmit={handleSaveAddress}
                noValidate
                className="border border-brand-grey-200 p-6
                  flex flex-col gap-6 mb-8 animate-fade-in max-w-xl"
              >
                <p className="text-[12px] uppercase tracking-wider
                  text-brand-900 font-medium">
                  {editingAddress ? 'Edit Address' : 'New Address'}
                </p>

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
                      value={addressForm.full_name}
                      onChange={setAddressField('full_name')}
                      placeholder="Recipient name"
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
                      value={addressForm.phone}
                      onChange={setAddressField('phone')}
                      placeholder="+91 98765 43210"
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
                    value={addressForm.address_line1}
                    onChange={setAddressField('address_line1')}
                    placeholder="House / flat / street"
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
                    value={addressForm.address_line2}
                    onChange={setAddressField('address_line2')}
                    placeholder="Landmark / area"
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
                      value={addressForm.city}
                      onChange={setAddressField('city')}
                      placeholder="City"
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
                      value={addressForm.pincode}
                      onChange={setAddressField('pincode')}
                      placeholder="6-digit pincode"
                      maxLength={6}
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
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() =>
                      setAddressForm((p) => ({
                        ...p, is_default: !p.is_default
                      }))
                    }
                    className={`w-4 h-4 border flex items-center justify-center
                      flex-shrink-0 transition-colors
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
                    text-brand-grey-500 group-hover:text-brand-900 transition-colors">
                    Set as default address
                  </span>
                </label>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="btn-primary flex items-center gap-2"
                  >
                    {savingAddress && (
                      <Loader size={13} strokeWidth={1.5} className="animate-spin" />
                    )}
                    {savingAddress ? 'Saving...' : 'Save Address'}
                  </button>
                  <button
                    type="button"
                    onClick={resetAddressForm}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            )}

            {/* Addresses list */}
            {addressLoading ? (
              <div className="flex flex-col gap-3">
                {Array(2).fill(null).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-brand-grey-100 animate-pulse"
                  />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center
                py-16 text-center border border-brand-grey-200">
                <MapPin
                  size={36}
                  strokeWidth={0.75}
                  className="text-brand-grey-200 mb-4"
                />
                <p className="text-[12px] uppercase tracking-wider
                  text-brand-grey-500">
                  No addresses saved yet
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-w-xl">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`border p-5 transition-colors
                      ${addr.is_default
                        ? 'border-black'
                        : 'border-brand-grey-200'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">

                      {/* Address info */}
                      <div className="flex flex-col gap-1 flex-1">
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

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditAddress(addr)}
                          className="flex items-center gap-1 text-[11px]
                            uppercase tracking-wider text-brand-grey-500
                            hover:text-brand-900 transition-colors"
                        >
                          <Edit2 size={11} strokeWidth={1.5} />
                          Edit
                        </button>
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="flex items-center gap-1 text-[11px]
                              uppercase tracking-wider text-brand-grey-500
                              hover:text-brand-900 transition-colors"
                          >
                            <Star size={11} strokeWidth={1.5} />
                            Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          disabled={deletingAddr === addr.id}
                          className="flex items-center gap-1 text-[11px]
                            uppercase tracking-wider text-brand-grey-500
                            hover:text-red-600 transition-colors"
                        >
                          {deletingAddr === addr.id ? (
                            <Loader
                              size={11}
                              strokeWidth={1.5}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={11} strokeWidth={1.5} />
                          )}
                          Delete
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}