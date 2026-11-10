'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Download,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  MessageSquare,
} from 'lucide-react';

export default function ConfiguracoesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');

  const [formData, setFormData] = useState({
    systemName: '',
    creditorName: '',
    creditorPixKey: '',
    creditorPixType: 'CHAVE_ALEATORIA',
    defaultAmortization: 'INTEREST_FIRST',
    defaultInterestType: 'COMPOUND',
    incompleteMonthRule: 'PRO_RATA',
    whatsappTemplate: '',
    adminName: '',
    adminEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({
          ...prev,
          systemName: data.settings?.systemName || '',
          creditorName: data.settings?.creditorName || '',
          creditorPixKey: data.settings?.creditorPixKey || '',
          creditorPixType: data.settings?.creditorPixType || 'CHAVE_ALEATORIA',
          defaultAmortization: data.settings?.defaultAmortization || 'INTEREST_FIRST',
          defaultInterestType: data.settings?.defaultInterestType || 'COMPOUND',
          incompleteMonthRule: data.settings?.incompleteMonthRule || 'PRO_RATA',
          whatsappTemplate: data.settings?.whatsappTemplate || '',
          adminName: data.user?.name || '',
          adminEmail: data.user?.email || '',
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('A nova senha e a confirmação não coincidem.');
        return;
      }
      if (!formData.currentPassword) {
        setErrorMsg('Informe a senha atual para autorizar a troca.');
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao salvar configurações.');
        setSaving(false);
        return;
      }

      setSuccessMsg('Configurações salvas com sucesso!');
      setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Erro de comunicação com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup/export';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: Restaurar este backup atualizará/inserirá todos os registros correspondentes no banco de dados. Deseja prosseguir?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setRestoreLoading(true);
    setRestoreMsg('');

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Erro ao restaurar backup.');
      } else {
        setRestoreMsg(data.message || 'Backup restaurado com sucesso!');
        loadSettings();
      }
    } catch (err) {
      alert('Arquivo de backup inválido ou corrompido.');
    } finally {
      setRestoreLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-500">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-emerald-600" />
          <span>Configurações & Backup do Sistema</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Personalize parâmetros de cálculo, chaves PIX de recebimento, segurança e cópias de segurança
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 p-4 text-xs font-semibold text-rose-800 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. DADOS DO CREDOR E RECEBIMENTO */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Dados do Credor & Recebimento PIX
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome do Credor / Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.creditorName}
                onChange={(e) => setFormData({ ...formData, creditorName: e.target.value })}
                placeholder="Ex: Gestor Financeiro Principal"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Título do Sistema / Aplicação
              </label>
              <input
                type="text"
                value={formData.systemName}
                onChange={(e) => setFormData({ ...formData, systemName: e.target.value })}
                placeholder="Gestão Financeira & Dívidas"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Chave PIX Oficial para Cobrança *
              </label>
              <input
                type="text"
                required
                value={formData.creditorPixKey}
                onChange={(e) => setFormData({ ...formData, creditorPixKey: e.target.value })}
                placeholder="exemplo@pix.com.br ou 000.000.000-00"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipo da Chave PIX
              </label>
              <select
                value={formData.creditorPixType}
                onChange={(e) => setFormData({ ...formData, creditorPixType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="EMAIL">E-mail</option>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="TELEFONE">Telefone</option>
                <option value="CHAVE_ALEATORIA">Chave Aleatória (EVP)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. REGRAS FINANCEIRAS PADRÃO */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Padrões de Cálculo e Amortização
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Amortização Padrão
              </label>
              <select
                value={formData.defaultAmortization}
                onChange={(e) => setFormData({ ...formData, defaultAmortization: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="INTEREST_FIRST">Juros Primeiro (Art. 354 CC)</option>
                <option value="PRINCIPAL_FIRST">Principal Primeiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Regime Padrão de Juros
              </label>
              <select
                value={formData.defaultInterestType}
                onChange={(e) => setFormData({ ...formData, defaultInterestType: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="COMPOUND">Juros Compostos</option>
                <option value="SIMPLE">Juros Simples</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Meses Incompletos
              </label>
              <select
                value={formData.incompleteMonthRule}
                onChange={(e) => setFormData({ ...formData, incompleteMonthRule: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="PRO_RATA">Pro-Rata Die (Dias)</option>
                <option value="FULL_MONTH">Mês Cheio</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. MENSAGEM WHATSAPP */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>3. Modelo de Mensagem de Cobrança WhatsApp</span>
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Texto da Mensagem (Variáveis disponíveis: {'{nome}'}, {'{descricao}'}, {'{vencimento}'}, {'{saldo}'}, {'{chavePix}'}, {'{credor}'})
            </label>
            <textarea
              rows={3}
              value={formData.whatsappTemplate}
              onChange={(e) => setFormData({ ...formData, whatsappTemplate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* 4. SEGURANÇA E ACESSO DO ADMINISTRADOR */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>4. Segurança e Acesso do Administrador</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome do Administrador
              </label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                E-mail de Login
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Senha Atual (para alterar)
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nova Senha
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Gravando...' : 'Salvar Todas as Configurações'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* 5. BACKUP E RESTAURAÇÃO DE DADOS (Requirement 9) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-600" />
          <span>5. Backup Completo e Restauração de Dados</span>
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Você pode exportar todos os clientes, dívidas, históricos de cálculos, pagamentos e configurações
          para um arquivo de backup seguro (.json) e restaurá-lo a qualquer momento.
        </p>

        {restoreMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{restoreMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Export Box */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Download className="h-4 w-4 text-emerald-600" />
              <span>Exportar Cópia de Segurança</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Gera um arquivo JSON contendo 100% dos dados para guardar com segurança.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Baixar Arquivo de Backup</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Upload className="h-4 w-4 text-teal-600" />
              <span>Restaurar a Partir de Arquivo</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Selecione um arquivo de backup (.json) para restaurar as informações no sistema.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreLoading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>{restoreLoading ? 'Restaurando...' : 'Selecionar Arquivo & Restaurar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

