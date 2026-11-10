'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  CheckCircle,
  PlusCircle,
  Receipt,
  MessageCircle,
  ArrowUpRight,
  ChevronRight,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, MethodBadge } from '@/components/ui/Badge';
import { EvolutionChart } from '@/components/charts/EvolutionChart';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Carregando indicadores financeiros e cálculos...
        </p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const evolucao = data?.evolucaoMensal || [];
  const atrasados = data?.emprestimosAtrasados || [];
  const proximos = data?.vencimentosProximos || [];
  const ultimosPagamentos = data?.ultimosPagamentos || [];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Visão Geral Financeira
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Acompanhamento de capital emprestado, amortizações e juros acumulados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/clientes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            <Users className="h-4 w-4" />
            <span>Novo Cliente</span>
          </Link>

          <Link
            href="/emprestimos/novo"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Novo Empréstimo</span>
          </Link>
        </div>
      </div>

      {/* 1. INDICADORES PRINCIPAIS (Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Emprestado"
          value={formatCurrency(metrics.totalEmprestado)}
          subtitle={`${metrics.totalEmprestimos || 0} operações registradas`}
          icon={DollarSign}
          variant="blue"
        />

        <StatCard
          title="Valores Recebidos"
          value={formatCurrency(metrics.totalRecebido)}
          subtitle={`Juros recebidos: ${formatCurrency(metrics.totalJurosRecebidos)}`}
          icon={CheckCircle}
          variant="emerald"
        />

        <StatCard
          title="Total a Receber"
          value={formatCurrency(metrics.totalAReceber)}
          subtitle="Capital + Juros atualizados"
          icon={Wallet}
          variant="indigo"
        />

        <StatCard
          title="Juros Acumulados"
          value={formatCurrency(metrics.totalJurosAcumulados)}
          subtitle="Total histórico de juros"
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Secondary Indicators */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Pessoas com Dívidas em Aberto"
          value={metrics.devedoresEmAbertoCount}
          subtitle={`De um total de ${metrics.totalDevedoresCount || 0} clientes cadastrados`}
          icon={Users}
          variant="slate"
        />

        <StatCard
          title="Dívidas Atrasadas"
          value={metrics.dividasAtrasadasCount}
          subtitle={metrics.dividasAtrasadasCount > 0 ? 'Exigem ação de cobrança' : 'Nenhuma dívida atrasada'}
          icon={AlertTriangle}
          variant={metrics.dividasAtrasadasCount > 0 ? 'rose' : 'emerald'}
          badge={metrics.dividasAtrasadasCount > 0 ? 'Atenção' : 'Em Dia'}
        />

        <StatCard
          title="Previsão de Recebimentos do Mês"
          value={formatCurrency(metrics.previsaoRecebimentoMes)}
          subtitle="Vencimentos previstos para este mês"
          icon={Calendar}
          variant="emerald"
        />
      </div>

      {/* 2. GRÁFICO DE EVOLUÇÃO FINANCEIRA */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Evolução Financeira Mensal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparativo dos valores concedidos, amortizações recebidas e juros obtidos nos últimos 6 meses
            </p>
          </div>
          <Link
            href="/relatorios"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Ver Relatório Completo</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <EvolutionChart data={evolucao} />
      </div>

      {/* 3. SEÇÃO DE ALERTA: DÍVIDAS ATRASADAS */}
      {atrasados.length > 0 && (
        <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-rose-200/50 dark:border-rose-900/30 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950 dark:text-rose-200">
                  Dívidas em Atraso ({atrasados.length})
                </h3>
                <p className="text-xs text-rose-800/80 dark:text-rose-400">
                  Empréstimos com vencimento expirado necessitando cobrança
                </p>
              </div>
            </div>

            <Link
              href="/alertas"
              className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline inline-flex items-center gap-1"
            >
              <span>Gerenciar Cobranças</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-rose-200/60 dark:border-rose-900/40 text-rose-900/70 dark:text-rose-300 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Devedor</th>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Vencimento</th>
                  <th className="py-2.5 px-3">Dias em Atraso</th>
                  <th className="py-2.5 px-3">Saldo Atualizado</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200/40 dark:divide-rose-900/30">
                {atrasados.slice(0, 5).map((item: any) => (
                  <tr key={item.id} className="hover:bg-rose-100/40 dark:hover:bg-rose-900/30 transition">
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {item.customerName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {item.code}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                        {item.daysLate} dias
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-700 dark:text-rose-400">
                      {formatCurrency(item.totalUpdatedAmount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/emprestimos/${item.id}`}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
                        >
                          Ver Detalhes
                        </Link>
                        <Link
                          href="/alertas"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DUAS COLUNAS: VENCIMENTOS PRÓXIMOS & ÚLTIMOS PAGAMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vencimentos Próximos */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Vencendo nos Próximos 7 Dias ({proximos.length})
              </h3>
            </div>
            <Link
              href="/alertas"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Ver Todos
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {proximos.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Nenhum empréstimo com vencimento previsto para os próximos 7 dias.
              </p>
            ) : (
              proximos.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 transition"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.customerName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Vence em {formatDate(item.dueDate)} ({item.daysRemaining} dias)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.totalUpdatedAmount)}
                    </span>
                    <Link
                      href={`/emprestimos/${item.id}`}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      Acessar dívida
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Últimos Pagamentos Recebidos */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Últimos Pagamentos Recebidos
              </h3>
            </div>
            <Link
              href="/pagamentos"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Histórico Completo
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {ultimosPagamentos.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Nenhum pagamento registrado ainda.
              </p>
            ) : (
              ultimosPagamentos.slice(0, 5).map((pay: any) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {pay.customerName}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{formatDate(pay.paymentDate)}</span>
                        <span>•</span>
                        <MethodBadge method={pay.paymentMethod} />
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      + {formatCurrency(pay.amount)}
                    </span>
                    <Link
                      href={`/pagamentos/comprovante/${pay.id}`}
                      className="text-[11px] font-semibold text-slate-500 hover:text-emerald-600 hover:underline"
                    >
                      Comprovante
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

