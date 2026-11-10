'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Sun,
  Moon,
  PlusCircle,
  Receipt,
  LogOut,
  User,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from './ThemeContext';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Abrir Menu"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Painel de Controle Financeiro
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gestão precisa de dívidas, amortizações e juros
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action: New Loan */}
        <Link
          href="/emprestimos/novo"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Empréstimo</span>
        </Link>

        {/* Quick Action: New Payment */}
        <Link
          href="/pagamentos"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition"
        >
          <Receipt className="h-4 w-4" />
          <span className="hidden sm:inline">Dar Baixa</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-600" />
          )}
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 gap-2">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {user?.name || 'Administrador'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {user?.email || 'admin@gestao.com'}
            </span>
          </div>

          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <User className="h-4 w-4" />
          </div>

          <button
            onClick={handleLogout}
            title="Sair do Sistema"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

