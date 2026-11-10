'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BellRing,
  AlertTriangle,
  Clock,
  MessageCircle,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPhone, cleanDigits } from '@/lib/formatters';
import { generateWhatsAppReminder } from '@/lib/whatsapp';

export default function AlertasPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'OVERDUE' | 'UPCOMING' | 'NO_PAYMENT'>('ALL');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Varrendo dívidas e vencimentos...</p>
      </div>
    );
  }

  const settings = data.settings || {};
  const atrasados = data.emprestimosAtrasados || [];
  const proximos = data.vencimentosProximos || [];

  // Generate WhatsApp links for overdue
  const overdueWithLinks = atrasados.map((item: any) => {
    const wa = generateWhatsAppReminder({
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      loanDescription: item.description,
      dueDate: item.dueDate,
      originalAmount: item.originalAmount,
      totalUpdatedAmount: item.totalUpdatedAmount,
      interestAccrued: item.interestAccrued,
      daysLate: item.daysLate,
      creditorName: settings.creditorName || 'Gestor Financeiro',
      pixKey: settings.creditorPixKey || '',
      pixType: settings.creditorPixType || 'CHAVE_ALEATORIA',
      customTemplate: settings.whatsappTemplate,
    });
    return { ...item, type: 'OVERDUE', wa };
  });

  // Generate WhatsApp links for upcoming
  const upcomingWithLinks = proximos.map((item: any) => {
    const wa = generateWhatsAppReminder({
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      loanDescription: item.description,
      dueDate: item.dueDate,
      originalAmount: item.originalAmount,
      totalUpdatedAmount: item.totalUpdatedAmount,
      interestAccrued: item.interestAccrued,
      daysLate: 0,
      creditorName: settings.creditorName || 'Gestor Financeiro',
      pixKey: settings.creditorPixKey || '',
      pixType: settings.creditorPixType || 'CHAVE_ALEATORIA',
      customTemplate: settings.whatsappTemplate,
    });
    return { ...item, type: 'UPCOMING', wa };
  });

  let displayedAlerts: any[] = [];
  if (activeTab === 'OVERDUE') {
    displayedAlerts = overdueWithLinks;
  } else if (activeTab === 'UPCOMING') {
    displayedAlerts = upcomingWithLinks;
  } else {
    displayedAlerts = [...overdueWithLinks, ...upcomingWithLinks];
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BellRing className="h-7 w-7 text-emerald-600" />
            <span>Central de Alertas & Cobranças</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitoramento de vencimentos, notificações automáticas e cobrança direta via WhatsApp
          </p>
        </div>

        <Link
          href="/configuracoes"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>Configurar Chave PIX e Mensagem WhatsApp</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Todos os Alertas ({overdueWithLinks.length + upcomingWithLinks.length})
        </button>

        <button
          onClick={() => setActiveTab('OVERDUE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'OVERDUE'
              ? 'bg-rose-600 text-white'
              : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          Dívidas Atrasadas ({overdueWithLinks.length})
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            activeTab === 'UPCOMING'
              ? 'bg-amber-600 text-white'
              : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
          }`}
        >
          Vencendo em Breve ({upcomingWithLinks.length})
        </button>
      </div>

      {/* List of Alerts */}
      <div className="space-y-4">
        {displayedAlerts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Nenhum alerta pendente nesta categoria
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Todas as dívidas estão em dia e não há vencimentos nos próximos 7 dias.
            </p>
          </div>
        ) : (
          displayedAlerts.map((item: any, idx: number) => {
            const isLate = item.type === 'OVERDUE';
            return (
              <div
                key={idx}
                className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  isLate
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isLate
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {isLate ? <AlertTriangle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isLate
                            ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                            : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        {isLate ? `${item.daysLate} dias em atraso` : `Vence em ${item.daysRemaining} dias`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.customerName}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Data de Vencimento: <strong>{formatDate(item.dueDate)}</strong> • Telefone: {formatPhone(item.customerPhone)}
                    </p>

                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span>Original: <strong>{formatCurrency(item.originalAmount)}</strong></span>
                      <span>Juros Pendentes: <strong className="text-amber-600">{formatCurrency(item.interestAccrued)}</strong></span>
                      <span>Total Atualizado: <strong className="text-emerald-600 text-sm">{formatCurrency(item.totalUpdatedAmount)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                  <Link
                    href={`/emprestimos/${item.id}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                  >
                    Ver Extrato
                  </Link>

                  <a
                    href={item.wa.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Enviar Cobrança WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

