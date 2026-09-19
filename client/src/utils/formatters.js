export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

// Business timezone for Lucknow, India (IST - Indian Standard Time, UTC+5:30)
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

export function parseDate(dateString) {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  if (typeof dateString === 'number') return new Date(dateString);

  let str = String(dateString).trim();

  // If date-only format YYYY-MM-DD, construct date safely to avoid boundary day-shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    // 12:00 PM UTC maps to 5:30 PM IST on the exact same date
    return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  }

  // If SQLite CURRENT_TIMESTAMP format 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD HH:mm'
  // SQLite CURRENT_TIMESTAMP is UTC without 'Z', so append 'Z' for proper UTC parsing
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = parseDate(dateString);
  if (!d) return String(dateString);
  return d.toLocaleDateString('en-IN', {
    timeZone: BUSINESS_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const d = parseDate(dateString);
  if (!d) return String(dateString);
  return d.toLocaleDateString('en-IN', {
    timeZone: BUSINESS_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTime(dateString) {
  if (!dateString) return '-';
  const d = parseDate(dateString);
  if (!d) return String(dateString);
  return d.toLocaleTimeString('en-IN', {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function getStatusBadge(status) {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE':
    case 'ACTIVE':
    case 'PAID':
    case 'COMPLETED':
    case 'RECEIVED':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'SOLD':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      };
    case 'IN_TRANSIT':
    case 'IN TRANSIT':
    case 'PENDING':
    case 'REQUESTED':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      };
    case 'DEFECTIVE':
    case 'VOID':
    case 'CANCELLED':
    case 'REJECTED':
    case 'INACTIVE':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      };
    case 'RETURNED':
    case 'REFUNDED':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400'
      };
  }
}

export function numberToWordsINR(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(amount));
  if (n === 0) return 'Zero Rupees Only';

  function convertHundreds(num) {
    let str = '';
    if (num > 99) {
      str += a[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num > 19) {
      str += b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
    } else if (num > 0) {
      str += a[num];
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  if (crore > 0) words += convertHundreds(crore) + ' Crore ';
  if (lakh > 0) words += convertHundreds(lakh) + ' Lakh ';
  if (thousand > 0) words += convertHundreds(thousand) + ' Thousand ';
  if (remainder > 0) words += convertHundreds(remainder);

  return (words.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

