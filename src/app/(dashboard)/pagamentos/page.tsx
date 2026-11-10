'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Printer,
  Calendar,
  AlertCircle,
  X,
  CheckCircle2,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { MethodBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateForInput } from '@/lib/formatters';

function PagamentosContent() {
  const searchParams = useSearchParams();
  const preSelectedLoanId = searchParams.get('loanId') || '';

  const [payments, setPayments] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal registration state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    loanId: preSelectedLoanId,
    paymentDate: formatDateForInput(new Date()),
    amount: '',
    paymentMethod: 'PIX',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, loanRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/loans?status=ALL'),
      ]);

      if (payRes.ok && loanRes.ok) {
        const payData = await payRes.json();
        const loanData = await loanRes.json();
        setPayments(payData);
        setLoans(loanData);

        if (preSelectedLoanId) {
          setFormData((prev) => ({ ...prev, loanId: preSelectedLoanId }));
          setModalOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Find currently selected loan in modal
  const selectedLoan = loans.find((l) => l.id === formData.loanId);

  const openPaymentModal = (loanId?: string) => {
    const targetLoan = loanId ? loans.find((l) => l.id === loanId) : loans.find((l) => !l.calculated.isPaid) || loans[0];
    setFormData({
      loanId: targetLoan?.id || '',
      paymentDate: formatDateForInput(new Date()),
      amount: targetLoan ? targetLoan.calculated.totalUpdatedAmount.toFixed(2) : '',
      paymentMethod: 'PIX',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handlePayFullBalance = () => {
    if (selectedLoan) {
      setFormData({
        ...formData,
        amount: selectedLoan.calculated.totalUpdatedAmount.toFixed(2),
      });
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseFloat(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Informe um valor de pagamento válido.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erro ao registrar pagamento.');
        setSubmitting(false);
        return;
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError('Erro ao comunicar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (payment: any) => {
    if (
      !confirm(
        `Deseja realmente estornar o pagamento ${payment.receiptNumber} de ${formatCurrency(
          payment.amount
        )}? O saldo devedor do empréstimo será recalculado automaticamente.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/payments/${payment.id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao estornar.');
      }
    } catch (e) {
      alert('Erro de conexão ao estornar.');
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      p.receiptNumber?.toLowerCase().includes(term) ||
      p.customer?.name?.toLowerCase().includes(term) ||
      p.loan?.code?.toLowerCase().includes(term) ||
      p.paymentMethod?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Receipt className="h-7 w-7 text-emerald-600" />
            <span>Controle de Pagamentos & Baixas</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Amortizações automáticas, emissão de comprovantes e recálculo de saldos
          </p>
        </div>

        <button
          onClick={() => openPaymentModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Novo Pagamento</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por número do comprovante (REC-...), devedor ou forma de pagamento..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum pagamento registrado
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Clique no botão acima para dar baixa em um empréstimo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Comprovante</th>
                  <th className="py-3.5 px-4">Data Pagamento</th>
                  <th className="py-3.5 px-4">Devedor</th>
                  <th className="py-3.5 px-4">Empréstimo</th>
                  <th className="py-3.5 px-4">Forma</th>
                  <th className="py-3.5 px-4">Juros Abatidos</th>
                  <th className="py-3.5 px-4">Principal Abatido</th>
                  <th className="py-3.5 px-4">Valor Total Pago</th>
                  <th className="py-3.5 px-4">Saldo Restante</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      <Link
                        href={`/pagamentos/comprovante/${p.id}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        <span>{p.receiptNumber}</span>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </Link>
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                      <Link href={`/clientes/${p.customerId}`} className="hover:underline">
                        {p.customer?.name}
                      </Link>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      <Link href={`/emprestimos/${p.loanId}`} className="hover:underline">
                        {p.loan?.code}
                      </Link>
                    </td>

                    <td className="py-4 px-4">
                      <MethodBadge method={p.paymentMethod} />
                    </td>

                    <td className="py-4 px-4 text-amber-600 dark:text-amber-400 font-semibold">
                      {formatCurrency(p.interestPaid)}
                    </td>

                    <td className="py-4 px-4 text-blue-600 dark:text-blue-400 font-semibold">
                      {formatCurrency(p.principalPaid)}
                    </td>

                    <td className="py-4 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>

                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {p.remainingBalance <= 0.01 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          Quitado (R$ 0,00)
                        </span>
                      ) : (
                        formatCurrency(p.remainingBalance)
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/pagamentos/comprovante/${p.id}`}
                          title="Imprimir Comprovante"
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeletePayment(p)}
                          title="Estornar Pagamento"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR PAGAMENTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Registrar Pagamento / Baixa
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-3 text-xs text-rose-700 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="mt-5 space-y-4">
              {/* Empréstimo Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Selecione o Empréstimo / Devedor *
                </label>
                <select
                  required
                  value={formData.loanId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    const found = loans.find((l) => l.id === lId);
                    setFormData({
                      ...formData,
                      loanId: lId,
                      amount: found ? found.calculated.totalUpdatedAmount.toFixed(2) : formData.amount,
                    });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  {loans.length === 0 ? (
                    <option value="">Nenhum empréstimo cadastrado</option>
                  ) : (
                    loans.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} - {l.customer?.name} (Saldo: {formatCurrency(l.calculated.totalUpdatedAmount)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Informação do Saldo Atual do Empréstimo */}
              {selectedLoan && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Devedor:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedLoan.customer?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Saldo Devedor Atual:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedLoan.calculated.totalUpdatedAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>(Principal: {formatCurrency(selectedLoan.calculated.totalPrincipalRemaining)} | Juros: {formatCurrency(selectedLoan.calculated.totalInterestRemaining)})</span>
                    <button
                      type="button"
                      onClick={handlePayFullBalance}
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Pagar Saldo Total
                    </button>
                  </div>
                </div>
              )}

              {/* Valor Pago & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Valor Pago (R$) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3.5 top-2.5 text-sm text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3.5 text-sm font-bold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Forma de Pagamento *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro em Espécie</option>
                  <option value="TRANSFERENCIA">Transferência Bancária (TED/DOC)</option>
                  <option value="CARTAO">Cartão de Crédito / Débito</option>
                  <option value="BOLETO">Boleto Bancário</option>
                  <option value="OUTRO">Outro Meio</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Observações do Pagamento (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Parcela 2/5, comprovante enviado por WhatsApp, etc."
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Gravando...' : 'Confirmar e Dar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PagamentosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <PagamentosContent />
    </Suspense>
  );
}

