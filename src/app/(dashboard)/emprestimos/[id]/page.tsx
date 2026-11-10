'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  HandCoins,
  Receipt,
  MessageCircle,
  Printer,
  Calendar,
  Percent,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { StatusBadge, MethodBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatDate, formatPhone } from '@/lib/formatters';

export default function DetalheEmprestimoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLoan = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/loans/${params.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        router.push('/emprestimos');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoan();
  }, [params.id]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Calculando saldo e juros da dívida...</p>
      </div>
    );
  }

  const { calculated, customer, whatsapp, settings } = data;
  const isPaid = calculated.isPaid;
  const isOverdue = calculated.isOverdue;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/emprestimos"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                {data.code}
              </span>
              <StatusBadge status={calculated.computedStatus} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
              Empréstimo de {customer.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Extrato Button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Extrato</span>
          </button>

          {/* WhatsApp Direct Reminder Button */}
          {!isPaid && whatsapp?.url && (
            <a
              href={whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Cobrar no WhatsApp</span>
            </a>
          )}

          {/* New Payment Button */}
          {!isPaid && (
            <Link
              href={`/pagamentos?loanId=${data.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 transition"
            >
              <Receipt className="h-4 w-4" />
              <span>Dar Baixa / Pagar</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Loan Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Montante Total Atualizado"
          value={formatCurrency(calculated.totalUpdatedAmount)}
          subtitle={isPaid ? 'Dívida totalmente quitada!' : 'Saldo principal + juros pendentes'}
          icon={DollarSign}
          variant={isPaid ? 'emerald' : isOverdue ? 'rose' : 'indigo'}
        />

        <StatCard
          title="Principal Restante"
          value={formatCurrency(calculated.totalPrincipalRemaining)}
          subtitle={`Capital original: ${formatCurrency(data.originalAmount)}`}
          icon={HandCoins}
          variant="blue"
        />

        <StatCard
          title="Juros Pendentes"
          value={formatCurrency(calculated.totalInterestRemaining)}
          subtitle={`Juros do mês: ${formatCurrency(calculated.currentMonthInterest)}`}
          icon={TrendingUp}
          variant="amber"
        />

        <StatCard
          title="Total Já Amortizado"
          value={formatCurrency(calculated.totalPaid)}
          subtitle={`Principal: ${formatCurrency(calculated.totalPrincipalPaid)} | Juros: ${formatCurrency(calculated.totalInterestPaid)}`}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Overdue Warning Alert */}
      {isOverdue && (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Atenção: Empréstimo com Vencimento em Atraso ({calculated.daysLate} dias / {calculated.monthsLate} meses)
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                Vencimento previsto era {formatDate(data.dueDate)}. Os juros contratuais continuam sendo calculados rigorosamente sobre o saldo devedor restante.
              </p>
            </div>
          </div>

          {whatsapp?.url && (
            <a
              href={whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition shrink-0"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Notificar Devedor</span>
            </a>
          )}
        </div>
      )}

      {/* Contract & Financial Parameters Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Parâmetros Contratuais Registrados</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Devedor Vinculado</span>
            <Link
              href={`/clientes/${customer.id}`}
              className="block font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 transition"
            >
              {customer.name}
            </Link>
            <span className="text-[11px] text-slate-500">{formatPhone(customer.phone)}</span>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Taxa de Juros</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {data.monthlyInterestRate}% ao mês
            </p>
            <span className="text-[11px] text-slate-500">
              Regime: {data.interestType === 'SIMPLE' ? 'Juros Simples' : 'Juros Compostos'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Data de Concessão</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {formatDate(data.loanDate)}
            </p>
            <span className="text-[11px] text-slate-500">
              Vencimento: {formatDate(data.dueDate)} (Dia {data.billingDay})
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Regra de Amortização</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              {data.amortizationRule === 'INTEREST_FIRST' ? 'Juros Primeiro' : 'Principal Primeiro'}
            </p>
            <span className="text-[11px] text-slate-500">
              {data.incompleteMonthRule === 'PRO_RATA' ? 'Pro-Rata Die (Dias)' : 'Mês Cheio'}
            </span>
          </div>
        </div>

        {data.description && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Descrição / Observações: </span>
            <span className="text-slate-700 dark:text-slate-300 italic">{data.description}</span>
          </div>
        )}
      </div>

      {/* 4. HISTÓRICO ANALÍTICO E TIMELINE DOS CÁLCULOS (Módulo Central) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Memória de Cálculo e Timeline de Amortização</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Auditoria cronológica exata: sem arredondamentos intermediários, com juros apenas sobre saldos pendentes
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Evento / Operação</th>
                <th className="py-3 px-3">Base Principal</th>
                <th className="py-3 px-3">Juros Gerados</th>
                <th className="py-3 px-3">Amortização</th>
                <th className="py-3 px-3">Principal Restante</th>
                <th className="py-3 px-3">Juros Pendentes</th>
                <th className="py-3 px-3 text-right">Montante Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {calculated.timeline.map((event: any, idx: number) => {
                const isPayment = event.type === 'PAYMENT';
                const isAccrual = event.type === 'INTEREST_ACCRUAL';

                return (
                  <tr
                    key={idx}
                    className={`transition ${
                      isPayment
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 font-medium'
                        : isAccrual
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : 'bg-slate-50/70 dark:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {formatDate(event.date)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {isPayment && <Receipt className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        {isAccrual && <TrendingUp className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        <span className="text-slate-900 dark:text-white font-medium">
                          {event.description}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {formatCurrency(event.principalBase)}
                    </td>
                    <td className="py-3 px-3">
                      {event.interestAccrued > 0 ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          + {formatCurrency(event.interestAccrued)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {isPayment ? (
                        <div className="text-emerald-700 dark:text-emerald-400">
                          <span className="font-bold">Pago: {formatCurrency(event.paymentAmount)}</span>
                          <span className="block text-[10px] text-slate-500">
                            (Principal: {formatCurrency(event.principalPaid)} | Juros: {formatCurrency(event.interestPaid)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(event.principalRemaining)}
                    </td>
                    <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-semibold">
                      {formatCurrency(event.interestRemaining)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(event.totalUpdatedAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. HISTÓRICO DE PAGAMENTOS VINCULADOS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Pagamentos e Recibos Emitidos ({data.payments?.length || 0})
          </h2>
          {!isPaid && (
            <Link
              href={`/pagamentos?loanId=${data.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Registrar Pagamento</span>
            </Link>
          )}
        </div>

        {data.payments?.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            Nenhum pagamento registrado para este empréstimo ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3">Recibo</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Forma de Pagamento</th>
                  <th className="py-3 px-3">Juros Quitados</th>
                  <th className="py-3 px-3">Principal Amortizado</th>
                  <th className="py-3 px-3">Valor Total Pago</th>
                  <th className="py-3 px-3 text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3 px-3">
                      <MethodBadge method={p.paymentMethod} />
                    </td>
                    <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-semibold">
                      {formatCurrency(p.interestPaid)}
                    </td>
                    <td className="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold">
                      {formatCurrency(p.principalPaid)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/pagamentos/comprovante/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 hover:underline"
                      >
                        <span>Ver / Imprimir</span>
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

