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
  Receipt,
  ArrowLeftRight,
  RefreshCw,
  Check
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
    gstin: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: ''
  });

  // Exchange / Trade-In State
  const [hasExchange, setHasExchange] = useState(false);
  const [exchangeDevice, setExchangeDevice] = useState({
    brand: 'Apple',
    model: '',
    variant: '',
    color: '',
    imei1: '',
    imei2: '',
    serial_number: '',
    condition_grade: 'Grade B',
    battery_health: '',
    device_condition: '',
    functional_issues: '',
    accessories_included: ['Box'],
    exchange_value: '',
    customer_id_proof_type: 'Aadhaar',
    customer_id_proof_number: '',
    notes: ''
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Processing & Completed Invoice State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // System GST Tax Rate from Company Settings (initialized from persistent cache)
  const [systemTaxRate, setSystemTaxRate] = useState(() => {
    try {
      const saved = localStorage.getItem('ecofone_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.default_tax_rate !== undefined && parsed.default_tax_rate !== '') {
          const rate = parseFloat(parsed.default_tax_rate);
          if (!isNaN(rate)) return rate;
        }
      }
    } catch (e) {}
    return 5.0;
  });

  // Load stores & system settings on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [storesRes, settingsRes] = await Promise.all([
          apiFetch('/stores'),
          apiFetch('/settings')
        ]);

        if (storesRes.success && storesRes.stores) {
          setStores(storesRes.stores);
          if (!isAdmin && user?.assigned_store_id) {
            setSelectedStoreId(user.assigned_store_id);
          }
        }

        if (settingsRes && settingsRes.success) {
          if (settingsRes.settings && settingsRes.settings.default_tax_rate !== undefined && settingsRes.settings.default_tax_rate !== '') {
            const parsedRate = parseFloat(settingsRes.settings.default_tax_rate);
            if (!isNaN(parsedRate)) {
              setSystemTaxRate(parsedRate);
              try {
                const current = JSON.parse(localStorage.getItem('ecofone_settings') || '{}');
                current.default_tax_rate = String(parsedRate);
                localStorage.setItem('ecofone_settings', JSON.stringify(current));
              } catch (e) {}
            }
          } else {
            // If server settings are empty, sync cached settings to server
            try {
              const saved = localStorage.getItem('ecofone_settings');
              if (saved) {
                apiFetch('/settings', {
                  method: 'PUT',
                  body: JSON.stringify({ settings: JSON.parse(saved) })
                }).catch(() => {});
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        console.error('Failed to load stores or settings:', e);
      }
    }
    loadInitialData();
  }, [isAdmin, user]);

  // Keep cart items' tax_rate synchronized with systemTaxRate from Company Settings
  useEffect(() => {
    setCart(prevCart => {
      if (!prevCart || !prevCart.length) return prevCart;
      return prevCart.map(item => ({
        ...item,
        tax_rate: systemTaxRate
      }));
    });
  }, [systemTaxRate]);

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
      selling_price: parseFloat(phone.selling_price) || 0,
      purchase_price: parseFloat(phone.purchase_price !== undefined && phone.purchase_price !== null && parseFloat(phone.purchase_price) > 0 ? phone.purchase_price : (phone.total_cost || 0)),
      discount_mode: 'percent',
      discount_value: '',
      discount: 0,
      tax_rate: systemTaxRate
    }]);
    setError('');
  };

  const removeFromCart = (phoneId) => {
    setCart(cart.filter(item => item.id !== phoneId));
  };

  // Item-level discount updater (applied on item total after GST)
  const updateItemDiscount = (phoneId, val, mode) => {
    setCart(cart.map(item => {
      if (item.id === phoneId) {
        const itemMode = mode !== undefined ? mode : (item.discount_mode || 'percent');
        const rawVal = val !== undefined ? val : (item.discount_value || '');
        const numVal = parseFloat(rawVal) || 0;

        // Calculate item gross total with GST so discount applies on the total amount after GST
        const sPrice = parseFloat(item.selling_price) || 0;
        const pPrice = parseFloat(item.purchase_price !== undefined && item.purchase_price !== null && parseFloat(item.purchase_price) > 0
          ? item.purchase_price
          : (item.total_cost || 0));
        const diff = Math.max(0, sPrice - pPrice);
        const tRate = (item.tax_rate !== undefined && item.tax_rate !== null && !isNaN(parseFloat(item.tax_rate)))
          ? parseFloat(item.tax_rate)
          : systemTaxRate;
        const itemTax = Math.round((diff * (tRate / 100)) * 100) / 100;
        const grossTotalWithTax = sPrice + itemTax;

        let rupeeDiscount = 0;
        if (itemMode === 'percent') {
          const clampedPercent = Math.min(100, Math.max(0, numVal));
          rupeeDiscount = Math.round(((grossTotalWithTax * clampedPercent) / 100) * 100) / 100;
        } else {
          rupeeDiscount = Math.min(grossTotalWithTax, Math.max(0, numVal));
        }

        return {
          ...item,
          discount_mode: itemMode,
          discount_value: rawVal,
          discount: rupeeDiscount
        };
      }
      return item;
    }));
  };

  const updateDiscount = (phoneId, discount) => {
    updateItemDiscount(phoneId, discount, 'fixed');
  };

  // Calculate totals strictly using Margin Scheme (5% GST on Difference = Selling Price - Purchase Price, and discount applied after GST)
  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.selling_price) || 0), 0);

  // Compute item margins and GST on margin difference, then apply discount on total amount
  const cartWithMargin = cart.map(item => {
    const sPrice = parseFloat(item.selling_price) || 0;
    const pPrice = parseFloat(item.purchase_price !== undefined && item.purchase_price !== null && parseFloat(item.purchase_price) > 0
      ? item.purchase_price
      : (item.total_cost || 0));
    // Difference is strictly Selling Price - Purchase Price
    const difference = Math.max(0, sPrice - pPrice);
    const tRate = (item.tax_rate !== undefined && item.tax_rate !== null && !isNaN(parseFloat(item.tax_rate)))
      ? parseFloat(item.tax_rate)
      : systemTaxRate;
    const itemTax = Math.round((difference * (tRate / 100)) * 100) / 100;
    const grossPriceWithTax = sPrice + itemTax;
    const disc = Math.min(grossPriceWithTax, parseFloat(item.discount) || 0);
    const finalPrice = Math.max(0, grossPriceWithTax - disc);
    return {
      ...item,
      sPrice,
      pPrice,
      difference,
      tRate,
      itemTax,
      grossPriceWithTax,
      disc,
      finalPrice
    };
  });

  const totalDifference = cartWithMargin.reduce((acc, item) => acc + item.difference, 0);
  const totalTax = cartWithMargin.reduce((acc, item) => acc + item.itemTax, 0);
  const totalGrossWithTax = subtotal + totalTax;
  const totalDiscount = cartWithMargin.reduce((acc, item) => acc + item.disc, 0);
  const overallDiscountPercent = totalGrossWithTax > 0 ? ((totalDiscount / totalGrossWithTax) * 100) : 0;
  const grandTotal = Math.max(0, totalGrossWithTax - totalDiscount);

  // Exchange Valuation & Net Amount Payable
  const exchangeValueNum = hasExchange ? Math.max(0, parseFloat(exchangeDevice.exchange_value) || 0) : 0;
  const netPayable = Math.max(0, grandTotal - exchangeValueNum);

  // Complete Sale Execution
  const handleCompleteSale = async () => {
    setError('');

    if (!customer.full_name.trim() || !customer.phone.trim()) {
      setError('Please provide customer name and phone number.');
      return;
    }

    const cleanPhone = customer.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Customer phone number must be exactly 10 digits.');
      return;
    }

    if (!cart.length) {
      setError('Cart is empty. Please select at least one smartphone.');
      return;
    }

    if (hasExchange) {
      if (!exchangeDevice.brand.trim() || !exchangeDevice.model.trim()) {
        setError('Please provide the Brand and Model of the exchanged device.');
        return;
      }
      if (!exchangeDevice.imei1.trim() || exchangeDevice.imei1.trim().length < 8) {
        setError('Please provide a valid Primary IMEI (min 8 characters) for the exchanged device.');
        return;
      }
      if (exchangeDevice.customer_id_proof_number) {
        const cleanIdProof = exchangeDevice.customer_id_proof_number.replace(/\D/g, '');
        if (cleanIdProof.length !== 12) {
          setError('Customer ID proof number must be exactly 12 digits.');
          return;
        }
      }
      if (exchangeValueNum <= 0) {
        setError('Please enter an Agreed Exchange Value (valuation) greater than 0.');
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        store_id: selectedStoreId,
        customer: {
          ...customer,
          id_proof_type: exchangeDevice.customer_id_proof_type || customer.id_proof_type,
          id_proof_number: exchangeDevice.customer_id_proof_number || customer.id_proof_number
        },
        items: cart.map(item => ({
          phone_id: item.id,
          selling_price: item.selling_price,
          discount: item.discount,
          tax_rate: (item.tax_rate !== undefined && item.tax_rate !== null && !isNaN(parseFloat(item.tax_rate)))
            ? parseFloat(item.tax_rate)
            : systemTaxRate
        })),
        exchange_device: hasExchange ? {
          ...exchangeDevice,
          exchange_value: exchangeValueNum
        } : null,
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
        setHasExchange(false);
        setExchangeDevice({
          brand: 'Apple',
          model: '',
          variant: '',
          color: '',
          imei1: '',
          imei2: '',
          serial_number: '',
          condition_grade: 'Grade B',
          battery_health: '',
          device_condition: '',
          functional_issues: '',
          accessories_included: ['Box'],
          exchange_value: '',
          customer_id_proof_type: 'Aadhaar',
          customer_id_proof_number: '',
          notes: ''
        });
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
                  maxLength={10}
                  placeholder="10-digit Phone No *"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium font-mono"
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
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cartWithMargin.map((item) => {
                  const itemSellingPrice = item.sPrice;
                  const itemGrossPriceWithTax = item.grossPriceWithTax;
                  const itemDiscount = item.disc;
                  const itemPercent = itemGrossPriceWithTax > 0 ? ((itemDiscount / itemGrossPriceWithTax) * 100) : 0;
                  const itemDifference = item.difference;
                  const itemTax = item.itemTax;
                  const itemFinalPrice = item.finalPrice;
                  const itemTaxRate = item.tRate;

                  return (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{item.brand} {item.model}</div>
                          <div className="text-[11px] text-slate-500">{item.variant} {item.color ? `• ${item.color}` : ''}</div>
                          <div className="font-mono text-[10px] text-emerald-700 font-medium">IMEI: {item.imei1}</div>
                          <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold px-1.5 py-0.5 rounded text-[9px]">
                              Diff: {formatCurrency(itemDifference)}
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              GST ({itemTaxRate}%): <strong className="text-slate-800">+{formatCurrency(itemTax)}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            {itemDiscount > 0 ? (
                              <div>
                                <span className="line-through text-slate-400 text-[10px] block">
                                  {formatCurrency(itemGrossPriceWithTax)}
                                </span>
                                <span className="font-extrabold text-emerald-700 text-xs block">
                                  {formatCurrency(itemFinalPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-extrabold text-slate-900 text-xs block">
                                {formatCurrency(itemFinalPrice)}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 block font-normal">(incl. 5% GST)</span>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-200/50 transition"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Discount Control Section */}
                      <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Discount:</span>
                            {/* Toggle % vs ₹ */}
                            <div className="inline-flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => updateItemDiscount(item.id, item.discount_value, 'percent')}
                                className={`px-2 py-0.5 rounded transition ${item.discount_mode === 'percent' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                              >
                                %
                              </button>
                              <button
                                type="button"
                                onClick={() => updateItemDiscount(item.id, item.discount_value, 'fixed')}
                                className={`px-2 py-0.5 rounded transition ${item.discount_mode === 'fixed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                              >
                                ₹
                              </button>
                            </div>
                          </div>

                          {/* Discount Input */}
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              min="0"
                              max={item.discount_mode === 'percent' ? 100 : itemGrossPriceWithTax}
                              value={item.discount_value !== undefined ? item.discount_value : (item.discount || '')}
                              onChange={(e) => updateItemDiscount(item.id, e.target.value, item.discount_mode)}
                              placeholder="0"
                              className="w-20 pl-2 pr-5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-right font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                            <span className="absolute right-2 text-[10px] font-bold text-slate-400 pointer-events-none">
                              {item.discount_mode === 'percent' ? '%' : '₹'}
                            </span>
                          </div>
                        </div>

                        {/* Quick discount presets & badge */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[9px]">Quick:</span>
                            {item.discount_mode === 'percent' ? (
                              [5, 10, 15].map(pct => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => updateItemDiscount(item.id, pct.toString(), 'percent')}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition ${
                                    item.discount_value === pct.toString() && item.discount_mode === 'percent'
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))
                            ) : (
                              [500, 1000, 2000].map(amt => (
                                <button
                                  key={amt}
                                  type="button"
                                  onClick={() => updateItemDiscount(item.id, amt.toString(), 'fixed')}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition ${
                                    item.discount_value === amt.toString() && item.discount_mode === 'fixed'
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                                  }`}
                                >
                                  ₹{amt}
                                </button>
                              ))
                            )}
                            {(item.discount > 0 || item.discount_value) && (
                              <button
                                type="button"
                                onClick={() => updateItemDiscount(item.id, '', item.discount_mode)}
                                className="text-[9px] text-rose-500 hover:text-rose-700 font-semibold px-1"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {itemDiscount > 0 && (
                            <span className="text-[10px] font-bold text-rose-600">
                              Saved: -{formatCurrency(itemDiscount)} ({itemPercent.toFixed(1).replace(/\.0$/, '')}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Device Exchange / Trade-in Section */}
            <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
              hasExchange 
                ? 'bg-amber-50/40 border-amber-300 shadow-xs' 
                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
            }`}>
              {/* Header Toggle */}
              <div 
                onClick={() => setHasExchange(!hasExchange)}
                className="p-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                    hasExchange ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Exchange / Trade-In Old Phone</span>
                      {hasExchange && exchangeValueNum > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          -{formatCurrency(exchangeValueNum)}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {hasExchange ? 'Trade-in details active • Value will be credited against total' : 'Customer exchanging an old device? Click to add trade-in details'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={hasExchange}
                    onChange={(e) => setHasExchange(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Form Body when Active */}
              {hasExchange && (
                <div className="p-3 pt-0 border-t border-amber-200/80 space-y-2.5 text-xs animate-in fade-in duration-150">
                  
                  {/* Brand Quick Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Device Brand *
                    </label>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'Google', 'Other'].map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setExchangeDevice(prev => ({ ...prev, brand: b }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                            exchangeDevice.brand === b
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    {exchangeDevice.brand === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter brand name..."
                        value={exchangeDevice.brand === 'Other' ? '' : exchangeDevice.brand}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mt-1"
                      />
                    )}
                  </div>

                  {/* Model & Variant / Color */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Model Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. iPhone 11 / Galaxy S21"
                        value={exchangeDevice.model}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, model: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Storage / Variant
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 128GB / 8GB RAM"
                        value={exchangeDevice.variant}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, variant: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* IMEI 1 & Color */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Primary IMEI 1 *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={18}
                        placeholder="15-digit IMEI 1"
                        value={exchangeDevice.imei1}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, imei1: e.target.value.replace(/\D/g, '') }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono tracking-wider"
                      />
                      {exchangeDevice.imei1 && exchangeDevice.imei1.length === 15 && (
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                          ✓ Valid 15-digit IMEI
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Black, Midnight"
                        value={exchangeDevice.color}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Condition Grade & Battery Health */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Condition Grade
                      </label>
                      <select
                        value={exchangeDevice.condition_grade}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, condition_grade: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Grade A">Grade A (Like New / Flawless)</option>
                        <option value="Grade B">Grade B (Minor Scratches)</option>
                        <option value="Grade C">Grade C (Heavy Scratches / Dents)</option>
                        <option value="Defective">Defective / Minor Fault</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Battery Health (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="e.g. 86"
                        value={exchangeDevice.battery_health}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, battery_health: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Included Accessories Checkboxes */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Accessories Handed Over
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Original Box', 'Original Charger', 'Data Cable', 'Purchase Bill / Receipt'].map(acc => {
                        const isChecked = exchangeDevice.accessories_included.includes(acc);
                        return (
                          <button
                            key={acc}
                            type="button"
                            onClick={() => {
                              setExchangeDevice(prev => ({
                                ...prev,
                                accessories_included: isChecked
                                  ? prev.accessories_included.filter(a => a !== acc)
                                  : [...prev.accessories_included, acc]
                              }));
                            }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition ${
                              isChecked
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}{acc}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer KYC ID Proof */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Customer ID Proof
                      </label>
                      <select
                        value={exchangeDevice.customer_id_proof_type}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, customer_id_proof_type: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Voter ID">Voter ID</option>
                        <option value="Passport">Passport</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        ID Proof Number (12 Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="12-digit ID number"
                        value={exchangeDevice.customer_id_proof_number}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, customer_id_proof_number: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Agreed Exchange Valuation (₹) */}
                  <div className="pt-2 border-t border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-amber-950">
                        Agreed Exchange Value / Credit (₹) *
                      </label>
                      <span className="text-[10px] font-bold text-emerald-700">
                        Deducts from bill total
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={exchangeDevice.exchange_value}
                        onChange={(e) => setExchangeDevice(prev => ({ ...prev, exchange_value: e.target.value }))}
                        className="w-full pl-7 pr-3 py-2 text-sm font-bold text-emerald-800 bg-white border-2 border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500"
                      />
                    </div>
                    {/* Presets */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {[3000, 5000, 8000, 10000, 15000, 20000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setExchangeDevice(prev => ({ ...prev, exchange_value: String(val) }))}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 hover:border-amber-400 text-slate-700 transition"
                        >
                          ₹{val.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Items):</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxable Margin (Difference):</span>
                <span className="font-medium text-emerald-800">{formatCurrency(totalDifference)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST ({systemTaxRate}% on Difference):</span>
                <span className="font-bold text-emerald-700">+{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-100">
                <span>Total (Items + GST):</span>
                <span>{formatCurrency(totalGrossWithTax)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>
                    Discount Applied on Total {overallDiscountPercent > 0 ? `(${overallDiscountPercent.toFixed(1).replace(/\.0$/, '')}%)` : ''}:
                  </span>
                  <span className="font-bold">-{formatCurrency(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Bill Grand Total:</span>
                <span className="text-slate-900">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Exchange Deduction line */}
              {hasExchange && exchangeValueNum > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold pt-1.5 border-t border-dashed border-slate-200">
                  <span>Exchange Credit ({exchangeDevice.brand} {exchangeDevice.model}):</span>
                  <span>-{formatCurrency(exchangeValueNum)}</span>
                </div>
              )}

              {/* Net Payable line */}
              <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t-2 border-slate-900">
                <span>Net Payable:</span>
                <span className="text-emerald-700">{formatCurrency(netPayable)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Payment Method (for {formatCurrency(netPayable)})
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
                  <span>Complete Sale & Generate Bill ({formatCurrency(netPayable)})</span>
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
