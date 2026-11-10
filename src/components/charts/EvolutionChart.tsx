'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';

interface EvolutionChartProps {
  data: Array<{
    month: string;
    emprestado: number;
    recebido: number;
    juros: number;
  }>;
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Nenhum dado financeiro para exibir no gráfico.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900 text-xs">
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
            formatter={(val) => <span className="text-slate-600 dark:text-slate-400">{val}</span>}
          />
          <Bar
            name="Emprestado"
            dataKey="emprestado"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            name="Recebido (Total)"
            dataKey="recebido"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            name="Juros Recebidos"
            dataKey="juros"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

