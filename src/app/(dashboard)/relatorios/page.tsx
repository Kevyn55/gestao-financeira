'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function RelatoriosPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const [customerId, setCustomerId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [interestType, setInterestType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (customerId !== 'ALL') params.set('customerId', customerId);
      if (status !== 'ALL') params.set('status', status);
      if (interestType !== 'ALL') params.set('interestType', interestType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setReportData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadReport();
  }, [customerId, status, interestType, startDate, endDate]);

  const summary = reportData?.summary || {};
  const records = reportData?.records || [];

  // Export to Excel (.xlsx) using SheetJS
  const exportToExcel = () => {
    if (!records.length) {
      alert('Não há dados para exportar.');
      return;
    }

    const rows = records.map((r: any) => ({
      'Código': r.code,
      'Devedor': r.customerName,
      'CPF': r.customerCpf || '-',
      'Telefone': r.customerPhone,
      'Data Empréstimo': formatDate(r.loanDate),
      'Vencimento': formatDate(r.dueDate),
      'Taxa Mensal (%)': r.monthlyInterestRate,
      'Tipo de Juros': r.interestType === 'SIMPLE' ? 'Simples' : 'Compostos',
      'Valor Original (R$)': r.originalAmount,
      'Total Pago (R$)': r.calculated.totalPaid,
      'Principal Amortizado (R$)': r.calculated.totalPrincipalPaid,
      'Juros Recebidos (R$)': r.calculated.totalInterestPaid,
      'Juros Pendentes (R$)': r.calculated.totalInterestRemaining,
      'Saldo Atualizado (R$)': r.calculated.totalUpdatedAmount,
      'Status': r.calculated.computedStatus,
      'Dias em Atraso': r.calculated.daysLate || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Financeiro');

    const fileName = `Relatorio-Financeiro-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-emerald-600" />
            <span>Relatórios Financeiros Avançados</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Filtros consolidados, extrato analítico e exportação para Excel e PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Box (hidden on print) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-emerald-600" />
            <span>Filtros do Relatório</span>
          </span>
          <button
            onClick={() => {
              setCustomerId('ALL');
              setStatus('ALL');
              setInterestType('ALL');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Resetar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Devedor */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Devedor / Cliente
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Todos os Clientes</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status da Dívida
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="OPEN">Em Aberto</option>
              <option value="PARTIALLY_PAID">Parcialmente Pago</option>
              <option value="OVERDUE">Atrasado</option>
              <option value="PAID">Quitado</option>
            </select>
          </div>

          {/* Tipo de Juros */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Juros
            </label>
            <select
              value={interestType}
              onChange={(e) => setInterestType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">Todos os Regimes</option>
              <option value="SIMPLE">Juros Simples</option>
              <option value="COMPOUND">Juros Compostos</option>
            </select>
          </div>

          {/* Data Inicial */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Data Final */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary Totals Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Emprestado"
          value={formatCurrency(summary.totalEmprestado)}
          subtitle={`${summary.quantidadeOperacoes || 0} operações filtradas`}
          icon={DollarSign}
          variant="blue"
        />

        <StatCard
          title="Total Recebido"
          value={formatCurrency(summary.totalRecebido)}
          subtitle={`Principal amortizado: ${formatCurrency(summary.totalPrincipalRecuperado)}`}
          icon={CheckCircle}
          variant="emerald"
        />

        <StatCard
          title="Juros Recebidos"
          value={formatCurrency(summary.totalJurosRecebidos)}
          subtitle="Rendimento obtido"
          icon={TrendingUp}
          variant="amber"
        />

        <StatCard
          title="Saldo Atual a Receber"
          value={formatCurrency(summary.totalSaldoDevedorRestante)}
          subtitle={`Juros pendentes: ${formatCurrency(summary.totalJurosPendentes)}`}
          icon={DollarSign}
          variant="indigo"
        />
      </div>

      {/* Table of Filtered Records */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Extrato Analítico das Operações ({records.length})
          </h2>
          <span className="text-xs text-slate-400">
            Atualizado em tempo real com regras contratuais
          </span>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Nenhum registro encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Devedor</th>
                  <th className="py-3 px-3">Início</th>
                  <th className="py-3 px-3">Vencimento</th>
                  <th className="py-3 px-3">Taxa & Tipo</th>
                  <th className="py-3 px-3">Original</th>
                  <th className="py-3 px-3">Total Pago</th>
                  <th className="py-3 px-3">Juros Obtidos</th>
                  <th className="py-3 px-3">Saldo Restante</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {r.code}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-900 dark:text-white">
                      {r.customerName}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(r.loanDate)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(r.dueDate)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {r.monthlyInterestRate}% a.m. ({r.interestType === 'SIMPLE' ? 'Simples' : 'Comp.'})
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-900 dark:text-white">
                      {formatCurrency(r.originalAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(r.calculated.totalPaid)}
                    </td>
                    <td className="py-3.5 px-3 text-amber-600 dark:text-amber-400 font-semibold">
                      {formatCurrency(r.calculated.totalInterestPaid)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(r.calculated.totalUpdatedAmount)}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={r.calculated.computedStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

