'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  HandCoins,
  Receipt,
  BarChart3,
  BellRing,
  Settings,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes / Devedores', icon: Users },
  { href: '/emprestimos', label: 'Empréstimos & Dívidas', icon: HandCoins },
  { href: '/pagamentos', label: 'Controle de Pagamentos', icon: Receipt },
  { href: '/relatorios', label: 'Relatórios & Exportação', icon: BarChart3 },
  { href: '/alertas', label: 'Alertas & Cobrança', icon: BellRing },
  { href: '/configuracoes', label: 'Configurações & Backup', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex`}
      >
        {/* App Logo & Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-white leading-tight block">
                Gestor Financeiro
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Controle de Dívidas Pro
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-emerald-100" />}
              </Link>
            );
          })}
        </div>

        {/* System Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="rounded-xl p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                Sistema Operacional
              </span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-800/80 dark:text-emerald-400">
              Cálculo de juros simples e compostos em tempo real.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

