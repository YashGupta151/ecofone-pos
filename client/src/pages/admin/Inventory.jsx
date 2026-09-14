import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Search, 
  Plus, 
  Filter, 
  Building2, 
  CheckCircle2, 
  Eye, 
  AlertCircle,
  Tag,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getStatusBadge } from '../../utils/formatters';
import IMEILifecycleModal from '../../components/ui/IMEILifecycleModal';

export default function Inventory() {
  const { user, isAdmin } = useAuth();

  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStore, setSelectedStore] = useState(isAdmin ? '' : user?.assigned_store_id || '');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Catalog meta
  const [meta, setMeta] = useState({ brands: [], models: [], grades: [], suppliers: [], stores: [] });

  // Add Phone Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState({
    brand: 'Apple',
    model: 'iPhone 13',
    variant: '128GB',
    ram: '4GB',
    storage: '128GB',
    color: 'Midnight',
    imei1: '',
    imei2: '',
    serial_number: '',
    condition_grade: 'Grade A',
    battery_health: '92%',
    purchase_price: 25000,
    refurbishment_cost: 1500,
    additional_cost: 300,
    selling_price: 39000,
    discount: 0,
    tax_rate: 18.0,
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_period_months: 6,
    current_store_id: user?.assigned_store_id || 1,
    notes: '64-point certified tested'
  });

  // Traceability Modal
  const [activeTraceIMEI, setActiveTraceIMEI] = useState(null);

  // Load Catalog Meta
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await apiFetch('/inventory/meta/catalog');
        if (res.success) setMeta(res);
      } catch (e) {}
    }
    loadMeta();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      let query = `/inventory?page=${page}&limit=20`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedStore) query += `&store_id=${selectedStore}`;
      if (selectedBrand) query += `&brand=${encodeURIComponent(selectedBrand)}`;
      if (selectedGrade) query += `&condition_grade=${encodeURIComponent(selectedGrade)}`;
      if (selectedStatus) query += `&stock_status=${encodeURIComponent(selectedStatus)}`;

      const res = await apiFetch(query);
      if (res.success) {
        setPhones(res.phones || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, selectedStore, selectedBrand, selectedGrade, selectedStatus]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await apiFetch('/inventory', {
        method: 'POST',
        body: JSON.stringify(newPhone)
      });
      if (res.success) {
        setShowAddModal(false);
        fetchInventory();
        alert('Phone added to inventory successfully!');
      } else {
        alert(res.message || 'Failed to add phone.');
      }
    } catch (err) {
      alert(err.message || 'Error occurred while saving device.');
    }
  };

  // Auto-calculate Total Cost = Purchase + Refurb + Additional (Section 12)
  const calcTotalCost = (parseFloat(newPhone.purchase_price) || 0) + (parseFloat(newPhone.refurbishment_cost) || 0) + (parseFloat(newPhone.additional_cost) || 0);

  return (
    <div className="space-y-5">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            Device-Level Smartphone Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual device tracking by unique IMEI 1, IMEI 2, battery health & certified grade
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Refurbished Phone</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search IMEI / Model / ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
          />
        </div>

        {/* Store Filter */}
        {isAdmin && (
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
          >
            <option value="">All 12 Stores</option>
            {meta.stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
        >
          <option value="">All Brands</option>
          {meta.brands.map(b => (
            <option key={b.id} value={b.name}>{b.name}</option>
          ))}
        </select>

        {/* Grade Filter */}
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
        >
          <option value="">All Grades</option>
          {meta.grades.map(g => (
            <option key={g.id} value={g.name}>{g.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="SOLD">SOLD</option>
          <option value="IN_TRANSIT">IN TRANSIT</option>
          <option value="RETURNED">RETURNED</option>
          <option value="DEFECTIVE">DEFECTIVE</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
            <p>Loading device records...</p>
          </div>
        ) : phones.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Smartphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No devices found</p>
            <p className="mt-1">Try adjusting search query or active store filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-4">Device Info</th>
                  <th className="py-3 px-3">Primary IMEI 1</th>
                  <th className="py-3 px-3">Condition & Battery</th>
                  <th className="py-3 px-3">Location / Store</th>
                  <th className="py-3 px-3 text-right">Cost Basis</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {phones.map((phone) => {
                  const badge = getStatusBadge(phone.stock_status);
                  return (
                    <tr key={phone.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {phone.brand} {phone.model}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {phone.variant} {phone.color ? `• ${phone.color}` : ''}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ID: {phone.internal_product_id}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span 
                          onClick={() => setActiveTraceIMEI(phone.imei1)}
                          className="font-mono text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          title="Click to view 360-degree IMEI history"
                        >
                          {phone.imei1}
                        </span>
                        {phone.imei2 && (
                          <span className="font-mono text-[10px] text-slate-400 block">
                            IMEI2: {phone.imei2}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 text-xs block">
                          {phone.condition_grade}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Battery: {phone.battery_health || '90%+'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {phone.store_name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {phone.store_code} ({phone.store_city})
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-slate-500 font-medium">
                        {formatCurrency(phone.total_cost)}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(phone.selling_price)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${badge.bg}`}>
                          {phone.stock_status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setActiveTraceIMEI(phone.imei1)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="View Complete IMEI History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Phone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">Stock Entry — Add Refurbished Phone</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={newPhone.brand}
                    onChange={(e) => setNewPhone({ ...newPhone, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-600 block mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    value={newPhone.model}
                    onChange={(e) => setNewPhone({ ...newPhone, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Variant</label>
                  <input
                    type="text"
                    value={newPhone.variant}
                    onChange={(e) => setNewPhone({ ...newPhone, variant: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Color</label>
                  <input
                    type="text"
                    value={newPhone.color}
                    onChange={(e) => setNewPhone({ ...newPhone, color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Grade</label>
                  <select
                    value={newPhone.condition_grade}
                    onChange={(e) => setNewPhone({ ...newPhone, condition_grade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  >
                    <option value="Like New">Like New</option>
                    <option value="Grade A">Grade A</option>
                    <option value="Grade B">Grade B</option>
                    <option value="Grade C">Grade C</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Battery Health</label>
                  <input
                    type="text"
                    value={newPhone.battery_health}
                    onChange={(e) => setNewPhone({ ...newPhone, battery_health: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  />
                </div>
              </div>

              {/* IMEIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <div>
                  <label className="font-bold text-emerald-900 block mb-1">Primary IMEI 1 (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="15-digit IMEI 1"
                    value={newPhone.imei1}
                    onChange={(e) => setNewPhone({ ...newPhone, imei1: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-emerald-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Secondary IMEI 2 (Optional)</label>
                  <input
                    type="text"
                    placeholder="15-digit IMEI 2"
                    value={newPhone.imei2}
                    onChange={(e) => setNewPhone({ ...newPhone, imei2: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Financial Cost Calculation (Rule 8) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block uppercase text-[10px]">Cost Structure</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={newPhone.purchase_price}
                      onChange={(e) => setNewPhone({ ...newPhone, purchase_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Refurb Cost (₹)</label>
                    <input
                      type="number"
                      value={newPhone.refurbishment_cost}
                      onChange={(e) => setNewPhone({ ...newPhone, refurbishment_cost: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Other Costs (₹)</label>
                    <input
                      type="number"
                      value={newPhone.additional_cost}
                      onChange={(e) => setNewPhone({ ...newPhone, additional_cost: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border rounded"
                    />
                  </div>
                </div>
                <div className="text-right pt-1 font-bold text-emerald-800">
                  Total Calculated Cost: {formatCurrency(calcTotalCost)}
                </div>
              </div>

              {/* Selling Price & Store */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newPhone.selling_price}
                    onChange={(e) => setNewPhone({ ...newPhone, selling_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Assign to Store *</label>
                  <select
                    value={newPhone.current_store_id}
                    onChange={(e) => setNewPhone({ ...newPhone, current_store_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
                  >
                    {meta.stores.map(s => (
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
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMEI Traceability Modal */}
      {activeTraceIMEI && (
        <IMEILifecycleModal
          imei={activeTraceIMEI}
          onClose={() => setActiveTraceIMEI(null)}
        />
      )}

    </div>
  );
}
