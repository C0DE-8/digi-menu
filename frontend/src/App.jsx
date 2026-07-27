import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import Login from './pages/auth/Login'
import Home from './pages/marketing/Home'
import MenuBuilder from './pages/menu/MenuBuilder'
import PublicMenu from './pages/menu/PublicMenu'
import Analytics from './pages/restaurant/Analytics'
import Dashboard from './pages/restaurant/Dashboard'
import QRCodePage from './pages/restaurant/QRCodePage'
import RestaurantSettings from './pages/restaurant/RestaurantSettings'
import Subscriptions from './pages/restaurant/Subscriptions'
import NotFound from './pages/system/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu/:slug" element={<PublicMenu />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu-builder"
          element={
            <ProtectedRoute>
              <MenuBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <RestaurantSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-code"
          element={
            <ProtectedRoute>
              <QRCodePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <Subscriptions />
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
