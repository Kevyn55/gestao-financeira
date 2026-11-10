'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@gestao.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Credenciais inválidas.');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Gestão Financeira & Dívidas
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Acesse o sistema de controle financeiro e cálculos
          </p>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300">
              E-mail de Acesso
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300">
              Senha
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Autenticando...
              </span>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Acesso Inicial Rápido</span>
          </div>
          <p>
            E-mail: <strong className="text-white">admin@gestao.com</strong>
          </p>
          <p>
            Senha: <strong className="text-white">admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

