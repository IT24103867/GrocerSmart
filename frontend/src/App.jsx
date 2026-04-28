import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './theme/ThemeProvider';
import { getSystemStatus } from './api/usersApi';
import { getCashierPermissions } from './api/permissionsApi';
import ScrollToTop from './components/ScrollToTop';
import { canAccessModule, normalizeRole } from './utils/roleAccess';

// Layouts
const DashboardLayout = React.lazy(() => import('./layouts/DashboardLayout'));
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Users = React.lazy(() => import('./pages/Users'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Products = React.lazy(() => import('./pages/Products'));
const InventoryConvert = React.lazy(() => import('./pages/InventoryConvert'));
const CreditCustomers = React.lazy(() => import('./pages/CreditCustomers'));
const Cheques = React.lazy(() => import('./pages/Cheques'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const PurchaseOrders = React.lazy(() => import('./pages/PurchaseOrders'));
const PurchaseOrderDetails = React.lazy(() => import('./pages/PurchaseOrderDetails'));
const Trash = React.lazy(() => import('./pages/Trash'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const PermissionSettings = React.lazy(() => import('./pages/PermissionSettings'));

// Guards
const ProtectedRoute = ({ children, roles, moduleKey }) => {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  const role = normalizeRole(localStorage.getItem('role'));
  const permissions = JSON.parse(localStorage.getItem('permissions') || '{}');

  if (!loggedIn) return <Navigate to="/login" replace />;

  // Base role restriction
  if (roles && !roles.map(r => r.toUpperCase()).includes(role?.toUpperCase())) return <Navigate to="/dashboard" replace />;

  // Module restriction for non-admin roles
  if (moduleKey && !canAccessModule({ role, moduleKey, permissions })) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  return loggedIn ? <Navigate to="/dashboard" replace /> : children;
};

// Main App with Initial Loading Logic
function App() {
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await getSystemStatus();
      // Keep status call for health check / first-load verification.
      void response;

      // Fetch permissions if logged in as Cashier
      const loggedIn = localStorage.getItem('loggedIn') === 'true';
      const role = localStorage.getItem('role');
      if (loggedIn && role === 'CASHIER') {
        const permRes = await getCashierPermissions();
        localStorage.setItem('permissions', JSON.stringify(permRes.data?.permissions || {}));
      }
    } catch (e) {
      console.error("Failed to check system status", e);
    } finally {
      setInitLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing System...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <ToastContainer position="top-right" autoClose={3000} />
        <React.Suspense fallback={
          <div className="fixed top-0 left-0 right-0 z-[9999]">
            <div className="h-1 bg-brand-primary/20 w-full overflow-hidden">
               <div className="h-full bg-brand-primary w-1/3 animate-[loading_1.5s_infinite_linear]" style={{
                 transformOrigin: '0% 50%'
               }} />
            </div>
          </div>
        }>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<Home />} />

            {/* Auth Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><Users /></ProtectedRoute>} />
              <Route path="products" element={<ProtectedRoute moduleKey="PRODUCTS"><Products /></ProtectedRoute>} />
              <Route path="inventory/convert" element={<ProtectedRoute moduleKey="INVENTORY_CONVERT"><InventoryConvert /></ProtectedRoute>} />
              <Route path="credit-customers" element={<ProtectedRoute moduleKey="CREDIT_CUSTOMERS"><CreditCustomers /></ProtectedRoute>} />
              <Route path="cheques" element={<ProtectedRoute moduleKey="CHEQUES"><Cheques /></ProtectedRoute>} />
              <Route path="orders" element={<Navigate to="/pos" replace />} />
              <Route path="orders/:id/items" element={<Navigate to="/pos" replace />} />
              <Route path="suppliers" element={<ProtectedRoute moduleKey="SUPPLIERS"><Suppliers /></ProtectedRoute>} />
              <Route path="purchase-orders" element={<ProtectedRoute moduleKey="PURCHASE_ORDERS"><PurchaseOrders /></ProtectedRoute>} />
              <Route path="purchase-orders/:id/items" element={<ProtectedRoute moduleKey="PURCHASE_ORDERS"><PurchaseOrderDetails /></ProtectedRoute>} />
              <Route path="trash" element={<ProtectedRoute moduleKey="TRASH"><Trash /></ProtectedRoute>} />
              <Route path="pos" element={<ProtectedRoute moduleKey="SALES"><Sales /></ProtectedRoute>} />
              <Route path="sales" element={<Navigate to="/pos" replace />} />
              <Route path="reports" element={<ProtectedRoute moduleKey="REPORTS"><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute roles={['ADMIN']}><Settings /></ProtectedRoute>} />
              <Route path="settings/permissions" element={<ProtectedRoute roles={['ADMIN']}><PermissionSettings /></ProtectedRoute>} />
              <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </React.Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
