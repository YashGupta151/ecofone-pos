import React, { useState } from 'react';
import { User, Lock, Building2, Phone, Mail, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (res.success) {
        setMessage('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          Employee Profile & Security
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Account credentials, branch store assignment, and password configuration
        </p>
      </div>

      {/* Profile Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-4 border-b pb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-lg border border-emerald-200">
            {user?.full_name ? user.full_name[0] : 'E'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-slate-500 font-mono text-[11px] mt-0.5">{user?.employee_id} • @{user?.username}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {user?.role === 'admin' ? 'Super Administrator' : 'Store Associate'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Assigned Store</span>
            <span className="font-bold text-slate-900 text-xs mt-0.5 block">{user?.store_name || 'All Stores (Admin)'}</span>
            <span className="text-slate-500 text-[11px]">{user?.store_code ? `${user.store_code} • ${user.store_city}` : 'Headquarters'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Email & Phone</span>
            <span className="font-medium text-slate-800 text-xs mt-0.5 block">{user?.email || 'N/A'}</span>
            <span className="text-slate-500 text-[11px]">{user?.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b pb-3">
          <Lock className="w-4 h-4 text-emerald-600" />
          Update Security Password
        </h3>

        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="font-bold text-slate-600 block mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">New Password (min 6 characters) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
