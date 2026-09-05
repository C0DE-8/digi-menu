import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom'
import './App.css'
import './refresh.css'
import Header from './components/Header'
import Footer from './components/Footer'
import PageTransitionLoader from './components/PageTransitionLoader'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard'
import Login from './pages/auth/Login'
import CustomerRegister from './pages/auth/CustomerRegister'
import Checkout from './pages/customer/Checkout'
import Register from './pages/auth/Register'
import Home from './pages/marketing/Home'
import RestaurantDetail from './pages/marketing/RestaurantDetail'
import MenuBuilder from './pages/menu/MenuBuilder'
import PublicMenu from './pages/menu/PublicMenu'
import Analytics from './pages/restaurant/Analytics'
import Dashboard from './pages/restaurant/Dashboard'
import QRCodePage from './pages/restaurant/QRCodePage'
import Kitchen from './pages/restaurant/Kitchen'
import Orders from './pages/restaurant/Orders'
import RestaurantSettings from './pages/restaurant/RestaurantSettings'
import Subscriptions from './pages/restaurant/Subscriptions'
import NotFound from './pages/system/NotFound'

function SlugPage({ component: Component }) {
  const { slug } = useParams()
  return <Component key={slug} />
}

function App() {
  return (
    <BrowserRouter>
      <Header />
      <PageTransitionLoader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-lock" element={<Login adminLock />} />
        <Route path="/register" element={<Register />} />
        <Route path="/store/sign-up" element={<CustomerRegister />} />
        <Route path="/customer/sign-up" element={<CustomerRegister />} />
        <Route path="/restaurants/:slug" element={<SlugPage component={RestaurantDetail} />} />
        <Route path="/menu/:slug" element={<SlugPage component={PublicMenu} />} />
        <Route path="/checkout/:slug" element={<SlugPage component={Checkout} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute restaurantOnly>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu-builder"
          element={
            <ProtectedRoute restaurantOnly>
              <MenuBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute restaurantOnly>
              <RestaurantSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute restaurantOnly>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute restaurantOnly>
              <Orders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute restaurantOnly>
              <Kitchen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-code"
          element={
            <ProtectedRoute restaurantOnly>
              <QRCodePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute restaurantOnly>
              <Subscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute superAdminOnly>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
