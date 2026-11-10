'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HandCoins,
  Search,
  Plus,
  Filter,
  Eye,
  Trash2,
  MessageCircle,
  Receipt,
  Calendar,
  Percent,
  AlertTriangle,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function EmprestimosPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [interestTypeFilter, setInterestTypeFilter] = useState('ALL');

  const loadLoans = async () => {
    try {
      setLoading(true);
      let url = `/api/loans?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadLoans();
    }, 250);
    return () => clearTimeout(delay);
  }, [search, statusFilter]);

  const handleDelete = async (loan: any) => {
    if (!confirm(`Tem certeza que deseja excluir o empréstimo ${loan.code} de ${loan.customer.name}? Todos os pagamentos e registros vinculados serão excluídos permanentemente.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/loans/${loan.id}`, { method: 'DELETE' });
      if (res.ok) {
        loadLoans();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir.');
      }
    } catch (e) {
      alert('Erro de conexão ao excluir.');
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (interestTypeFilter !== 'ALL' && l.interestType !== interestTypeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <HandCoins className="h-7 w-7 text-emerald-600" />
            <span>Controle de Empréstimos e Dívidas</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Acompanhe saldos atualizados, taxas, prazos e histórico de amortização
          </p>
        </div>

        <Link
          href="/emprestimos/novo"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Empréstimo</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por código (EMP-2026-...), devedor ou descrição..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none shadow-sm"
          >
            <option value="ALL">Todos os Status</option>
            <option value="OPEN">Em Aberto</option>
            <option value="PARTIALLY_PAID">Parcialmente Pago</option>
            <option value="OVERDUE">Atrasado</option>
            <option value="PAID">Quitado</option>
          </select>

          <select
            value={interestTypeFilter}
            onChange={(e) => setInterestTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 focus:border-emerald-500 focus:outline-none shadow-sm"
          >
            <option value="ALL">Todos os Juros</option>
            <option value="SIMPLE">Juros Simples</option>
            <option value="COMPOUND">Juros Compostos</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-12 text-center">
            <HandCoins className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum empréstimo encontrado
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Cadastre um novo empréstimo ou ajuste os filtros.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Código / Devedor</th>
                  <th className="py-3.5 px-4">Valor Original</th>
                  <th className="py-3.5 px-4">Taxa & Regime</th>
                  <th className="py-3.5 px-4">Datas (Início / Venc.)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Saldo Atualizado</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLoans.map((loan) => {
                  const calc = loan.calculated;
                  return (
                    <tr
                      key={loan.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                        <Link
                          href={`/emprestimos/${loan.id}`}
                          className="hover:text-emerald-600 transition flex items-center gap-1.5"
                        >
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                            {loan.code}
                          </span>
                          <span>•</span>
                          <span>{loan.customer?.name}</span>
                        </Link>
                        {loan.description && (
                          <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs">
                            {loan.description}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrency(loan.originalAmount)}
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold">{loan.monthlyInterestRate}% a.m.</span>
                        <span className="block text-[11px] text-slate-400">
                          {loan.interestType === 'SIMPLE' ? 'Simples' : 'Compostos'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px]">Início: </span>
                          <span>{formatDate(loan.loanDate)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Venc.: </span>
                          <span className={calc.isOverdue ? 'font-bold text-rose-600' : ''}>
                            {formatDate(loan.dueDate)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={calc.computedStatus} />
                        {calc.isOverdue && (
                          <span className="block text-[10px] text-rose-500 font-semibold mt-0.5">
                            {calc.daysLate} dias atrasado
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(calc.totalUpdatedAmount)}
                        <span className="block text-[10px] font-normal text-slate-400">
                          Juros: {formatCurrency(calc.totalInterestRemaining)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/emprestimos/${loan.id}`}
                            title="Ver Extrato e Timeline"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {!calc.isPaid && (
                            <Link
                              href={`/pagamentos?loanId=${loan.id}`}
                              title="Registrar Pagamento / Amortização"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            >
                              <Receipt className="h-4 w-4" />
                            </Link>
                          )}

                          <button
                            onClick={() => handleDelete(loan)}
                            title="Excluir Empréstimo"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

