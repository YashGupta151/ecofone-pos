import React, { useState } from 'react';
import { Printer, X, CheckCircle, Smartphone, Building, User, Receipt, Phone, Mail, FileText, Check } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, numberToWordsINR } from '../../utils/formatters';

export default function InvoiceModal({ invoiceData, onClose, onNewSale }) {
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' | 'thermal'

  if (!invoiceData) return null;
  const { sale, items = [], payments = [], exchange, company = {} } = invoiceData;

  // Calculate dynamic GST rates based on actual invoice items/sale values
  const rawItemTax = items[0]?.tax_rate;
  let cachedCompanyTax = null;
  try {
    const saved = localStorage.getItem('ecofone_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.default_tax_rate !== undefined && parsed.default_tax_rate !== '') {
        cachedCompanyTax = parseFloat(parsed.default_tax_rate);
      }
    }
  } catch (e) {}

  const companyTax = (company?.default_tax_rate !== undefined && company?.default_tax_rate !== null)
    ? company.default_tax_rate
    : cachedCompanyTax;

  const totalTaxRate = (sale?.taxable_amount > 0 && typeof sale?.total_tax === 'number')
    ? Math.round(((sale.total_tax / sale.taxable_amount) * 100) * 10) / 10
    : (rawItemTax !== undefined && rawItemTax !== null && !isNaN(parseFloat(rawItemTax))
        ? parseFloat(rawItemTax)
        : (companyTax !== undefined && companyTax !== null && !isNaN(parseFloat(companyTax))
            ? parseFloat(companyTax)
            : 18));
  const halfTaxRate = (totalTaxRate / 2).toFixed(1).replace(/\.0$/, '');
  const fullTaxRate = totalTaxRate.toString().replace(/\.0$/, '');

  const handlePrint = (format) => {
    setPrintFormat(format);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 invoice-modal-backdrop">
      {/* Injected @page dynamic rule for perfect margins */}
      {printFormat === 'a4' ? (
        <style type="text/css" media="print">
          {`@page { size: A4 portrait; margin: 10mm 12mm; }`}
        </style>
      ) : (
        <style type="text/css" media="print">
          {`@page { size: 80mm auto; margin: 3mm 2mm; }`}
        </style>
      )}

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150 invoice-modal-dialog">
        
        {/* Modal Top Bar (Hidden during print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tax Invoice — {sale?.invoice_number}
            </span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              PAID
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition ${
                printFormat === 'a4' 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Invoice</span>
            </button>
            <button
              onClick={() => handlePrint('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                printFormat === 'thermal'
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Thermal (80mm)</span>
            </button>
            {onNewSale && (
              <button
                onClick={onNewSale}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition ml-2"
              >
                + New Sale
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Bill Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 invoice-modal-content">
          
          {/* Printable Invoice Container */}
          <div 
            id="printable-invoice" 
            className={`bg-white mx-auto ${
              printFormat === 'thermal' 
                ? 'thermal-receipt-container max-w-[340px] p-4 border border-slate-300 rounded-xl shadow-xs' 
                : 'a4-invoice-container max-w-3xl p-6 sm:p-8 border border-slate-200 rounded-2xl shadow-xs'
            }`}
          >
            
            {printFormat === 'thermal' ? (
              /* ================= 80mm THERMAL RECEIPT LAYOUT ================= */
              <div className="text-slate-900 font-mono text-[11px] leading-relaxed">
                <div className="text-center pb-2 border-b border-dashed border-slate-400">
                  <div className="font-extrabold text-sm tracking-wider uppercase">{company.company_name || 'ECOFONE'}</div>
                  <div className="text-[10px] text-slate-600">{company.company_tagline || 'Luxury within reach'}</div>
                  <div className="text-[10px] font-semibold mt-1">{sale?.store_name}</div>
                  <div className="text-[9px] text-slate-500">{sale?.store_address}, {sale?.store_city}</div>
                  <div className="text-[9px] font-bold text-slate-700">GSTIN: {sale?.store_gstin || company.company_gstin}</div>
                </div>

                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>INVOICE:</span>
                    <span className="font-bold">{sale?.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{formatDateTime(sale?.sale_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CASHIER:</span>
                    <span>{sale?.employee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CUSTOMER:</span>
                    <span className="font-bold">{sale?.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PHONE:</span>
                    <span>{sale?.customer_phone}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="py-2 border-b border-dashed border-slate-400 space-y-2 text-[10px]">
                  {items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold">{item.brand} {item.model} ({item.variant})</div>
                      <div className="text-[9px] text-slate-600">IMEI: {item.imei1}</div>
                      <div className="flex justify-between">
                        <span>Grade: {item.condition_grade}</span>
                        <span className="font-bold">{formatCurrency(item.final_price)}</span>
                      </div>
                      {item.discount > 0 && (
                        <div className="flex justify-between text-[9px] text-rose-600">
                          <span>Discount ({item.selling_price > 0 ? ((item.discount / item.selling_price) * 100).toFixed(1).replace(/\.0$/, '') : 0}%):</span>
                          <span>-{formatCurrency(item.discount)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Financials */}
                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale?.subtotal)}</span>
                  </div>
                  {sale?.discount_total > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Final Discount {sale?.subtotal > 0 ? `(${((sale.discount_total / sale.subtotal) * 100).toFixed(1).replace(/\.0$/, '')}%)` : ''}:</span>
                      <span>-{formatCurrency(sale?.discount_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Taxable:</span>
                    <span>{formatCurrency(sale?.taxable_amount)}</span>
                  </div>
                  {sale?.cgst > 0 && (
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>CGST ({halfTaxRate}%):</span>
                      <span>{formatCurrency(sale.cgst)}</span>
                    </div>
                  )}
                  {sale?.sgst > 0 && (
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>SGST ({halfTaxRate}%):</span>
                      <span>{formatCurrency(sale.sgst)}</span>
                    </div>
                  )}
                  {sale?.igst > 0 && (
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>IGST ({fullTaxRate}%):</span>
                      <span>{formatCurrency(sale.igst)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-400">
                    <span>{sale?.exchange_amount > 0 ? 'BILL TOTAL:' : 'TOTAL:'}</span>
                    <span>{formatCurrency(sale?.grand_total)}</span>
                  </div>
                  {sale?.exchange_amount > 0 && (
                    <div className="space-y-0.5 pt-0.5 border-t border-dashed border-slate-400">
                      <div className="flex justify-between text-[9px] text-emerald-800 font-bold">
                        <span>EXCHANGE CREDIT:</span>
                        <span>-{formatCurrency(sale.exchange_amount)}</span>
                      </div>
                      {exchange && (
                        <div className="text-[8px] text-slate-500 italic">
                          ({exchange.brand} {exchange.model} • IMEI: {exchange.imei1})
                        </div>
                      )}
                      <div className="flex justify-between font-black text-xs pt-0.5 border-t border-slate-400">
                        <span>NET PAID:</span>
                        <span>{formatCurrency(sale.net_payable !== undefined && sale.net_payable !== null ? sale.net_payable : Math.max(0, sale.grand_total - sale.exchange_amount))}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-[9px] pt-0.5">
                    <span>PAID VIA:</span>
                    <span className="font-bold uppercase">{payments[0]?.payment_method || 'CASH'}</span>
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">6 MONTHS ECOFONE CERTIFIED WARRANTY</p>
                  <p>Original tax invoice required for warranty claims.</p>
                  <p className="pt-1 font-semibold text-slate-800">Thank you for visiting Ecofone!</p>
                  <p className="text-[10px] font-bold">www.ecofone.in</p>
                </div>
              </div>
            ) : (
              /* ================= FULL A4 TAX INVOICE LAYOUT ================= */
              <div className="space-y-4 text-slate-800">
                
                {/* Header: Branding & Store info */}
                <div className="flex items-start justify-between border-b-2 border-slate-300 pb-4 print-avoid-break">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs shrink-0">
                      <img src="/logo.png" alt="Ecofone Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                        {company.company_name || 'Ecofone'}
                      </h1>
                      <p className="text-xs font-bold text-amber-600">
                        {company.company_tagline || 'Luxury within reach'}
                      </p>
                      <p className="text-[11px] text-slate-600 max-w-md mt-0.5 leading-snug">
                        {sale?.store_address ? `${sale.store_address}, ${sale.store_city}` : company.company_address}
                      </p>
                      <p className="text-[11px] text-slate-700 mt-0.5">
                        GSTIN: <span className="font-bold text-slate-900">{sale?.store_gstin || company.company_gstin}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-md text-xs font-black uppercase tracking-wider">
                      TAX INVOICE
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-2">
                      Invoice #: <span className="font-mono text-emerald-800 font-extrabold">{sale?.invoice_number}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Date & Time: <span className="font-medium text-slate-900">{formatDateTime(sale?.sale_date)}</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Store: <span className="font-semibold text-slate-900">{sale?.store_name} ({sale?.store_code})</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Cashier: <span className="font-medium text-slate-900">{sale?.employee_name}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Details & Payment Box (No Negative Margin) */}
                <div className="grid grid-cols-2 gap-4 p-3.5 border border-slate-200 rounded-xl bg-slate-50/80 text-xs print-avoid-break">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Billed To (Customer):</span>
                    <span className="font-bold text-slate-900 block text-sm mt-0.5">{sale?.customer_name}</span>
                    <span className="text-slate-700 block mt-0.5">Phone: <strong>{sale?.customer_phone}</strong></span>
                    {sale?.customer_email && <span className="text-slate-600 block">Email: {sale.customer_email}</span>}
                    {sale?.customer_address && <span className="text-slate-600 block">Address: {sale.customer_address}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Payment Details:</span>
                    <span className="text-slate-700 block mt-0.5">
                      Mode: <strong className="text-slate-900 uppercase">{payments[0]?.payment_method || 'Cash'}</strong>
                    </span>
                    {payments[0]?.reference_number && (
                      <span className="text-slate-600 block text-[11px] font-mono">Ref/Txn: {payments[0].reference_number}</span>
                    )}
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px]">
                      STATUS: FULLY PAID
                    </span>
                  </div>
                </div>

                {/* Product Details Table */}
                <div className="print-avoid-break overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-2 px-2 text-center w-8">#</th>
                        <th className="py-2 px-2">Item Description & IMEI</th>
                        <th className="py-2 px-2 text-center w-20">Condition</th>
                        <th className="py-2 px-2 text-right w-20">Price</th>
                        <th className="py-2 px-2 text-right w-16">Disc.</th>
                        <th className="py-2 px-2 text-right w-20">Taxable</th>
                        <th className="py-2 px-2 text-right w-20">GST</th>
                        <th className="py-2 px-2 text-right w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-2 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-2">
                            <div className="font-bold text-slate-900 text-xs">
                              {item.brand} {item.model}
                            </div>
                            <div className="text-[10px] text-slate-600">
                              {item.variant} {item.color ? `• ${item.color}` : ''}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-800 font-bold mt-0.5">
                              IMEI 1: {item.imei1}
                            </div>
                            <div className="text-[9px] text-slate-500">
                              Warranty: 6 Months Ecofone Certified
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200 inline-block">
                              {item.condition_grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-slate-700">
                            {formatCurrency(item.selling_price)}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium">
                            {item.discount > 0 ? (
                              <div>
                                <div className="text-rose-600 font-bold">-{formatCurrency(item.discount)}</div>
                                <div className="text-[10px] text-slate-500 font-semibold">
                                  ({item.selling_price > 0 ? ((item.discount / item.selling_price) * 100).toFixed(1).replace(/\.0$/, '') : 0}%)
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">₹0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium text-slate-800">
                            {formatCurrency(item.taxable_amount)}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-600">
                            <div>{formatCurrency(item.total_tax)}</div>
                            <div className="text-[9px] text-slate-400">({item.tax_rate}%)</div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                            {formatCurrency(item.final_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Breakdown & Amount in Words */}
                <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 print-avoid-break">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Amount Chargeable (in words):
                    </span>
                    <p className="text-xs font-bold text-slate-800 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {numberToWordsINR(sale?.exchange_amount > 0 ? (sale.net_payable !== undefined && sale.net_payable !== null ? sale.net_payable : Math.max(0, sale.grand_total - sale.exchange_amount)) : sale?.grand_total)}
                    </p>

                    {/* Exchanged Device Details Box */}
                    {sale?.exchange_amount > 0 && exchange && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[10px] text-amber-950">
                        <span className="font-bold block text-amber-900 mb-0.5">Customer Exchange Device Credited:</span>
                        <div className="font-semibold text-slate-800">{exchange.brand} {exchange.model} {exchange.variant ? `(${exchange.variant})` : ''} {exchange.color ? `• ${exchange.color}` : ''}</div>
                        <div className="text-[9px] text-slate-600 mt-0.5">
                          IMEI: <span className="font-mono font-bold text-slate-800">{exchange.imei1}</span>
                          {exchange.battery_health ? ` • Battery: ${exchange.battery_health}%` : ''}
                          {exchange.condition_grade ? ` • Grade: ${exchange.condition_grade}` : ''}
                        </div>
                        <div className="text-[9px] font-bold text-emerald-700 mt-1">
                          Trade-In Valuation Credited: {formatCurrency(sale.exchange_amount)}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[10px] text-emerald-950 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block">64-Point Quality Certified & Tested</span>
                        <span>Eligible for 6 Months Ecofone Replacement / Repair Warranty</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs sm:ml-auto w-full sm:max-w-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (Items):</span>
                      <span className="font-medium">{formatCurrency(sale?.subtotal)}</span>
                    </div>
                    {sale?.discount_total > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>
                          Final Discount {sale?.subtotal > 0 ? `(${((sale.discount_total / sale.subtotal) * 100).toFixed(1).replace(/\.0$/, '')}%)` : ''}:
                        </span>
                        <span className="font-bold">-{formatCurrency(sale?.discount_total)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-200">
                      <span>Taxable Value:</span>
                      <span>{formatCurrency(sale?.taxable_amount)}</span>
                    </div>
                    {sale?.cgst > 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>CGST ({halfTaxRate}%):</span>
                        <span>{formatCurrency(sale.cgst)}</span>
                      </div>
                    )}
                    {sale?.sgst > 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>SGST ({halfTaxRate}%):</span>
                        <span>{formatCurrency(sale.sgst)}</span>
                      </div>
                    )}
                    {sale?.igst > 0 && (
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>IGST ({fullTaxRate}%):</span>
                        <span>{formatCurrency(sale.igst)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700">
                      <span>Total GST:</span>
                      <span className="font-medium">{formatCurrency(sale?.total_tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-emerald-800">{formatCurrency(sale?.grand_total)}</span>
                    </div>

                    {/* Exchange Deduction Breakdown */}
                    {sale?.exchange_amount > 0 && (
                      <>
                        <div className="flex justify-between text-emerald-800 font-bold text-xs pt-1.5 border-t border-dashed border-slate-300">
                          <span>Less: Exchange Credit:</span>
                          <span>-{formatCurrency(sale.exchange_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-1.5 border-t-2 border-slate-900">
                          <span>Net Payable / Paid:</span>
                          <span className="text-emerald-900">{formatCurrency(sale.net_payable !== undefined && sale.net_payable !== null ? sale.net_payable : Math.max(0, sale.grand_total - sale.exchange_amount))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Terms & Conditions & Authorized Sign */}
                <div className="mt-5 pt-3 border-t border-slate-200 grid grid-cols-3 gap-6 text-[10px] text-slate-500 print-avoid-break">
                  <div className="col-span-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Terms & Conditions:</span>
                    <p className="whitespace-pre-line leading-relaxed text-slate-600">
                      {company.invoice_terms || '1. 6 Months certified hardware warranty included.\n2. Warranty void if liquid, physical damage or unauthorized servicing.\n3. Original tax invoice required for warranty claims.\n4. Disputes subject to store local jurisdiction.'}
                    </p>
                  </div>
                  <div className="text-center flex flex-col justify-end">
                    <div className="border-b border-slate-300 pb-8"></div>
                    <span className="font-bold text-slate-800 uppercase tracking-wider mt-1 block text-[10px]">Authorized Signatory</span>
                    <span className="text-slate-500 text-[9px]">{company.company_name || 'Ecofone India Pvt Ltd'}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 text-center text-[9px] text-slate-400 border-t border-slate-100 pt-2 print-avoid-break">
                  {company.invoice_footer || 'Computer generated tax invoice under Section 31 of CGST Act, 2017. Thank you for choosing Ecofone! For warranty claims visit www.ecofone.in'}
                </div>

              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
