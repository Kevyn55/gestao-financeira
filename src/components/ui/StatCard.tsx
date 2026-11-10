import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo' | 'slate';
  badge?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badge,
}: StatCardProps) {
  const variantStyles = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200/60 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200/60 dark:border-blue-800/40',
      iconBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400',
      valueColor: 'text-blue-700 dark:text-blue-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200/60 dark:border-amber-800/40',
      iconBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400',
      valueColor: 'text-amber-700 dark:text-amber-400',
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200/60 dark:border-rose-800/40',
      iconBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400',
      valueColor: 'text-rose-700 dark:text-rose-400',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      border: 'border-indigo-200/60 dark:border-indigo-800/40',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400',
      valueColor: 'text-indigo-700 dark:text-indigo-400',
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-900/40',
      border: 'border-slate-200 dark:border-slate-800',
      iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      valueColor: 'text-slate-900 dark:text-slate-100',
    },
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${style.bg} ${style.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${style.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3">
        <h3 className={`text-2xl font-bold tracking-tight ${style.valueColor}`}>{value}</h3>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>{subtitle}</span>
            {badge && (
              <span className="font-semibold text-xs px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 text-slate-700 dark:text-slate-300">
                {badge}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

