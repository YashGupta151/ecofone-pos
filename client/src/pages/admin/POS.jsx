import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  CreditCard, 
  CheckCircle, 
  UserPlus, 
  User, 
  Percent, 
  Smartphone, 
  Plus, 
  AlertCircle,
  Building2,
  Receipt
} from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import InvoiceModal from '../../components/invoice/InvoiceModal';

export default function POS() {
  const { user, isAdmin } = useAuth();

  // Stores list for admin selector
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState(user?.assigned_store_id || 1);

  // Search & Available Phones
  const [searchTerm, setSearchTerm] = useState('');
  const [availablePhones, setAvailablePhones] = useState([]);
  const [searching, setSearching] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);

  // Customer
  const [customerMode, setCustomerMode] = useState('new'); // 'new' | 'existing'
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customer, setCustomer] = useState({
    id: null,
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: ''
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Processing & Completed Invoice State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Load stores on mount
  useEffect(() => {
    async function loadStores() {
      try {
        const res = await apiFetch('/stores');
        if (res.success && res.stores) {
          setStores(res.stores);
          if (!isAdmin && user?.assigned_store_id) {
            setSelectedStoreId(user.assigned_store_id);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadStores();
  }, [isAdmin, user]);

  // Search available phones in selected store
  const searchInventory = async () => {
    setSearching(true);
    setError('');
    try {
      const res = await apiFetch(`/inventory?store_id=${selectedStoreId}&stock_status=AVAILABLE&search=${encodeURIComponent(searchTerm)}&limit=15`);
      if (res.success) {
        setAvailablePhones(res.phones || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to search store inventory.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    searchInventory();
  }, [selectedStoreId]);

  // Handle customer search
  useEffect(() => {
    if (!customerSearch.trim()) return;
    const delay = setTimeout(async () => {
      try {
        const res = await apiFetch(`/customers?search=${encodeURIComponent(customerSearch)}&limit=5`);
        if (res.success) setExistingCustomers(res.customers || []);
      } catch (e) {}
    }, 300);
    return () => clearTimeout(delay);
  }, [customerSearch]);

  const selectExistingCustomer = (c) => {
    setCustomer({
      id: c.id,
      full_name: c.full_name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || '',
      gstin: c.gstin || ''
    });
    setCustomerMode('existing');
  };

  // Add phone to cart
  const addToCart = (phone) => {
    if (cart.find(item => item.id === phone.id)) {
      setError(`Device (IMEI: ${phone.imei1}) is already in cart.`);
      return;
    }

    setCart([...cart, {
      ...phone,
      selling_price: phone.selling_price,
      discount: 0
    }]);
    setError('');
  };

  const removeFromCart = (phoneId) => {
    setCart(cart.filter(item => item.id !== phoneId));
  };

  const updateDiscount = (phoneId, discount) => {
    setCart(cart.map(item => {
      if (item.id === phoneId) {
        return { ...item, discount: Math.max(0, parseFloat(discount || 0)) };
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.selling_price) || 0), 0);
  const totalDiscount = cart.reduce((acc, item) => acc + (parseFloat(item.discount) || 0), 0);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const totalTax = Math.round((taxableAmount * 0.18) * 100) / 100; // Standard 18% GST
  const grandTotal = taxableAmount + totalTax;

  // Complete Sale Execution
  const handleCompleteSale = async () => {
    setError('');

    if (!customer.full_name.trim() || !customer.phone.trim()) {
      setError('Please provide customer name and phone number.');
      return;
    }

    if (!cart.length) {
      setError('Cart is empty. Please select at least one smartphone.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        store_id: selectedStoreId,
        customer,
        items: cart.map(item => ({
          phone_id: item.id,
          selling_price: item.selling_price,
          discount: item.discount,
          tax_rate: item.tax_rate || 18.0
        })),
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes: saleNotes
      };

      const res = await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.data) {
        // Fetch full invoice details for modal
        const fullInvoiceRes = await apiFetch(`/sales/${res.data.saleId}`);
        if (fullInvoiceRes.success) {
          setCompletedInvoice(fullInvoiceRes);
        }
        // Reset Cart and refresh inventory
        setCart([]);
        searchInventory();
      } else {
        setError(res.message || 'Failed to complete sale.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during billing checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStoreObj = stores.find(s => s.id === parseInt(selectedStoreId)) || { name: 'Store Outlet' };

  return (
    <div className="space-y-4">
      
      {/* Top POS Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Retail Point of Sale (POS)
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Scan or search IMEI • Certified device checkout • Instant GST billing
            </p>
          </div>
        </div>

        {/* Store Selector (Admin can switch between all 12 stores, employee locked to assigned store) */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Store:</span>
          {isAdmin ? (
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              {stores.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              {user?.store_name || 'Assigned Store'}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main POS Split Screen: Left (Device Search) vs Right (Cart & Checkout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 cols): IMEI Search & Store Devices */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* IMEI & Phone Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchInventory()}
                  placeholder="Scan or enter IMEI / Brand / Model / Serial Number..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={searchInventory}
                disabled={searching}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Available Devices Grid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Available In Store ({availablePhones.length})
              </span>
              <span className="text-[11px] text-slate-400">Click to add to bill</span>
            </div>

            {availablePhones.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Smartphone className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p>No available smartphones found matching query in this store.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {availablePhones.map((phone) => {
                  const inCart = cart.some(item => item.id === phone.id);
                  return (
                    <div
                      key={phone.id}
                      onClick={() => !inCart && addToCart(phone)}
                      className={`
                        p-3.5 rounded-xl border text-left transition relative cursor-pointer
                        ${inCart 
                          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' 
                          : 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300 hover:shadow-xs'}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {phone.condition_grade}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs mt-1 leading-tight">
                            {phone.brand} {phone.model}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {phone.variant} {phone.color ? `• ${phone.color}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 text-xs block">
                            {formatCurrency(phone.selling_price)}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Battery: {phone.battery_health || '90%+'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                          IMEI: {phone.imei1}
                        </span>
                        <span className={`text-[10px] font-bold ${inCart ? 'text-slate-400' : 'text-emerald-600'}`}>
                          {inCart ? 'In Cart' : '+ Add'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5 cols): Cart, Customer Details, Payment & Checkout */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Customer Selection Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Customer Details
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  onClick={() => setCustomerMode('new')}
                  className={`px-2 py-0.5 rounded-md ${customerMode === 'new' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  New
                </button>
                <button
                  onClick={() => setCustomerMode('existing')}
                  className={`px-2 py-0.5 rounded-md ${customerMode === 'existing' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  Lookup
                </button>
              </div>
            </div>

            {customerMode === 'existing' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search existing customer by phone or name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                {existingCustomers.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                    {existingCustomers.map(c => (
                      <div
                        key={c.id}
                        onClick={() => selectExistingCustomer(c)}
                        className="p-2 hover:bg-emerald-50 cursor-pointer flex justify-between"
                      >
                        <span className="font-bold text-slate-800">{c.full_name}</span>
                        <span className="text-slate-500">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Full Name *"
                  value={customer.full_name}
                  onChange={(e) => setCustomer({ ...customer, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  placeholder="Phone Number *"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="email"
                  placeholder="Email Address (optional for digital invoice)"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="City"
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="State (for GST)"
                  value={customer.state}
                  onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Cart Items ({cart.length})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <p>No devices added to cart yet.</p>
                <p className="text-[11px] text-slate-300 mt-0.5">Select devices from the left inventory panel.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{item.brand} {item.model}</div>
                        <div className="font-mono text-[10px] text-emerald-700">IMEI: {item.imei1}</div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">Discount: ₹</span>
                        <input
                          type="number"
                          min="0"
                          value={item.discount || ''}
                          onChange={(e) => updateDiscount(item.id, e.target.value)}
                          placeholder="0"
                          className="w-16 px-1.5 py-0.5 text-[11px] bg-white border border-slate-200 rounded text-right font-medium"
                        />
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.selling_price - (item.discount || 0))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Price Calculations */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span>{formatCurrency(taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18% Included):</span>
                <span>{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {['UPI', 'Card', 'Cash', 'Bank Transfer'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`
                      py-2 px-1 rounded-lg text-center border transition truncate
                      ${paymentMethod === method 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}
                    `}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {['UPI', 'Card', 'Bank Transfer'].includes(paymentMethod) && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Transaction Reference / Auth Code (optional)"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              disabled={submitting || cart.length === 0}
              className={`
                w-full py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 text-white
                ${submitting || cart.length === 0 
                  ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'}
              `}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Sale & Generate Bill ({formatCurrency(grandTotal)})</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* Invoice Modal Popup upon completion */}
      {completedInvoice && (
        <InvoiceModal
          invoiceData={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
          onNewSale={() => {
            setCompletedInvoice(null);
            setCustomer({ id: null, full_name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', gstin: '' });
          }}
        />
      )}

    </div>
  );
}
