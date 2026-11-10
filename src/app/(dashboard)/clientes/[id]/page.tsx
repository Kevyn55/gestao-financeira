'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  TrendingUp,
  PlusCircle,
  Receipt,
  MessageCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, MethodBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatCPF, formatPhone, cleanDigits } from '@/lib/formatters';

export default function ClienteDetalhePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        router.push('/clientes');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [params.id]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Carregando dados do devedor...</p>
      </div>
    );
  }

  const { customer, stats, loans, payments } = data;
  const phoneDigits = cleanDigits(customer.phone);
  const waUrl = `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}`;

  return (
    <div className="space-y-8">
      {/* Back button and profile header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/clientes"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {customer.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cadastrado em {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chamar no WhatsApp</span>
          </a>

          <Link
            href={`/emprestimos/novo?customerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Novo Empréstimo</span>
          </Link>
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <span className="text-slate-400 font-medium">CPF</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-sm">
            {customer.cpf ? formatCPF(customer.cpf) : 'Não informado'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 font-medium">WhatsApp / Telefone</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            {formatPhone(customer.phone)}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-400 font-medium">E-mail</span>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
            {customer.email || 'Não informado'}
          </p>
        </div>

        {customer.address && (
          <div className="md:col-span-2 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>Endereço Residencial/Comercial</span>
            </span>
            <p className="text-slate-700 dark:text-slate-300 font-medium">
              {customer.address}
            </p>
          </div>
        )}

        {customer.notes && (
          <div className="md:col-span-3 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 font-medium">Observações</span>
            <p className="text-slate-700 dark:text-slate-300 italic">
              "{customer.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Financial Stats of this customer */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Emprestado"
          value={formatCurrency(stats.totalBorrowed)}
          subtitle={`${stats.totalLoans} empréstimos concedidos`}
          icon={DollarSign}
          variant="blue"
        />

        <StatCard
          title="Total Já Pago"
          value={formatCurrency(stats.totalPaid)}
          subtitle="Amortizações acumuladas"
          icon={CheckCircle}
          variant="emerald"
        />

        <StatCard
          title="Saldo Devedor Atual"
          value={formatCurrency(stats.totalDebtRemaining)}
          subtitle="Valor total pendente atualizado"
          icon={DollarSign}
          variant={stats.totalDebtRemaining > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Juros Totais Acumulados"
          value={formatCurrency(stats.totalInterestAccrued)}
          subtitle="Juros históricos gerados"
          icon={TrendingUp}
          variant="amber"
        />
      </div>

      {/* Empréstimos deste cliente */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Empréstimos Vinculados ({loans.length})
          </h2>
          <Link
            href={`/emprestimos/novo?customerId=${customer.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Novo Empréstimo</span>
          </Link>
        </div>

        {loans.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Nenhum empréstimo cadastrado para este cliente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Data Concessão</th>
                  <th className="py-3 px-3">Valor Original</th>
                  <th className="py-3 px-3">Taxa Mensal</th>
                  <th className="py-3 px-3">Tipo Juros</th>
                  <th className="py-3 px-3">Vencimento</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Saldo Atual</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loans.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {l.code}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(l.loanDate)}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-900 dark:text-white">
                      {formatCurrency(l.originalAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {l.monthlyInterestRate}% a.m.
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {l.interestType === 'SIMPLE' ? 'Simples' : 'Compostos'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(l.dueDate)}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={l.calculated.computedStatus} />
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(l.calculated.totalUpdatedAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/emprestimos/${l.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                      >
                        <span>Ver Dívida</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico de pagamentos deste cliente */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Histórico de Pagamentos Realizados ({payments.length})
          </h2>
          <Link
            href="/pagamentos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Registrar Pagamento</span>
          </Link>
        </div>

        {payments.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Nenhum pagamento registrado para este cliente ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3">Recibo / Comprovante</th>
                  <th className="py-3 px-3">Data Pagamento</th>
                  <th className="py-3 px-3">Empréstimo</th>
                  <th className="py-3 px-3">Forma</th>
                  <th className="py-3 px-3">Juros Abatidos</th>
                  <th className="py-3 px-3">Principal Abatido</th>
                  <th className="py-3 px-3">Total Pago</th>
                  <th className="py-3 px-3 text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                      {p.loan?.code}
                    </td>
                    <td className="py-3.5 px-3">
                      <MethodBadge method={p.paymentMethod} />
                    </td>
                    <td className="py-3.5 px-3 text-amber-600 dark:text-amber-400 font-medium">
                      {formatCurrency(p.interestPaid)}
                    </td>
                    <td className="py-3.5 px-3 text-blue-600 dark:text-blue-400 font-medium">
                      {formatCurrency(p.principalPaid)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        href={`/pagamentos/comprovante/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 hover:underline"
                      >
                        <span>Imprimir</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
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

