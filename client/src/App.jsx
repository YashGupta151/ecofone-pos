import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Stores from './pages/admin/Stores';
import Employees from './pages/admin/Employees';
import Inventory from './pages/admin/Inventory';
import Purchases from './pages/admin/Purchases';
import Transfers from './pages/admin/Transfers';
import POS from './pages/admin/POS';
import Customers from './pages/admin/Customers';
import Invoices from './pages/admin/Invoices';
import Returns from './pages/admin/Returns';
import Warranties from './pages/admin/Warranties';
import Expenses from './pages/admin/Expenses';
import ProfitLoss from './pages/admin/ProfitLoss';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';
import ExchangedPhones from './pages/admin/ExchangedPhones';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeProfile from './pages/employee/Profile';

function ProtectedRoute({ children, requireAdmin }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Main Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<RootRedirect />} />

            {/* Admin Routes */}
            <Route path="admin/dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
            <Route path="admin/stores" element={<ProtectedRoute requireAdmin><Stores /></ProtectedRoute>} />
            <Route path="admin/employees" element={<ProtectedRoute requireAdmin><Employees /></ProtectedRoute>} />
            <Route path="admin/inventory" element={<ProtectedRoute requireAdmin><Inventory /></ProtectedRoute>} />
            <Route path="admin/purchases" element={<ProtectedRoute requireAdmin><Purchases /></ProtectedRoute>} />
            <Route path="admin/stock-entry" element={<ProtectedRoute requireAdmin><Purchases /></ProtectedRoute>} />
            <Route path="admin/transfers" element={<ProtectedRoute requireAdmin><Transfers /></ProtectedRoute>} />
            <Route path="admin/pos" element={<ProtectedRoute requireAdmin><POS /></ProtectedRoute>} />
            <Route path="admin/exchanged-phones" element={<ProtectedRoute requireAdmin><ExchangedPhones /></ProtectedRoute>} />
            <Route path="admin/customers" element={<ProtectedRoute requireAdmin><Customers /></ProtectedRoute>} />
            <Route path="admin/invoices" element={<ProtectedRoute requireAdmin><Invoices /></ProtectedRoute>} />
            <Route path="admin/returns" element={<ProtectedRoute requireAdmin><Returns /></ProtectedRoute>} />
            <Route path="admin/warranties" element={<ProtectedRoute requireAdmin><Warranties /></ProtectedRoute>} />
            <Route path="admin/expenses" element={<ProtectedRoute requireAdmin><Expenses /></ProtectedRoute>} />
            <Route path="admin/profit-loss" element={<ProtectedRoute requireAdmin><ProfitLoss /></ProtectedRoute>} />
            <Route path="admin/reports" element={<ProtectedRoute requireAdmin><Reports /></ProtectedRoute>} />
            <Route path="admin/audit-logs" element={<ProtectedRoute requireAdmin><AuditLogs /></ProtectedRoute>} />
            <Route path="admin/settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />

            {/* Employee Routes */}
            <Route path="employee/dashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
            <Route path="employee/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
            <Route path="employee/exchanged-phones" element={<ProtectedRoute><ExchangedPhones /></ProtectedRoute>} />
            <Route path="employee/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="employee/stock-entry" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            <Route path="employee/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
            <Route path="employee/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="employee/sales" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="employee/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="employee/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
            <Route path="employee/warranty" element={<ProtectedRoute><Warranties /></ProtectedRoute>} />
            <Route path="employee/profile" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
