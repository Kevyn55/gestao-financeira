'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  HandCoins,
  Calculator,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { calculateLoanState } from '@/lib/financialMath';
import { formatCurrency, formatDateForInput } from '@/lib/formatters';

function NovoEmprestimoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomer = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Default dates: today and 3 months ahead
  const today = new Date();
  const threeMonthsAhead = new Date(today);
  threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);

  const [formData, setFormData] = useState({
    customerId: preSelectedCustomer,
    originalAmount: '1000',
    loanDate: formatDateForInput(today),
    monthlyInterestRate: '5',
    interestType: 'COMPOUND',
    dueDate: formatDateForInput(threeMonthsAhead),
    billingDay: today.getDate().toString(),
    amortizationRule: 'INTEREST_FIRST',
    incompleteMonthRule: 'PRO_RATA',
    description: '',
  });

  useEffect(() => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        if (!formData.customerId && data.length > 0) {
          setFormData((prev) => ({ ...prev, customerId: data[0].id }));
        }
      })
      .finally(() => setLoadingCustomers(false));
  }, []);

  // Real-time calculation preview
  const numAmount = parseFloat(formData.originalAmount) || 0;
  const numRate = parseFloat(formData.monthlyInterestRate) || 0;

  let simulationResult: any = null;
  if (numAmount > 0 && formData.loanDate && formData.dueDate) {
    simulationResult = calculateLoanState(
      {
        originalAmount: numAmount,
        loanDate: formData.loanDate,
        monthlyInterestRate: numRate,
        interestType: formData.interestType,
        dueDate: formData.dueDate,
        amortizationRule: formData.amortizationRule,
        incompleteMonthRule: formData.incompleteMonthRule,
        payments: [],
      },
      formData.dueDate
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customerId) {
      setError('Por favor, selecione o cliente devedor.');
      return;
    }

    if (numAmount <= 0) {
      setError('O valor original deve ser maior que zero.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          originalAmount: numAmount,
          monthlyInterestRate: numRate,
          billingDay: parseInt(formData.billingDay) || 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao cadastrar empréstimo.');
        setSubmitting(false);
        return;
      }

      router.push(`/emprestimos/${data.id}`);
    } catch (err) {
      setError('Erro de conexão ao salvar empréstimo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/emprestimos"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HandCoins className="h-6 w-6 text-emerald-600" />
            <span>Cadastrar Novo Empréstimo</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Defina o capital concedido, taxa de juros, modalidade e vencimento
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-3.5 text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              1. Dados do Devedor e Contrato
            </h2>

            {/* Devedor Selector */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cliente / Devedor Vinculado *
                </label>
                <Link
                  href="/clientes"
                  className="text-[11px] font-semibold text-emerald-600 hover:underline"
                >
                  + Cadastrar novo cliente
                </Link>
              </div>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                {loadingCustomers ? (
                  <option>Carregando clientes...</option>
                ) : customers.length === 0 ? (
                  <option value="">Nenhum cliente cadastrado</option>
                ) : (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.cpf ? `(CPF: ${c.cpf})` : ''} - Tel: {c.phone}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Valor Original & Taxa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Valor Emprestado (R$) *
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-2.5 text-sm text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.originalAmount}
                    onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3.5 text-sm font-semibold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Taxa de Juros Mensal (%) *
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.monthlyInterestRate}
                    onChange={(e) => setFormData({ ...formData, monthlyInterestRate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-3.5 pr-8 text-sm font-semibold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-2.5 text-sm text-slate-400">% a.m.</span>
                </div>
              </div>
            </div>

            {/* Tipo de Juros & Dia Vencimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipo de Juros *
                </label>
                <select
                  value={formData.interestType}
                  onChange={(e) => setFormData({ ...formData, interestType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="COMPOUND">Juros Compostos [ M = C × (1 + i)^t ]</option>
                  <option value="SIMPLE">Juros Simples [ J = C × i × t ]</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dia de Vencimento Mensal (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.billingDay}
                  onChange={(e) => setFormData({ ...formData, billingDay: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data de Concessão do Empréstimo *
                </label>
                <input
                  type="date"
                  required
                  value={formData.loanDate}
                  onChange={(e) => setFormData({ ...formData, loanDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Data Prevista de Quitação / Vencimento *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Configurações Financeiras Avançadas */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              2. Regras de Amortização e Meses Incompletos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ordem de Amortização dos Pagamentos
                </label>
                <select
                  value={formData.amortizationRule}
                  onChange={(e) => setFormData({ ...formData, amortizationRule: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="INTEREST_FIRST">Juros Primeiro (Padrão Legal Art. 354 CC)</option>
                  <option value="PRINCIPAL_FIRST">Principal Primeiro (Abate Capital Imediato)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Define se pagamentos parciais quitam primeiro os juros vencidos ou o capital emprestado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tratamento de Meses Incompletos
                </label>
                <select
                  value={formData.incompleteMonthRule}
                  onChange={(e) => setFormData({ ...formData, incompleteMonthRule: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="PRO_RATA">Pro-Rata Die (Proporcional aos dias decorridos)</option>
                  <option value="FULL_MONTH">Mês Cheio (Fração de mês conta como mês completo)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Exato cálculo diário sem cobrança indevida ou distorções.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Descrição ou Observações do Empréstimo
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Empréstimo para capital de giro, compra de mercadorias, etc."
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/emprestimos"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : 'Confirmar e Cadastrar Empréstimo'}
              </button>
            </div>
          </div>
        </form>

        {/* Simulador em Tempo Real (Live Preview) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 border-b border-emerald-200/60 dark:border-emerald-900/40 pb-3">
              <Calculator className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold">Simulação em Tempo Real</h3>
            </div>

            {simulationResult ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Capital Inicial</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(simulationResult.originalAmount)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/40 dark:border-emerald-900/40">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Juros Previstos</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(simulationResult.totalInterestAccrued)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Regime</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {formData.interestType === 'SIMPLE' ? 'Simples' : 'Compostos'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-emerald-200/60 dark:border-emerald-900/60 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Montante Final no Vencimento
                  </span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                    {formatCurrency(simulationResult.totalUpdatedAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Calculado sem arredondamentos intermediários via Decimal.js
                  </span>
                </div>

                <div className="rounded-xl bg-emerald-100/60 dark:bg-emerald-900/40 p-3 text-[11px] text-emerald-900 dark:text-emerald-300">
                  <p className="font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Regra Contratual Ativa:</span>
                  </p>
                  <p className="mt-0.5">
                    {formData.amortizationRule === 'INTEREST_FIRST'
                      ? 'Pagamentos abaterão primeiro os juros vencidos (Art. 354 CC).'
                      : 'Pagamentos abaterão o capital principal diretamente.'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                Preencha os valores para simular a projeção.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NovoEmprestimoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <NovoEmprestimoForm />
    </Suspense>
  );
}

