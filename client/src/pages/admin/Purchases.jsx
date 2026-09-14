import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Building2, Package, Smartphone, Calendar, FileText, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function Purchases() {
  const [suppliers, setSuppliers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [purchaseData, setPurchaseData] = useState({
    supplier_id: '',
    store_id: 1,
    invoice_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [phones, setPhones] = useState([
    {
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
      refurbishment_cost: 1200,
      additional_cost: 300,
      selling_price: 39000,
      discount: 0,
      tax_rate: 18.0,
      warranty_period_months: 6
    }
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [metaRes, storeRes] = await Promise.all([
          apiFetch('/inventory/meta/catalog'),
          apiFetch('/stores')
        ]);
        if (metaRes.success) {
          setSuppliers(metaRes.suppliers || []);
          if (metaRes.suppliers.length) setPurchaseData(p => ({ ...p, supplier_id: metaRes.suppliers[0].id }));
        }
        if (storeRes.success) setStores(storeRes.stores || []);
      } catch (e) {}
    }
    loadData();
  }, []);

  const addPhoneRow = () => {
    setPhones([
      ...phones,
      {
        brand: 'Apple',
        model: 'iPhone 14',
        variant: '128GB',
        ram: '6GB',
        storage: '128GB',
        color: 'Starlight',
        imei1: '',
        imei2: '',
        serial_number: '',
        condition_grade: 'Grade A',
        battery_health: '95%',
        purchase_price: 32000,
        refurbishment_cost: 1000,
        additional_cost: 300,
        selling_price: 49000,
        discount: 0,
        tax_rate: 18.0,
        warranty_period_months: 6
      }
    ]);
  };

  const removeRow = (index) => {
    if (phones.length <= 1) return;
    setPhones(phones.filter((_, i) => i !== index));
  };

  const updatePhoneField = (index, field, val) => {
    const updated = [...phones];
    updated[index][field] = val;
    setPhones(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save each phone into inventory
      for (const ph of phones) {
        if (!ph.imei1.trim()) {
          alert('Every device must have an IMEI 1.');
          setLoading(false);
          return;
        }

        await apiFetch('/inventory', {
          method: 'POST',
          body: JSON.stringify({
            ...ph,
            supplier_id: purchaseData.supplier_id,
            purchase_date: purchaseData.purchase_date,
            current_store_id: purchaseData.store_id,
            notes: `Purchase Batch ${purchaseData.invoice_number} - ${purchaseData.notes}`
          })
        });
      }

      alert(`Successfully added ${phones.length} devices to inventory!`);
      // Reset form
      setPhones([
        {
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
          refurbishment_cost: 1200,
          additional_cost: 300,
          selling_price: 39000,
          discount: 0,
          tax_rate: 18.0,
          warranty_period_months: 6
        }
      ]);
    } catch (err) {
      alert(err.message || 'Error occurred while saving batch stock.');
    } finally {
      setLoading(false);
    }
  };

  const totalBatchCost = phones.reduce((acc, p) => acc + ((parseFloat(p.purchase_price) || 0) + (parseFloat(p.refurbishment_cost) || 0) + (parseFloat(p.additional_cost) || 0)), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            Stock Inward & Purchase Entry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log supplier purchases of refurbished smartphones with automated cost aggregation & IMEI assignment
          </p>
        </div>
      </div>

      {/* Batch Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier & Store Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Wholesale Supplier *</label>
            <select
              value={purchaseData.supplier_id}
              onChange={(e) => setPurchaseData({ ...purchaseData, supplier_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-medium"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Receiving Branch Store *</label>
            <select
              value={purchaseData.store_id}
              onChange={(e) => setPurchaseData({ ...purchaseData, store_id: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-lg font-medium"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Supplier Invoice Number</label>
            <input
              type="text"
              placeholder="e.g. INV-SUPP-8839"
              value={purchaseData.invoice_number}
              onChange={(e) => setPurchaseData({ ...purchaseData, invoice_number: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Purchase Date</label>
            <input
              type="date"
              value={purchaseData.purchase_date}
              onChange={(e) => setPurchaseData({ ...purchaseData, purchase_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border rounded-lg"
            />
          </div>
        </div>

        {/* Devices In Batch */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Devices In This Inward Batch ({phones.length})
            </span>
            <button
              type="button"
              onClick={addPhoneRow}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition"
            >
              + Add Another Device
            </button>
          </div>

          <div className="space-y-3">
            {phones.map((phone, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-800">Device #{idx + 1}</span>
                  {phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Brand</label>
                    <input
                      type="text"
                      value={phone.brand}
                      onChange={(e) => updatePhoneField(idx, 'brand', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Model</label>
                    <input
                      type="text"
                      value={phone.model}
                      onChange={(e) => updatePhoneField(idx, 'model', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Variant</label>
                    <input
                      type="text"
                      value={phone.variant}
                      onChange={(e) => updatePhoneField(idx, 'variant', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Grade</label>
                    <select
                      value={phone.condition_grade}
                      onChange={(e) => updatePhoneField(idx, 'condition_grade', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded"
                    >
                      <option value="Like New">Like New</option>
                      <option value="Grade A">Grade A</option>
                      <option value="Grade B">Grade B</option>
                      <option value="Grade C">Grade C</option>
                      <option value="Fair">Fair</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100">
                  <div>
                    <label className="text-emerald-900 font-bold block mb-0.5">Primary IMEI 1 *</label>
                    <input
                      type="text"
                      required
                      placeholder="15-digit unique IMEI"
                      value={phone.imei1}
                      onChange={(e) => updatePhoneField(idx, 'imei1', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded font-mono font-bold text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Secondary IMEI 2</label>
                    <input
                      type="text"
                      placeholder="Optional second IMEI"
                      value={phone.imei2}
                      onChange={(e) => updatePhoneField(idx, 'imei2', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="text-slate-500 block mb-0.5">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={phone.purchase_price}
                      onChange={(e) => updatePhoneField(idx, 'purchase_price', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Refurb Cost (₹)</label>
                    <input
                      type="number"
                      value={phone.refurbishment_cost}
                      onChange={(e) => updatePhoneField(idx, 'refurbishment_cost', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={phone.selling_price}
                      onChange={(e) => updatePhoneField(idx, 'selling_price', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block mb-0.5">Battery Health</label>
                    <input
                      type="text"
                      value={phone.battery_health}
                      onChange={(e) => updatePhoneField(idx, 'battery_health', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              Total Inward Value: <strong className="text-slate-900 text-sm font-extrabold">{formatCurrency(totalBatchCost)}</strong>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              {loading ? 'Adding Stock...' : `Complete Batch Inward (${phones.length} Phones)`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
