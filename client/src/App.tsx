import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ToastHost'

const HomePage = lazy(() => import('./pages/HomePage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'))
const AdminInquiriesPage = lazy(() => import('./pages/AdminInquiriesPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage'))
const CheckoutPortOneRedirectPage = lazy(() => import('./pages/CheckoutPortOneRedirectPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const InquiriesPage = lazy(() => import('./pages/InquiriesPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))

function RouteFallback() {
  return (
    <div className="min-h-[50vh] bg-background flex flex-col items-center justify-center gap-2 px-4">
      <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}

function AuthLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">Checking your session…</p>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoading />
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return children
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <AuthLoading />
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              }
            />
            <Route
              path="/checkout/success"
              element={
                <RequireAuth>
                  <CheckoutSuccessPage />
                </RequireAuth>
              }
            />
            <Route
              path="/checkout/portone/redirect"
              element={
                <RequireAuth>
                  <CheckoutPortOneRedirectPage />
                </RequireAuth>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireAuth>
                  <OrdersPage />
                </RequireAuth>
              }
            />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <AccountPage />
                </RequireAuth>
              }
            />
            <Route
              path="/inquiries"
              element={
                <RequireAuth>
                  <InquiriesPage />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/admin"
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="inquiries" element={<AdminInquiriesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </ToastProvider>
  )
}
