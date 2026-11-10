'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDate, formatCPF, formatPhone } from '@/lib/formatters';

export default function ComprovantePagamentoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payments/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Não encontrado');
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => router.push('/pagamentos'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Gerando comprovante de pagamento...</p>
      </div>
    );
  }

  const { payment, settings } = data;
  const isPaidOff = payment.remainingBalance <= 0.01;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/pagamentos"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Lista de Pagamentos</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>

      {/* COMPROVANTE OFICIAL ESTILIZADO */}
      <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white p-8 sm:p-10 shadow-lg text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Header do Comprovante */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-900 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                {settings?.creditorName || 'Gestor Financeiro'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {settings?.systemName || 'Sistema de Controle Financeiro e Dívidas'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Comprovante de Pagamento
            </span>
            <span className="block font-mono text-sm font-bold text-slate-800 mt-1">
              {payment.receiptNumber}
            </span>
            <span className="block text-[11px] text-slate-400">
              Emitido em: {formatDate(payment.createdAt)}
            </span>
          </div>
        </div>

        {/* Informações do Pagador / Devedor */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Dados do Devedor / Pagador
            </span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{payment.customer?.name}</p>
            {payment.customer?.cpf && (
              <p className="text-slate-600 font-mono">CPF: {formatCPF(payment.customer.cpf)}</p>
            )}
            <p className="text-slate-600">Telefone: {formatPhone(payment.customer?.phone)}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Contrato / Empréstimo Referência
            </span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{payment.loan?.code}</p>
            <p className="text-slate-600">
              Valor Original: {formatCurrency(payment.loan?.originalAmount)}
            </p>
            <p className="text-slate-600">
              Taxa Contratada: {payment.loan?.monthlyInterestRate}% a.m. (
              {payment.loan?.interestType === 'SIMPLE' ? 'Juros Simples' : 'Juros Compostos'})
            </p>
          </div>
        </div>

        {/* Destaque do Valor Pago */}
        <div className="mt-6 rounded-2xl bg-emerald-50 border-2 border-emerald-500/40 p-6 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Valor Total Efetivamente Pago
          </span>
          <div className="mt-1 text-3xl sm:text-4xl font-black text-emerald-700">
            {formatCurrency(payment.amount)}
          </div>
          <div className="mt-2 text-xs font-medium text-emerald-800 flex items-center justify-center gap-2">
            <span>Forma de Pagamento: <strong>{payment.paymentMethod}</strong></span>
            <span>•</span>
            <span>Data: <strong>{formatDate(payment.paymentDate)}</strong></span>
          </div>
        </div>

        {/* Desdobramento da Amortização */}
        <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="bg-slate-100 p-3 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Demonstrativo de Amortização
          </div>
          <div className="divide-y divide-slate-100 p-4 space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Parcela aplicada em Juros Vencidos/Acumulados:</span>
              <span className="font-bold text-amber-700 text-sm">
                {formatCurrency(payment.interestPaid)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">Parcela aplicada na Amortização do Capital Principal:</span>
              <span className="font-bold text-blue-700 text-sm">
                {formatCurrency(payment.principalPaid)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t-2 border-slate-200 font-bold">
              <span className="text-slate-900 text-sm">Saldo Devedor Restante Após Este Pagamento:</span>
              <span className={`text-base ${isPaidOff ? 'text-emerald-600' : 'text-slate-900'}`}>
                {isPaidOff ? 'R$ 0,00 (DÍVIDA QUITADA)' : formatCurrency(payment.remainingBalance)}
              </span>
            </div>
          </div>
        </div>

        {payment.notes && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-bold text-slate-700 block">Observações:</span>
            <span>{payment.notes}</span>
          </div>
        )}

        {/* Declaração de Autenticidade e Assinaturas */}
        <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>
            Reconhecemos o recebimento da quantia acima especificada, dando a devida quitação
            {isPaidOff ? ' total e irrevogável da dívida' : ' parcial dos valores discriminados'}.
          </p>

          <div className="mt-14 grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="mx-auto w-48 border-t border-slate-400" />
              <p className="mt-1 font-semibold text-slate-800">
                {settings?.creditorName || 'Credor / Gestor'}
              </p>
              <p className="text-[10px] text-slate-400">Assinatura do Credor</p>
            </div>

            <div>
              <div className="mx-auto w-48 border-t border-slate-400" />
              <p className="mt-1 font-semibold text-slate-800">{payment.customer?.name}</p>
              <p className="text-[10px] text-slate-400">Assinatura do Pagador</p>
            </div>
          </div>

          <div className="mt-8 font-mono text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-3">
            <span>Autenticação: {payment.id}</span>
            <span>Via do Cliente e do Credor</span>
          </div>
        </div>
      </div>
    </div>
  );
}

