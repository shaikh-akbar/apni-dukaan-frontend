import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import StaffShortcut from './components/StaffShortcut'
import { PageLoader } from './components/ui'
import { SettingsProvider, ToastProvider } from './context/AppContext'
import { AdminAuthProvider, CustomerAuthProvider } from './context/AuthContext'
import AdminLayout, { RequirePermission } from './layouts/AdminLayout'
import CustomerLayout from './layouts/CustomerLayout'

// Public
const Landing = lazy(() => import('./pages/public/Landing'))
const CustomerLogin = lazy(() => import('./pages/public/CustomerLogin'))
const Register = lazy(() => import('./pages/public/Register'))
const AdminLogin = lazy(() => import('./pages/public/AdminLogin'))
const NotFound = lazy(() => import('./pages/public/NotFound'))

// Customer portal
const MyDashboard = lazy(() => import('./pages/customer/Dashboard'))
const MyRewards = lazy(() => import('./pages/customer/Rewards'))
const MyPurchases = lazy(() => import('./pages/customer/Purchases'))
const MyProfile = lazy(() => import('./pages/customer/Profile'))

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const Customers = lazy(() => import('./pages/admin/Customers'))
const CustomerForm = lazy(() => import('./pages/admin/CustomerForm'))
const CustomerDetail = lazy(() => import('./pages/admin/CustomerDetail'))
const Purchases = lazy(() => import('./pages/admin/Purchases'))
const PurchaseForm = lazy(() => import('./pages/admin/PurchaseForm'))
const PurchaseDetail = lazy(() => import('./pages/admin/PurchaseDetail'))
const Rewards = lazy(() => import('./pages/admin/Rewards'))
const Claims = lazy(() => import('./pages/admin/Claims'))
const LoyaltyHistory = lazy(() => import('./pages/admin/LoyaltyHistory'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const Staff = lazy(() => import('./pages/admin/Staff'))
const Audit = lazy(() => import('./pages/admin/Audit'))
const ChangePassword = lazy(() => import('./pages/admin/ChangePassword'))

const gate = (perm, el) => <RequirePermission perm={perm}>{el}</RequirePermission>

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SettingsProvider>
          <CustomerAuthProvider>
            <AdminAuthProvider>
              <StaffShortcut />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<CustomerLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin/login" element={<AdminLogin />} />

                  <Route path="/me" element={<CustomerLayout />}>
                    <Route index element={<MyDashboard />} />
                    <Route path="rewards" element={<MyRewards />} />
                    <Route path="purchases" element={<MyPurchases />} />
                    <Route path="profile" element={<MyProfile />} />
                  </Route>

                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={gate('dashboard.view', <AdminDashboard />)} />
                    <Route path="customers" element={gate('customers.view', <Customers />)} />
                    <Route path="customers/new" element={gate('customers.create', <CustomerForm />)} />
                    <Route path="customers/:id" element={gate('customers.view', <CustomerDetail />)} />
                    <Route path="customers/:id/edit" element={gate('customers.edit', <CustomerForm />)} />
                    <Route path="purchases" element={gate('purchases.view', <Purchases />)} />
                    <Route path="purchases/new" element={gate('purchases.create', <PurchaseForm />)} />
                    <Route path="purchases/:id" element={gate('purchases.view', <PurchaseDetail />)} />
                    <Route path="purchases/:id/edit" element={gate('purchases.edit', <PurchaseForm />)} />
                    <Route path="rewards" element={gate('rewards.view', <Rewards />)} />
                    <Route path="claims" element={gate('rewards.view', <Claims />)} />
                    <Route path="loyalty" element={gate('loyalty.view', <LoyaltyHistory />)} />
                    <Route path="reports" element={gate('reports.view', <Reports />)} />
                    <Route path="settings" element={gate('settings.manage', <Settings />)} />
                    <Route path="staff" element={gate('staff.manage', <Staff />)} />
                    <Route path="audit" element={gate('audit.view', <Audit />)} />
                    <Route path="change-password" element={<ChangePassword />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AdminAuthProvider>
          </CustomerAuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
