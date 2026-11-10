'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/components/layout/ThemeContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Responsive Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

