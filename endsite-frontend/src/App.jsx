// src/App.jsx

import { Routes, Route, Navigate } from 'react-router-dom'

// ── Layouts ────────────────────────────────────────────────────────────────────
import UserLayout  from './layout/UserLayout'
import AdminLayout from './layout/AdminLayout'
import AuthLayout  from './layout/AuthLayout'

// ── Guards ─────────────────────────────────────────────────────────────────────
import ProtectedRoute from './components/guards/ProtectedRoutes'
import AdminRoute     from './components/guards/AdminRoute'

// ── Auth pages ─────────────────────────────────────────────────────────────────
import Login          from './pages/auth/Login'
import Signup         from './pages/auth/Signup'
import VerifyEmail    from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword  from './pages/auth/ResetPassword'

// ── User pages ─────────────────────────────────────────────────────────────────
import Home          from './pages/user/Home'
import Products      from './pages/user/Products'
import ProductDetail from './pages/user/ProductDetail'
import Cart          from './pages/user/Cart'
import Checkout      from './pages/user/Checkout'
import OrderConfirm  from './pages/user/OrderConfirm'
import OrderHistory  from './pages/user/OrderHistory'
import OrderDetail   from './pages/user/OrderDetail'
import Wishlist      from './pages/user/Wishlist'
import Profile       from './pages/user/Profile'
import About         from './pages/user/About'

// ── Admin pages ────────────────────────────────────────────────────────────────
import AdminDashboard   from './pages/admin/Dashboard'
import AdminProducts    from './pages/admin/ProductList'
import AdminAddProduct  from './pages/admin/AddProduct'
import AdminEditProduct from './pages/admin/EditProduct'
import AdminOrders      from './pages/admin/OrderList'
import AdminOrderDetail from './pages/admin/OrderDetail'
import AdminUsers       from './pages/admin/UserList'
import AdminUserDetail  from './pages/admin/UserDetail'

export default function App() {
  return (
    <Routes>

      {/* ── Auth routes ─────────────────────────────────────────────────────── */}
      <Route element={<AuthLayout />}>
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
      </Route>

      {/* ── User / public routes ─────────────────────────────────────────────── */}
      <Route element={<UserLayout />}>

        {/* Public — no auth needed */}
        <Route path="/"                element={<Home />} />
        <Route path="/products"        element={<Products />} />
        <Route path="/products/:id"    element={<ProductDetail />} />
        <Route path="/cart"            element={<Cart />} />
        <Route path="/about"           element={<About />} />

        {/* Protected — auth required */}
        <Route element={<ProtectedRoute />}>
          <Route path="/checkout"            element={<Checkout />} />
          <Route path="/order-confirm/:id"   element={<OrderConfirm />} />
          <Route path="/orders"              element={<OrderHistory />} />
          <Route path="/orders/:id"          element={<OrderDetail />} />
          <Route path="/wishlist"            element={<Wishlist />} />
          <Route path="/profile"             element={<Profile />} />
        </Route>

      </Route>

      {/* ── Admin routes ─────────────────────────────────────────────────────── */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"                    element={<AdminDashboard />} />
          <Route path="/admin/products"           element={<AdminProducts />} />
          <Route path="/admin/products/add"       element={<AdminAddProduct />} />
          <Route path="/admin/products/:id/edit"  element={<AdminEditProduct />} />
          <Route path="/admin/orders"             element={<AdminOrders />} />
          <Route path="/admin/orders/:id"         element={<AdminOrderDetail />} />
          <Route path="/admin/users"              element={<AdminUsers />} />
          <Route path="/admin/users/:id"          element={<AdminUserDetail />} />
        </Route>
      </Route>

      {/* ── Fallback ──────────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}