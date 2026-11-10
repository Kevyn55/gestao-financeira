import React from 'react';

interface BadgeProps {
  status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';

  switch (status) {
    case 'PAID':
    case 'QUITADO':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-medium ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Quitado
        </span>
      );
    case 'OVERDUE':
    case 'ATRASADO':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 font-medium ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Atrasado
        </span>
      );
    case 'PARTIALLY_PAID':
    case 'PARCIALMENTE_PAGO':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-medium ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Parcialmente Pago
        </span>
      );
    case 'OPEN':
    case 'EM_ABERTO':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 font-medium ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Em Aberto
        </span>
      );
  }
}

export function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {method || 'PIX'}
    </span>
  );
}

