import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Key, UserCheck, Phone, Mail, Building2, Eye, X } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: 'Emp@123',
    full_name: '',
    phone: '',
    email: '',
    address: '',
    role: 'employee',
    assigned_store_id: 1
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const [empRes, storeRes] = await Promise.all([
        apiFetch('/employees'),
        apiFetch('/stores')
      ]);
      if (empRes.success) setEmployees(empRes.employees || []);
      if (storeRes.success) setStores(storeRes.stores || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/employees', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res.success) {
        setShowAddModal(false);
        fetchEmployees();
        alert('Employee created successfully!');
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await apiFetch(`/employees/${targetUser.id}/reset-password`, {
        method: 'PATCH',
        body: JSON.stringify({ new_password: newPassword })
      });
      if (res.success) {
        setShowResetModal(false);
        alert(`Password for ${targetUser.username} has been reset successfully.`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        emp.username.toLowerCase().includes(search.toLowerCase()) ||
                        emp.employee_id.toLowerCase().includes(search.toLowerCase());
    const matchStore = !selectedStore || emp.assigned_store_id === parseInt(selectedStore);
    return matchSearch && matchStore;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Staff & Employee Management ({employees.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store associates, branch managers, and system administrators across the 12 outlets
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, username, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
        >
          <option value="">All Stores</option>
          {stores.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Username & ID</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Assigned Branch</th>
                <th className="py-3 px-3 text-right">Invoices Billed</th>
                <th className="py-3 px-3 text-right">Revenue Generated</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">{emp.full_name}</div>
                    <div className="text-[11px] text-slate-400">{emp.phone} • {emp.email}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800 font-mono">{emp.username}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{emp.employee_id}</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${emp.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {emp.role === 'admin' ? 'Super Admin' : 'Store Staff'}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-700">
                    {emp.store_name ? (
                      <div>
                        <span>{emp.store_name}</span>
                        <span className="text-[10px] text-slate-400 block">{emp.store_city} ({emp.store_code})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Headquarters</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-semibold text-slate-700">
                    {emp.sales_count || 0}
                  </td>

                  <td className="py-3 px-3 text-right font-extrabold text-emerald-700">
                    {formatCurrency(emp.total_revenue || 0)}
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {emp.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => { setTargetUser(emp); setShowResetModal(true); }}
                      className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Register New Staff Member</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Initial Password *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="employee">Store Employee</option>
                    <option value="admin">Super Admin / CEO</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Assigned Branch *</label>
                  <select
                    value={formData.assigned_store_id}
                    onChange={(e) => setFormData({ ...formData, assigned_store_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Reset Password for {targetUser?.full_name}</h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="font-bold text-slate-600 block mb-1">New Password (min 6 chars)</label>
                <input
                  type="text"
                  required
                  placeholder="New password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
