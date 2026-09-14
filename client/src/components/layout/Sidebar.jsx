import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Store,
  Users,
  Smartphone,
  Truck,
  ArrowLeftRight,
  ReceiptText,
  FileSpreadsheet,
  RotateCcw,
  ShieldAlert,
  Wallet,
  TrendingUp,
  BarChart3,
  History,
  Settings,
  LogOut,
  UserCheck,
  ShoppingBag
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout, isAdmin } = useAuth();

  // Admin Nav items according to Section 28
  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Stores (12)', path: '/admin/stores', icon: Store },
    { label: 'Employees', path: '/admin/employees', icon: Users },
    { label: 'Inventory (IMEI)', path: '/admin/inventory', icon: Smartphone },
    { label: 'Stock Entry', path: '/admin/purchases', icon: Truck },
    { label: 'Stock Transfers', path: '/admin/transfers', icon: ArrowLeftRight },
    { label: 'POS / New Sale', path: '/admin/pos', icon: ShoppingBag, highlight: true },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Invoices & Bills', path: '/admin/invoices', icon: ReceiptText },
    { label: 'Returns & Refunds', path: '/admin/returns', icon: RotateCcw },
    { label: 'Warranty Check', path: '/admin/warranties', icon: ShieldAlert },
    { label: 'Expenses', path: '/admin/expenses', icon: Wallet },
    { label: 'Profit & Loss', path: '/admin/profit-loss', icon: TrendingUp },
    { label: 'Business Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { label: 'Company Settings', path: '/admin/settings', icon: Settings },
  ];

  // Employee Nav items according to Section 29
  const employeeNav = [
    { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { label: 'POS / New Sale', path: '/employee/pos', icon: ShoppingBag, highlight: true },
    { label: 'Store Inventory', path: '/employee/inventory', icon: Smartphone },
    { label: 'Customers', path: '/employee/customers', icon: Users },
    { label: 'Sales History', path: '/employee/sales', icon: FileSpreadsheet },
    { label: 'Invoices & Bills', path: '/employee/invoices', icon: ReceiptText },
    { label: 'Returns', path: '/employee/returns', icon: RotateCcw },
    { label: 'Warranty Check', path: '/employee/warranty', icon: ShieldAlert },
    { label: 'My Profile', path: '/employee/profile', icon: UserCheck },
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0">
            <img 
              src="/logo.png" 
              alt="Ecofone Logo" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=EF'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">EcoFone</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">POS</span>
            </div>
            <p className="text-[11px] text-amber-400 font-medium tracking-wide">Luxury within reach</p>
          </div>
        </div>

        {/* Current User Pill */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <div className="text-xs truncate font-medium text-slate-300">
              {isAdmin ? 'Super Admin / CEO' : user?.store_code || 'Store Employee'}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            {isAdmin ? 'All 12 Outlets Connected' : user?.store_name}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                  ${item.highlight ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-xs hover:from-emerald-500 hover:to-teal-500' : ''}
                  ${!item.highlight && isActive 
                    ? 'bg-slate-800 text-emerald-400 font-semibold border-l-2 border-emerald-500' 
                    : !item.highlight && 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'}
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-white' : ''}`} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
