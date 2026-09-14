import React, { useState } from 'react';
import { Printer, X, CheckCircle, Smartphone, Building, User, Receipt, Phone, Mail } from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

export default function InvoiceModal({ invoiceData, onClose, onNewSale }) {
  const [printFormat, setPrintFormat] = useState('a4'); // 'a4' | 'thermal'

  if (!invoiceData) return null;
  const { sale, items = [], payments = [], company = {} } = invoiceData;

  const handlePrint = (format) => {
    setPrintFormat(format);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
            <button
              onClick={() => handlePrint('thermal')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
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
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          
          {/* Printable Invoice Container */}
          <div id="printable-invoice" className={`bg-white border border-slate-200 rounded-xl p-8 shadow-sm mx-auto ${printFormat === 'thermal' ? 'thermal-receipt' : 'max-w-3xl'}`}>
            
            {/* Header: Branding & Store info */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-xs shrink-0">
                  <img src="/logo.png" alt="Ecofone" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    {company.company_name || 'Ecofone'}
                  </h1>
                  <p className="text-xs font-semibold text-amber-600">
                    {company.company_tagline || 'Luxury within reach'}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                    {sale?.store_address ? `${sale.store_address}, ${sale.store_city}` : company.company_address}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    GSTIN: <span className="font-semibold text-slate-700">{sale?.store_gstin || company.company_gstin}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-extrabold uppercase tracking-wider">
                  TAX INVOICE
                </div>
                <div className="text-xs font-bold text-slate-800 mt-2">
                  Invoice #: <span className="font-mono text-emerald-700">{sale?.invoice_number}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Date: {formatDateTime(sale?.sale_date)}
                </div>
                <div className="text-[11px] text-slate-500">
                  Store: <span className="font-medium text-slate-700">{sale?.store_name} ({sale?.store_code})</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Billed by: <span className="font-medium text-slate-700">{sale?.employee_name}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 bg-slate-50/70 -mx-8 px-8 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Customer Information</span>
                <span className="font-bold text-slate-900 block text-sm mt-0.5">{sale?.customer_name}</span>
                <span className="text-slate-600 block mt-0.5">Phone: {sale?.customer_phone}</span>
                {sale?.customer_email && <span className="text-slate-500 block">Email: {sale.customer_email}</span>}
                {sale?.customer_address && <span className="text-slate-500 block">Address: {sale.customer_address}</span>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Summary</span>
                <span className="text-slate-700 block mt-0.5">
                  Method: <strong className="text-slate-900">{payments[0]?.payment_method || 'Cash'}</strong>
                </span>
                {payments[0]?.reference_number && (
                  <span className="text-slate-500 block text-[11px]">Ref: {payments[0].reference_number}</span>
                )}
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  STATUS: FULLY PAID
                </span>
              </div>
            </div>

            {/* Product Details Table */}
            <div className="mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5 text-center">Grade</th>
                    <th className="py-2.5 text-right">Price</th>
                    <th className="py-2.5 text-right">Disc.</th>
                    <th className="py-2.5 text-right">Taxable</th>
                    <th className="py-2.5 text-right">GST</th>
                    <th className="py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3">
                        <div className="font-bold text-slate-900 text-sm">
                          {item.brand} {item.model}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.variant} {item.color ? `• ${item.color}` : ''}
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 mt-0.5">
                          IMEI: {item.imei1}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Warranty: 6 Months Ecofone Certified
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                          {item.condition_grade}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium text-slate-700">
                        {formatCurrency(item.selling_price)}
                      </td>
                      <td className="py-3 text-right text-rose-600 font-medium">
                        {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '₹0'}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-800">
                        {formatCurrency(item.taxable_amount)}
                      </td>
                      <td className="py-3 text-right text-slate-600">
                        <div>{formatCurrency(item.total_tax)}</div>
                        <div className="text-[9px] text-slate-400">({item.tax_rate}%)</div>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(item.final_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown / Totals */}
            <div className="mt-6 border-t border-slate-200 pt-4 flex justify-end">
              <div className="w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(sale?.subtotal)}</span>
                </div>
                {sale?.discount_total > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(sale?.discount_total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-100">
                  <span>Taxable Value:</span>
                  <span>{formatCurrency(sale?.taxable_amount)}</span>
                </div>
                {sale?.cgst > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>CGST (9%):</span>
                    <span>{formatCurrency(sale.cgst)}</span>
                  </div>
                )}
                {sale?.sgst > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>SGST (9%):</span>
                    <span>{formatCurrency(sale.sgst)}</span>
                  </div>
                )}
                {sale?.igst > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>IGST (18%):</span>
                    <span>{formatCurrency(sale.igst)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700">
                  <span>Total GST:</span>
                  <span>{formatCurrency(sale?.total_tax)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700">{formatCurrency(sale?.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions & Authorized Sign */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-[10px] text-slate-500">
              <div className="col-span-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">Warranty & Return Terms:</span>
                <p className="whitespace-pre-line leading-relaxed">
                  {company.invoice_terms || '1. 6 Months certified warranty included.\n2. Warranty void if liquid/physical damage.\n3. Original invoice required for all claims.'}
                </p>
              </div>
              <div className="text-center flex flex-col justify-end">
                <div className="border-b border-slate-300 pb-8"></div>
                <span className="font-bold text-slate-700 uppercase tracking-wider mt-1 block">Authorized Signatory</span>
                <span className="text-slate-400">{company.company_name || 'Ecofone'}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
              {company.invoice_footer || 'Thank you for shopping at Ecofone! For warranty claims visit www.ecofone.in'}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
