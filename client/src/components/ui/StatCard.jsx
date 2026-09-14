import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', trend }) {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/20',
    slate: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-500/20',
  };

  const style = colorStyles[color] || colorStyles.emerald;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            {title}
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl border ${style} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">{trend.label}</span>
          <span className={`font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  );
}
