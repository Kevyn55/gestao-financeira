'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Eye,
  AlertCircle,
  X,
  Phone,
  FileText,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency, formatCPF, formatPhone, cleanDigits } from '@/lib/formatters';

interface Customer {
  id: string;
  name: string;
  cpf: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  totalLoans: number;
  activeLoansCount: number;
  overdueCount: number;
  totalBorrowed: number;
  totalPaid: number;
  currentDebt: number;
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : '/api/customers';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      cpf: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      cpf: customer.cpf || '',
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erro ao salvar cliente.');
        setSubmitting(false);
        return;
      }

      setModalOpen(false);
      loadCustomers();
    } catch (err) {
      setFormError('Erro ao comunicar com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (customer.currentDebt > 0.01) {
      alert(`Não é possível excluir "${customer.name}" pois ele possui um saldo devedor em aberto de ${formatCurrency(customer.currentDebt)}.`);
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o cliente "${customer.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao excluir.');
        return;
      }
      loadCustomers();
    } catch (e) {
      alert('Erro de conexão ao excluir.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Client Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-600" />
            <span>Cadastro de Clientes / Devedores</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie contatos, históricos e dados cadastrais de quem possui dívidas
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar cliente por nome, CPF, WhatsApp ou e-mail..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Customers Table / Card list */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum cliente encontrado
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {search ? 'Tente buscar com outro termo.' : 'Clique no botão acima para cadastrar seu primeiro cliente.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Nome / Devedor</th>
                  <th className="py-3.5 px-4">CPF</th>
                  <th className="py-3.5 px-4">WhatsApp / Contato</th>
                  <th className="py-3.5 px-4 text-center">Empréstimos</th>
                  <th className="py-3.5 px-4">Saldo Devedor Atual</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => {
                  const phoneDigits = cleanDigits(c.phone);
                  const waUrl = `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}`;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="hover:text-emerald-600 transition flex items-center gap-1.5"
                        >
                          <span>{c.name}</span>
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        </Link>
                        {c.address && (
                          <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs">
                            {c.address}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {c.cpf ? formatCPF(c.cpf) : <span className="text-slate-400">Não informado</span>}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span>{formatPhone(c.phone)}</span>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Conversar no WhatsApp"
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c.totalLoans} ({c.activeLoansCount} ativas)
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {c.currentDebt > 0.01 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(c.currentDebt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Quitado</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/clientes/${c.id}`}
                            title="Ver Histórico Completo"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(c)}
                            title="Editar Dados"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            title="Excluir Cliente"
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

      {/* MODAL: CRIAR / EDITAR CLIENTE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingCustomer ? 'Editar Devedor' : 'Novo Cadastro de Cliente'}
              </h2>
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

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Carlos da Silva"
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Endereço Completo (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações sobre garantias, dia preferencial de pagamento, etc."
                  className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingCustomer ? 'Atualizar Dados' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

