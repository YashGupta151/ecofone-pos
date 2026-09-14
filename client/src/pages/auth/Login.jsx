import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Smartphone, Building2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl p-2 mx-auto shadow-2xl flex items-center justify-center border-2 border-emerald-500/20 mb-3">
            <img 
              src="/logo.png" 
              alt="Ecofone" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = 'https://placehold.co/120x120?text=EcoFone'; }}
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">EcoFone</h1>
          <p className="text-sm font-semibold text-amber-400 mt-0.5">Luxury within reach</p>
          <p className="text-xs text-slate-400 mt-1">Multi-Store POS & Business Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">Enter your employee ID or credentials to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Username / Employee ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or emp001"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold tracking-wide shadow-md hover:shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-2 text-center">
              Quick One-Click Demo Logins
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'Admin@123')}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-medium text-left flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">CEO / Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('emp001', 'Emp@123')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-medium text-left flex items-center gap-1.5 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">Store 1 (Mumbai)</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('emp005', 'Emp@123')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-medium text-left flex items-center gap-1.5 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">Store 3 (Delhi)</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('emp009', 'Emp@123')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-medium text-left flex items-center gap-1.5 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="truncate">Store 5 (Bangalore)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Ecofone Retail Operations • Centralized 12-Store POS System
        </p>

      </div>
    </div>
  );
}
